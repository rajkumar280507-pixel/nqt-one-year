import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db.js';
import { authenticateToken, isAdmin } from './middleware.js';
import { runCode } from './codeRunner.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

// Initialize DB Tables
async function initDB() {
  try {
    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        streak INTEGER DEFAULT 0,
        last_active_day INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        section VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        definition TEXT NOT NULL,
        parent_topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS vocabulary (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        term VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        example_sentence TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS days (
        day_number INTEGER PRIMARY KEY,
        month INTEGER NOT NULL,
        week INTEGER NOT NULL,
        concept_topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
        video_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        day_number INTEGER REFERENCES days(day_number) ON DELETE CASCADE,
        section VARCHAR(100) NOT NULL,
        type VARCHAR(100),
        question_text TEXT NOT NULL,
        options_json JSONB NOT NULL,
        correct_answer VARCHAR(255) NOT NULL,
        solution_explanation TEXT NOT NULL,
        difficulty VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS coding_problems (
        id SERIAL PRIMARY KEY,
        day_number INTEGER REFERENCES days(day_number) ON DELETE CASCADE,
        slot INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        statement TEXT NOT NULL,
        input_format TEXT,
        output_format TEXT,
        constraints TEXT,
        sample_tests_json JSONB NOT NULL,
        hidden_tests_json JSONB NOT NULL,
        hint TEXT,
        approach TEXT,
        solution_code_by_lang_json JSONB NOT NULL,
        topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
        difficulty VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        day_number INTEGER REFERENCES days(day_number) ON DELETE CASCADE,
        section VARCHAR(100) NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, day_number, section)
      );

      CREATE TABLE IF NOT EXISTS user_code_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        problem_id INTEGER REFERENCES coding_problems(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        code TEXT NOT NULL,
        passed_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mock_tests (
        id SERIAL PRIMARY KEY,
        month INTEGER UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        sections_json JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_mock_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        mock_test_id INTEGER REFERENCES mock_tests(id) ON DELETE CASCADE,
        score_json JSONB NOT NULL,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables successfully checked/created.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hash, name]
    );

    const user = result.rows[0];
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const valid = await bcryptjs.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, streak: user.streak }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Streak logic helper
async function recalculateStreak(userId) {
  const result = await db.query(
    `SELECT DISTINCT day_number FROM user_progress WHERE user_id = $1 ORDER BY day_number DESC`,
    [userId]
  );
  const completedDays = result.rows.map(r => r.day_number);
  if (completedDays.length === 0) return 0;

  let streak = 1;
  for (let i = 1; i < completedDays.length; i++) {
    if (completedDays[i-1] - completedDays[i] === 1) {
      streak++;
    } else {
      break;
    }
  }

  await db.query('UPDATE users SET streak = $1, last_active_day = $2 WHERE id = $3', [streak, completedDays[0], userId]);
  return streak;
}

// Get Day Content
app.get('/api/days/:dayNumber', authenticateToken, async (req, res) => {
  const dayNum = parseInt(req.params.dayNumber);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 365) {
    return res.status(400).json({ error: 'Invalid day number. Must be between 1 and 365.' });
  }

  try {
    // 1. Fetch Day basic details
    const dayResult = await db.query(
      `SELECT d.*, t.name as topic_name, t.definition as topic_definition
       FROM days d
       LEFT JOIN topics t ON d.concept_topic_id = t.id
       WHERE d.day_number = $1`,
      [dayNum]
    );

    if (dayResult.rows.length === 0) {
      return res.status(404).json({ error: 'Day not found or seeded yet.' });
    }

    const dayInfo = dayResult.rows[0];

    // 2. Fetch Vocabulary for topic
    let vocabulary = [];
    if (dayInfo.concept_topic_id) {
      const vocabResult = await db.query(
        'SELECT * FROM vocabulary WHERE topic_id = $1',
        [dayInfo.concept_topic_id]
      );
      vocabulary = vocabResult.rows;
    }

    // 3. Fetch user progress for this day
    const progressResult = await db.query(
      'SELECT section, attempts, correct_count FROM user_progress WHERE user_id = $1 AND day_number = $2',
      [req.user.id, dayNum]
    );
    const progressMap = {};
    progressResult.rows.forEach(p => {
      progressMap[p.section] = p;
    });

    // 4. Fetch MCQs (questions)
    const questionsResult = await db.query(
      'SELECT id, section, type, question_text, options_json, difficulty FROM questions WHERE day_number = $1',
      [dayNum]
    );

    // Progressive Reveal: If user has already completed/attempted the section, attach the correct answer & explanation.
    const questions = await Promise.all(questionsResult.rows.map(async (q) => {
      const isAttempted = progressMap[q.section] && progressMap[q.section].attempts > 0;
      if (isAttempted) {
        const fullQ = await db.query('SELECT correct_answer, solution_explanation FROM questions WHERE id = $1', [q.id]);
        return {
          ...q,
          correct_answer: fullQ.rows[0].correct_answer,
          solution_explanation: fullQ.rows[0].solution_explanation,
          attempted: true
        };
      }
      return { ...q, attempted: false };
    }));

    // 5. Fetch coding problems
    const codingResult = await db.query(
      `SELECT id, slot, title, statement, input_format, output_format, constraints, sample_tests_json, difficulty, hint, approach
       FROM coding_problems WHERE day_number = $1 ORDER BY slot`,
      [dayNum]
    );

    const codingProblems = await Promise.all(codingResult.rows.map(async (p) => {
      const sectionName = `Coding ${p.slot}`;
      const isAttempted = progressMap[sectionName] && progressMap[sectionName].attempts > 0;
      if (isAttempted) {
        const fullP = await db.query('SELECT solution_code_by_lang_json FROM coding_problems WHERE id = $1', [p.id]);
        return {
          ...p,
          solution_code_by_lang_json: fullP.rows[0].solution_code_by_lang_json,
          attempted: true
        };
      }
      return { ...p, attempted: false };
    }));

    res.json({
      day: dayInfo,
      vocabulary,
      questions,
      codingProblems,
      progress: progressMap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Answer MCQ Question
app.post('/api/days/:dayNumber/answer', authenticateToken, async (req, res) => {
  const dayNum = parseInt(req.params.dayNumber);
  const { sectionId, questionId, answer } = req.body;

  if (!sectionId || !questionId) {
    return res.status(400).json({ error: 'sectionId and questionId are required.' });
  }

  try {
    const qResult = await db.query('SELECT correct_answer, solution_explanation FROM questions WHERE id = $1', [questionId]);
    if (qResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const question = qResult.rows[0];
    const isCorrect = String(question.correct_answer).trim().toLowerCase() === String(answer).trim().toLowerCase();

    // Increment attempts and update correct_count in user_progress
    const currentProgress = await db.query(
      'SELECT attempts, correct_count FROM user_progress WHERE user_id = $1 AND day_number = $2 AND section = $3',
      [req.user.id, dayNum, sectionId]
    );

    if (currentProgress.rows.length === 0) {
      await db.query(
        `INSERT INTO user_progress (user_id, day_number, section, attempts, correct_count)
         VALUES ($1, $2, $3, 1, $4)`,
        [req.user.id, dayNum, sectionId, isCorrect ? 1 : 0]
      );
    } else {
      const current = currentProgress.rows[0];
      await db.query(
        `UPDATE user_progress 
         SET attempts = attempts + 1, correct_count = correct_count + $1
         WHERE user_id = $2 AND day_number = $3 AND section = $4`,
        [isCorrect ? 1 : 0, req.user.id, dayNum, sectionId]
      );
    }

    const streak = await recalculateStreak(req.user.id);

    res.json({
      correct: isCorrect,
      correctAnswer: question.correct_answer,
      solutionExplanation: question.solution_explanation,
      streak
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Concept / Section as Completed
app.post('/api/days/:dayNumber/complete', authenticateToken, async (req, res) => {
  const dayNum = parseInt(req.params.dayNumber);
  const { sectionId } = req.body; // e.g., 'Concept'

  if (!sectionId) {
    return res.status(400).json({ error: 'sectionId is required.' });
  }

  try {
    const existing = await db.query(
      'SELECT attempts FROM user_progress WHERE user_id = $1 AND day_number = $2 AND section = $3',
      [req.user.id, dayNum, sectionId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO user_progress (user_id, day_number, section, attempts, correct_count)
         VALUES ($1, $2, $3, 1, 1)`,
        [req.user.id, dayNum, sectionId]
      );
    }

    const streak = await recalculateStreak(req.user.id);
    res.json({ success: true, streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Code Submission Route
app.post('/api/code/run', authenticateToken, async (req, res) => {
  const { language, source, problemId } = req.body;

  if (!language || !source || !problemId) {
    return res.status(400).json({ error: 'language, source, and problemId are required.' });
  }

  try {
    const pResult = await db.query('SELECT * FROM coding_problems WHERE id = $1', [problemId]);
    if (pResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const problem = pResult.rows[0];
    const runResult = await runCode(language, source, problem);

    if (runResult.error) {
      return res.json({
        passed: false,
        passed_count: 0,
        total_count: runResult.total_count || 1,
        error: runResult.error
      });
    }

    // Save submission to DB
    await db.query(
      `INSERT INTO user_code_submissions (user_id, problem_id, language, code, passed_count, total_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, problemId, language, source, runResult.passed_count, runResult.total_count]
    );

    // Update section progress ('Coding 1' or 'Coding 2')
    const sectionName = `Coding ${problem.slot}`;
    const existingProgress = await db.query(
      'SELECT attempts, correct_count FROM user_progress WHERE user_id = $1 AND day_number = $2 AND section = $3',
      [req.user.id, problem.day_number, sectionName]
    );

    const isFullyCorrect = runResult.passed_count === runResult.total_count;

    if (existingProgress.rows.length === 0) {
      await db.query(
        `INSERT INTO user_progress (user_id, day_number, section, attempts, correct_count)
         VALUES ($1, $2, $3, 1, $4)`,
        [req.user.id, problem.day_number, sectionName, isFullyCorrect ? 1 : 0]
      );
    } else {
      await db.query(
        `UPDATE user_progress
         SET attempts = attempts + 1, correct_count = CASE WHEN $1 = TRUE THEN 1 ELSE correct_count END
         WHERE user_id = $2 AND day_number = $3 AND section = $4`,
        [isFullyCorrect, req.user.id, problem.day_number, sectionName]
      );
    }

    const streak = await recalculateStreak(req.user.id);

    res.json({
      passed: runResult.passed,
      passed_count: runResult.passed_count,
      total_count: runResult.total_count,
      results: runResult.results,
      streak
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summary & Analytics Dashboard
app.get('/api/progress/summary', authenticateToken, async (req, res) => {
  try {
    // 1. User stats (streak)
    const userResult = await db.query('SELECT streak FROM users WHERE id = $1', [req.user.id]);
    const streak = userResult.rows[0]?.streak || 0;

    // 2. Completed Days (days where at least 1 section is marked complete/done)
    const completedDaysResult = await db.query(
      'SELECT COUNT(DISTINCT day_number) as count FROM user_progress WHERE user_id = $1',
      [req.user.id]
    );
    const totalDaysDone = parseInt(completedDaysResult.rows[0]?.count || 0);

    // 3. Accuracy by Section
    const accuracyResult = await db.query(
      `SELECT section, SUM(correct_count) as correct, SUM(attempts) as attempts
       FROM user_progress
       WHERE user_id = $1
       GROUP BY section`,
      [req.user.id]
    );

    const accuracyBySection = {};
    // Seed default sections
    ['Concept', 'Aptitude', 'Reasoning', 'Verbal', 'Programming Logic', 'Coding 1', 'Coding 2'].forEach(s => {
      accuracyBySection[s] = { correct: 0, attempts: 0, percentage: 0 };
    });

    accuracyResult.rows.forEach(r => {
      const pct = r.attempts > 0 ? Math.round((r.correct / r.attempts) * 100) : 0;
      accuracyBySection[r.section] = {
        correct: parseInt(r.correct),
        attempts: parseInt(r.attempts),
        percentage: pct
      };
    });

    // 4. Weak Topics: Topics where user has attempts > 0 and correct percentage is below 60%
    const weakTopicsResult = await db.query(
      `SELECT t.name, t.section, SUM(up.correct_count) as correct, SUM(up.attempts) as attempts
       FROM user_progress up
       JOIN days d ON up.day_number = d.day_number
       JOIN topics t ON d.concept_topic_id = t.id
       WHERE up.user_id = $1 AND up.attempts > 0 AND up.section != 'Concept'
       GROUP BY t.id, t.name, t.section
       HAVING (SUM(up.correct_count)::float / SUM(up.attempts)::float) < 0.6
       LIMIT 5`,
      [req.user.id]
    );

    const weakTopics = weakTopicsResult.rows.map(r => ({
      name: r.name,
      section: r.section,
      accuracy: Math.round((r.correct / r.attempts) * 100)
    }));

    // 5. Activity Log (All completions for Calendar & recent)
    const allActivity = await db.query(
      `SELECT day_number, COUNT(section) as completed_sections
       FROM user_progress
       WHERE user_id = $1
       GROUP BY day_number
       ORDER BY day_number DESC`,
      [req.user.id]
    );

    res.json({
      streak,
      totalDaysDone,
      accuracyBySection,
      weakTopics,
      recentActivity: allActivity.rows.slice(0, 7),
      allActivity: allActivity.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Topics list
app.get('/api/topics', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, COUNT(q.id) as questions_count 
       FROM topics t 
       LEFT JOIN days d ON d.concept_topic_id = t.id
       LEFT JOIN questions q ON q.day_number = d.day_number
       GROUP BY t.id 
       ORDER BY t.section, t.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Topic by ID
app.get('/api/topics/:id', async (req, res) => {
  const topicId = parseInt(req.params.id);
  if (isNaN(topicId)) {
    return res.status(400).json({ error: 'Invalid topic ID.' });
  }

  try {
    const topicResult = await db.query('SELECT * FROM topics WHERE id = $1', [topicId]);
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const vocabResult = await db.query('SELECT * FROM vocabulary WHERE topic_id = $1', [topicId]);
    const questionsResult = await db.query(
      `SELECT q.id, q.day_number, q.section, q.difficulty, q.question_text, q.options_json 
       FROM questions q 
       JOIN days d ON q.day_number = d.day_number 
       WHERE d.concept_topic_id = $1`,
      [topicId]
    );

    res.json({
      topic: topicResult.rows[0],
      vocabulary: vocabResult.rows,
      questions: questionsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Mock Tests
app.get('/api/mock-tests', authenticateToken, async (req, res) => {
  try {
    const mocks = await db.query('SELECT id, month, name, sections_json FROM mock_tests ORDER BY month');
    const attempts = await db.query(
      'SELECT mock_test_id, score_json, taken_at FROM user_mock_attempts WHERE user_id = $1',
      [req.user.id]
    );

    const attemptsMap = {};
    attempts.rows.forEach(a => {
      attemptsMap[a.mock_test_id] = a;
    });

    res.json(mocks.rows.map(m => ({
      ...m,
      attempted: !!attemptsMap[m.id],
      attempt_details: attemptsMap[m.id] || null
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Mock Test
app.post('/api/mock-tests/:id/submit', authenticateToken, async (req, res) => {
  const mockId = parseInt(req.params.id);
  const { score_json } = req.body;

  if (isNaN(mockId) || !score_json) {
    return res.status(400).json({ error: 'mockId and score_json are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO user_mock_attempts (user_id, mock_test_id, score_json)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, mockId, JSON.stringify(score_json)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Video URL (Admin only)
app.post('/api/admin/video-url', authenticateToken, isAdmin, async (req, res) => {
  const { topicId, url } = req.body;

  if (!topicId || !url) {
    return res.status(400).json({ error: 'topicId and url are required.' });
  }

  try {
    // Update days with concept_topic_id = topicId
    const result = await db.query(
      'UPDATE days SET video_url = $1 WHERE concept_topic_id = $2 RETURNING *',
      [url, topicId]
    );

    res.json({ message: `Successfully updated video URL for ${result.rowCount} days.`, rows: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Coding Problems list for coding bank
app.get('/api/coding-problems', async (req, res) => {
  const { difficulty, topic_id } = req.query;
  try {
    let query = 'SELECT id, day_number, slot, title, difficulty, topic_id FROM coding_problems WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    if (difficulty) {
      query += ` AND difficulty = $${paramIndex++}`;
      params.push(difficulty);
    }
    if (topic_id) {
      query += ` AND topic_id = $${paramIndex++}`;
      params.push(parseInt(topic_id));
    }
    query += ' ORDER BY day_number, slot';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for random selection
const selectRandom = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Retrieve randomized questions/coding problems for Mock Test
app.get('/api/mock-tests/:id/questions', authenticateToken, async (req, res) => {
  const mockId = parseInt(req.params.id);
  try {
    const mockResult = await db.query('SELECT * FROM mock_tests WHERE id = $1', [mockId]);
    if (mockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mock test not found.' });
    }
    const mockTest = mockResult.rows[0];
    const month = mockTest.month;
    const startDay = (month - 1) * 30 + 1;
    const endDay = month * 30;

    const getQuestionsForSection = async (sectionName, limitCount) => {
      let result = await db.query(
        'SELECT id, day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty FROM questions WHERE section = $1 AND day_number BETWEEN $2 AND $3',
        [sectionName, startDay, endDay]
      );
      let selected = selectRandom(result.rows, limitCount);
      if (selected.length < limitCount) {
        const needed = limitCount - selected.length;
        const fallbackResult = await db.query(
          'SELECT id, day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty FROM questions WHERE section = $1 AND day_number NOT BETWEEN $2 AND $3',
          [sectionName, startDay, endDay]
        );
        const extra = selectRandom(fallbackResult.rows, needed);
        selected = [...selected, ...extra];
      }
      return selected;
    };

    const getCodingProblemsForMock = async (limitCount) => {
      let result = await db.query(
        'SELECT id, day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, difficulty FROM coding_problems WHERE day_number BETWEEN $2 AND $3',
        [startDay, endDay]
      );
      if (!result.rows.length) {
        result = await db.query(
          'SELECT id, day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, difficulty FROM coding_problems WHERE day_number BETWEEN $1 AND $2',
          [startDay, endDay]
        );
      }
      let selected = selectRandom(result.rows, limitCount);
      if (selected.length < limitCount) {
        const needed = limitCount - selected.length;
        const fallbackResult = await db.query(
          'SELECT id, day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, difficulty FROM coding_problems WHERE day_number NOT BETWEEN $1 AND $2',
          [startDay, endDay]
        );
        const extra = selectRandom(fallbackResult.rows, needed);
        selected = [...selected, ...extra];
      }
      return selected;
    };

    const aptitude = await getQuestionsForSection('Aptitude', 20);
    const reasoning = await getQuestionsForSection('Reasoning', 25);
    const verbal = await getQuestionsForSection('Verbal', 20);
    const advancedMcqs = await getQuestionsForSection('Programming Logic', 15);
    const coding = await getCodingProblemsForMock(2);

    res.json({
      mock_test: mockTest,
      foundation: {
        aptitude,
        reasoning,
        verbal
      },
      advanced: {
        mcqs: advancedMcqs,
        coding
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add/Edit Question
app.post('/api/admin/questions', authenticateToken, isAdmin, async (req, res) => {
  const { id, day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty } = req.body;
  if (!day_number || !section || !question_text || !options_json || !correct_answer || !solution_explanation || !difficulty) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    if (id) {
      const result = await db.query(
        `UPDATE questions 
         SET day_number = $1, section = $2, type = $3, question_text = $4, options_json = $5, correct_answer = $6, solution_explanation = $7, difficulty = $8
         WHERE id = $9 RETURNING *`,
        [day_number, section, type, question_text, JSON.stringify(options_json), correct_answer, solution_explanation, difficulty, id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO questions (day_number, section, type, question_text, options_json, correct_answer, solution_explanation, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [day_number, section, type, question_text, JSON.stringify(options_json), correct_answer, solution_explanation, difficulty]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add/Edit Coding Problem
app.post('/api/admin/coding-problems', authenticateToken, isAdmin, async (req, res) => {
  const { id, day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, topic_id, difficulty } = req.body;
  if (!day_number || !slot || !title || !statement || !sample_tests_json || !hidden_tests_json || !solution_code_by_lang_json || !difficulty) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }
  try {
    const topicIdVal = topic_id ? parseInt(topic_id) : null;
    if (id) {
      const result = await db.query(
        `UPDATE coding_problems
         SET day_number = $1, slot = $2, title = $3, statement = $4, input_format = $5, output_format = $6, constraints = $7, sample_tests_json = $8, hidden_tests_json = $9, hint = $10, approach = $11, solution_code_by_lang_json = $12, topic_id = $13, difficulty = $14
         WHERE id = $15 RETURNING *`,
        [day_number, slot, title, statement, input_format, output_format, constraints, JSON.stringify(sample_tests_json), JSON.stringify(hidden_tests_json), hint, approach, JSON.stringify(solution_code_by_lang_json), topicIdVal, difficulty, id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO coding_problems (day_number, slot, title, statement, input_format, output_format, constraints, sample_tests_json, hidden_tests_json, hint, approach, solution_code_by_lang_json, topic_id, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [day_number, slot, title, statement, input_format, output_format, constraints, JSON.stringify(sample_tests_json), JSON.stringify(hidden_tests_json), hint, approach, JSON.stringify(solution_code_by_lang_json), topicIdVal, difficulty]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, '../dist'))) {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start Server after setting up DB
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDB();
});
