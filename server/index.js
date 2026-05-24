import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
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
    try {
      const tableInfo = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sqltricks' AND column_name = 'section'
      `);
      if (tableInfo.rows.length === 0) {
        console.log('Migrating sqltricks table to the new Tricks module schema...');
        await db.query(`
          DROP TABLE IF EXISTS user_trick_mastery CASCADE;
          DROP TABLE IF EXISTS trick_drills CASCADE;
          DROP TABLE IF EXISTS sqltricks CASCADE;
        `);
      }
    } catch (e) {
      // Table might not exist yet, ignore
    }

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

      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        day_number INTEGER UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        level VARCHAR(50) NOT NULL,
        body TEXT NOT NULL,
        vocab_terms_json JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS comics (
        id SERIAL PRIMARY KEY,
        day_number INTEGER UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        panels_json JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS listening (
        id SERIAL PRIMARY KEY,
        day_number INTEGER UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        transcript TEXT NOT NULL,
        mcqs_json JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vocab_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        term VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        example TEXT NOT NULL,
        tamil_gloss VARCHAR(255),
        hindi_gloss VARCHAR(255),
        leitner_box INTEGER DEFAULT 1,
        next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(100),
        UNIQUE (user_id, term)
      );

      CREATE TABLE IF NOT EXISTS ai_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dsa_lessons (
        slug VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        narration_frames_json JSONB NOT NULL,
        animation_frames_json JSONB NOT NULL,
        code_by_lang_json JSONB NOT NULL,
        broken_version_by_lang_json JSONB NOT NULL,
        test_cases_json JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS speaking_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        transcript TEXT NOT NULL,
        ai_feedback_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sqltricks (
        id SERIAL PRIMARY KEY,
        section VARCHAR(100) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        trick_name VARCHAR(255) NOT NULL,
        when_to_spot TEXT NOT NULL,
        formula_text TEXT NOT NULL,
        intuition TEXT NOT NULL,
        trap_box TEXT NOT NULL,
        worked_examples_json JSONB NOT NULL,
        long_vs_short_examples_json JSONB NOT NULL,
        difficulty_tier INTEGER NOT NULL DEFAULT 1,
        prerequisite_trick_ids INTEGER[]
      );

      CREATE TABLE IF NOT EXISTS trick_drills (
        id SERIAL PRIMARY KEY,
        trick_id INTEGER REFERENCES sqltricks(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options_json JSONB NOT NULL,
        correct_answer VARCHAR(255) NOT NULL,
        solution_using_trick TEXT NOT NULL,
        expected_solve_time_sec INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quick_formulas (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        formula_text VARCHAR(255) NOT NULL,
        use_when_hint TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_trick_mastery (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        trick_id INTEGER REFERENCES sqltricks(id) ON DELETE CASCADE,
        drills_attempted INTEGER DEFAULT 0,
        drills_correct INTEGER DEFAULT 0,
        best_avg_time_sec REAL,
        last_drilled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mastery_score INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, trick_id)
      );
    `);
    console.log('Database tables successfully checked/created.');

    // Check if database needs seeding
    const topicsCheck = await db.query('SELECT COUNT(*) FROM topics');
    if (parseInt(topicsCheck.rows[0].count) === 0) {
      console.log('Database is empty. Running auto-seeding in background...');
      exec('node server/seed.js', (error, stdout, stderr) => {
        if (error) {
          console.error(`Auto-seeding error: ${error.message}`);
          return;
        }
        console.log('Auto-seeding completed successfully.');
      });
    }
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
app.get('/api/topics', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        t.id,
        t.section,
        t.name,
        t.definition,
        t.parent_topic_id,
        COALESCE(v.vocab_count, 0)::integer as vocab_count,
        COALESCE(tr.tricks_count, 0)::integer as tricks_count,
        COALESCE(q.questions_count, 0)::integer as questions_count,
        COALESCE(m.mastery_score, 0)::integer as mastery_score
       FROM topics t
       LEFT JOIN (
         SELECT topic_id, COUNT(*) as vocab_count FROM vocabulary GROUP BY topic_id
       ) v ON v.topic_id = t.id
       LEFT JOIN (
         SELECT topic_id, COUNT(*) as tricks_count FROM sqltricks GROUP BY topic_id
       ) tr ON tr.topic_id = t.id
       LEFT JOIN (
         SELECT d.concept_topic_id, COUNT(*) as questions_count 
         FROM questions q 
         JOIN days d ON q.day_number = d.day_number 
         GROUP BY d.concept_topic_id
       ) q ON q.concept_topic_id = t.id
       LEFT JOIN (
         SELECT tr.topic_id, ROUND(AVG(utm.mastery_score)) as mastery_score
         FROM sqltricks tr
         JOIN user_trick_mastery utm ON utm.trick_id = tr.id
         WHERE utm.user_id = $1
         GROUP BY tr.topic_id
       ) m ON m.topic_id = t.id
       ORDER BY t.section, t.name`,
      [req.user.id]
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

function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Get Topic by Slug (with vocabulary, formulas, tricks, and drills metadata)
app.get('/api/topics/slug/:slug', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  try {
    const topicsRes = await db.query('SELECT * FROM topics');
    const topic = topicsRes.rows.find(t => slugify(t.name) === slug);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topicId = topic.id;

    // Fetch vocabulary
    const vocabResult = await db.query('SELECT * FROM vocabulary WHERE topic_id = $1', [topicId]);

    // Fetch formulas
    const formulasResult = await db.query('SELECT * FROM quick_formulas WHERE topic_id = $1', [topicId]);

    // Fetch tricks joined with user trick mastery
    const tricksResult = await db.query(
      `SELECT t.*, 
              COALESCE(m.attempts, 0) as attempts, 
              COALESCE(m.correct, 0) as correct, 
              m.best_avg_time_sec, 
              m.last_drilled_at, 
              COALESCE(m.mastery_score, 0) as mastery_score 
       FROM sqltricks t 
       LEFT JOIN user_trick_mastery m ON t.id = m.trick_id AND m.user_id = $2
       WHERE t.topic_id = $1 
       ORDER BY t.position_order`,
      [topicId, req.user.id]
    );

    // Fetch practice questions from days linked to this topic
    const questionsResult = await db.query(
      `SELECT q.id, q.day_number, q.section, q.type, q.question_text, q.options_json, q.difficulty 
       FROM questions q 
       JOIN days d ON q.day_number = d.day_number 
       WHERE d.concept_topic_id = $1`,
      [topicId]
    );

    // Also get user answers/progress for these questions
    const progressResult = await db.query(
      `SELECT day_number, section, attempts, correct_count 
       FROM user_progress 
       WHERE user_id = $1`,
      [req.user.id]
    );
    const progressMap = {};
    progressResult.rows.forEach(p => {
      progressMap[`${p.day_number}:${p.section}`] = p;
    });

    // Attach answer & explanation to questions that the user has already attempted
    const questions = await Promise.all(questionsResult.rows.map(async (q) => {
      const isAttempted = progressMap[`${q.day_number}:${q.section}`] && progressMap[`${q.day_number}:${q.section}`].attempts > 0;
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

    res.json({
      topic,
      vocabulary: vocabResult.rows,
      formulas: formulasResult.rows,
      tricks: tricksResult.rows,
      questions,
      progress: progressMap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Trick Drill questions (3 random questions for the trick)
app.get('/api/tricks/:trickId/drill', authenticateToken, async (req, res) => {
  const trickId = parseInt(req.params.trickId);
  try {
    const drillResult = await db.query(
      'SELECT id, trick_id, question_text, options_json, expected_solve_time_sec FROM trick_drills WHERE trick_id = $1',
      [trickId]
    );
    const selected = selectRandom(drillResult.rows, 3);
    res.json(selected);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Trick Drill result
app.post('/api/tricks/:trickId/drill/submit', authenticateToken, async (req, res) => {
  const trickId = parseInt(req.params.trickId);
  const { correctCount, timeTakenSec } = req.body;
  const userId = req.user.id;

  try {
    const currentRes = await db.query(
      'SELECT * FROM user_trick_mastery WHERE user_id = $1 AND trick_id = $2',
      [userId, trickId]
    );

    let attempts = 3;
    let correct = correctCount || 0;
    let bestAvgTime = parseFloat(timeTakenSec) / 3;
    let masteryScore = 0;

    let diff = -20;
    if (correct === 3) diff = 35;
    else if (correct === 2) diff = 10;

    if (currentRes.rows.length > 0) {
      const current = currentRes.rows[0];
      attempts = current.attempts + 3;
      correct = current.correct + correctCount;
      if (current.best_avg_time_sec) {
        bestAvgTime = Math.min(current.best_avg_time_sec, bestAvgTime);
      }
      masteryScore = Math.max(0, Math.min(100, current.mastery_score + diff));

      await db.query(
        `UPDATE user_trick_mastery 
         SET attempts = $1, correct = $2, best_avg_time_sec = $3, last_drilled_at = CURRENT_TIMESTAMP, mastery_score = $4
         WHERE user_id = $5 AND trick_id = $6`,
        [attempts, correct, bestAvgTime, masteryScore, userId, trickId]
      );
    } else {
      masteryScore = Math.max(0, Math.min(100, diff));
      await db.query(
        `INSERT INTO user_trick_mastery (user_id, trick_id, attempts, correct, best_avg_time_sec, mastery_score)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, trickId, attempts, correct, bestAvgTime, masteryScore]
      );
    }

    const trickRes = await db.query(
      'SELECT t.topic_id, d.day_number FROM sqltricks t JOIN days d ON d.concept_topic_id = t.topic_id WHERE t.id = $1 LIMIT 1',
      [trickId]
    );

    let dayNumber = 1;
    if (trickRes.rows.length > 0) {
      dayNumber = trickRes.rows[0].day_number;
    }

    const sectionName = `Trick Drill ${trickId}`;
    await db.query(
      `INSERT INTO user_progress (user_id, day_number, section, attempts, correct_count)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT (user_id, day_number, section) 
       DO UPDATE SET attempts = user_progress.attempts + 1, correct_count = user_progress.correct_count + $4`,
      [userId, dayNumber, sectionName, correctCount === 3 ? 1 : 0]
    );

    const streak = await recalculateStreak(userId);

    res.json({
      success: true,
      masteryScore,
      streak
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Speed Drill questions (10 random questions from topic's tricks)
app.get('/api/topics/slug/:slug/speed-drill', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  try {
    const topicsRes = await db.query('SELECT id FROM topics');
    const topic = topicsRes.rows.find(t => slugify(t.name) === slug);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topicId = topic.id;
    const drillsRes = await db.query(
      `SELECT d.id, d.trick_id, d.question_text, d.options_json, d.expected_solve_time_sec, t.name as trick_name
       FROM trick_drills d
       JOIN sqltricks t ON d.trick_id = t.id
       WHERE t.topic_id = $1`,
      [topicId]
    );

    const selected = selectRandom(drillsRes.rows, 10);
    res.json(selected);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Speed Drill results
app.post('/api/topics/slug/:slug/speed-drill/submit', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  const { correctCount, timeTakenSec } = req.body;
  const userId = req.user.id;
  try {
    const topicsRes = await db.query('SELECT id FROM topics');
    const topic = topicsRes.rows.find(t => slugify(t.name) === slug);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topicId = topic.id;
    const trickRes = await db.query('SELECT day_number FROM days WHERE concept_topic_id = $1 LIMIT 1', [topicId]);
    const dayNumber = trickRes.rows.length > 0 ? trickRes.rows[0].day_number : 1;

    const sectionName = `Speed Drill ${topicId}`;
    await db.query(
      `INSERT INTO user_progress (user_id, day_number, section, attempts, correct_count)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT (user_id, day_number, section) 
       DO UPDATE SET attempts = user_progress.attempts + 1, correct_count = user_progress.correct_count + $4`,
      [userId, dayNumber, sectionName, correctCount >= 6 ? 1 : 0]
    );

    const streak = await recalculateStreak(userId);
    res.json({ success: true, streak });
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

// ==========================================
// AI Tutor Chat & Speech Evaluators
// ==========================================
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const userId = req.user.id;

  try {
    // 1. Rate limiting check (50 requests/day per user)
    const limitCheck = await db.query(
      `SELECT COUNT(*) FROM ai_messages WHERE user_id = $1 AND role = 'user' AND created_at >= CURRENT_DATE`,
      [userId]
    );
    const messageCount = parseInt(limitCheck.rows[0].count);
    if (messageCount >= 50) {
      return res.status(429).json({
        error: 'Daily AI response limit (50 messages) reached. Try again tomorrow, or practice vocabulary cards below!'
      });
    }

    const systemInstruction = `You are a kind, patient English-language tutor and TCS-NQT exam coach for a beginner Indian engineering student. Use simple English, max 12 words per sentence. If the student writes in Tamil or Hindi, gently reply in English with a one-line meaning, and encourage them to try again in English. Never make them feel bad. Praise effort. When they ask a math/coding/reasoning question, explain step by step with a tiny example first. Refuse to give exam answers if they describe a live test; otherwise help freely. IMPORTANT: You MUST append a vocabulary helper list in the format "[Words to learn: word1, word2]" at the very end of your response listing 2-3 new vocabulary words used in your reply.`;

    const normalizedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // Save user message to database
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      await db.query(
        'INSERT INTO ai_messages (user_id, role, content) VALUES ($1, $2, $3)',
        [userId, 'user', lastUserMsg.content]
      );
    }

    let replyText = '';
    let apiSuccess = false;

    // Call Primary AI: Groq API
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: normalizedMessages,
            temperature: 0.7
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          replyText = groqData.choices[0].message.content;
          apiSuccess = true;
        } else {
          console.warn(`Groq API returned status ${groqRes.status}. Trying Gemini fallback...`);
        }
      } catch (err) {
        console.error('Groq API error. Trying Gemini fallback...', err);
      }
    }

    // Call Fallback AI: Google Gemini API
    if (!apiSuccess && process.env.GEMINI_API_KEY) {
      try {
        const serializedPrompt = normalizedMessages.map(m => {
          if (m.role === 'system') return `System Instructions:\n${m.content}\n`;
          return `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`;
        }).join('\n\n') + '\n\nTutor:';

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: serializedPrompt }]
              }]
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          replyText = geminiData.candidates[0].content.parts[0].text;
          apiSuccess = true;
        } else {
          console.error(`Gemini API returned status ${geminiRes.status}`);
        }
      } catch (err) {
        console.error('Gemini API error:', err);
      }
    }

    if (!apiSuccess) {
      replyText = "I need a short rest. Try again in a few minutes. [Words to learn: patience, resilience]";
    }

    // Parse the vocabulary list from the footer: [Words to learn: word1, word2]
    let suggestedVocab = [];
    const vocabMatch = replyText.match(/\[Words to learn:\s*([^\]]+)\]/i);
    if (vocabMatch) {
      suggestedVocab = vocabMatch[1].split(',').map(w => w.trim());
      replyText = replyText.replace(/\[Words to learn:\s*[^\]]+\]/i, '').trim();
    }

    // Save AI response to database
    await db.query(
      'INSERT INTO ai_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'assistant', replyText]
    );

    res.json({ reply: replyText, suggestedVocab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/grade-speaking', authenticateToken, async (req, res) => {
  const { prompt, transcript } = req.body;
  if (!prompt || !transcript) {
    return res.status(400).json({ error: 'Prompt and transcript are required.' });
  }

  const userId = req.user.id;

  const gradingPrompt = `You are a professional English language tutor. Grade this student response:
Prompt question: "${prompt}"
Student transcript: "${transcript}"

Analyze grammar and vocabulary, and return ONLY a valid JSON object matching this schema:
{
  "corrections": [
    { "original": "incorrect speech part", "corrected": "corrected speech part", "explanation": "one sentence explanation" }
  ],
  "vocabSuggestions": [
    { "original": "simple word used", "suggested": "advanced word", "reason": "why this is better" }
  ],
  "pronunciationFeedback": "General advice e.g. pronounce past-tense words clearly.",
  "modelAnswer": "A clean, professional sample answer of 50-70 words."
}
Only output the raw JSON object. Do not wrap in markdown \`\`\`json blocks.`;

  let responseData = null;
  let apiSuccess = false;

  // Primary: Groq API
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: gradingPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        responseData = JSON.parse(groqData.choices[0].message.content);
        apiSuccess = true;
      }
    } catch (err) {
      console.error('Groq grading error. Falling back to Gemini...', err);
    }
  }

  // Fallback: Gemini API
  if (!apiSuccess && process.env.GEMINI_API_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: gradingPrompt }] }]
          })
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        let rawText = geminiData.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/i, '').replace(/```/g, '').trim();
        responseData = JSON.parse(rawText);
        apiSuccess = true;
      }
    } catch (err) {
      console.error('Gemini grading error:', err);
    }
  }

  if (!apiSuccess) {
    responseData = {
      corrections: [],
      vocabSuggestions: [],
      pronunciationFeedback: "AI grading services are currently offline. Keep practicing!",
      modelAnswer: "English practice is the key to software recruitment success."
    };
  }

  try {
    await db.query(
      `INSERT INTO speaking_attempts (user_id, prompt, transcript, ai_feedback_json) VALUES ($1, $2, $3, $4)`,
      [userId, prompt, transcript, JSON.stringify(responseData)]
    );
    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Leitner Vocabulary Deck APIs
// ==========================================
app.post('/api/vocab/add', authenticateToken, async (req, res) => {
  const { term, meaning, example, tamil_gloss, hindi_gloss, source } = req.body;
  if (!term || !meaning || !example) {
    return res.status(400).json({ error: 'Term, meaning, and example are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO vocab_cards (user_id, term, meaning, example, tamil_gloss, hindi_gloss, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, term) DO UPDATE 
       SET meaning = EXCLUDED.meaning, example = EXCLUDED.example
       RETURNING *`,
      [req.user.id, term, meaning, example, tamil_gloss || null, hindi_gloss || null, source || 'manual']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vocab/due', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM vocab_cards 
       WHERE user_id = $1 AND next_review_date <= NOW() 
       ORDER BY leitner_box DESC, next_review_date ASC
       LIMIT 10`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vocab/review', authenticateToken, async (req, res) => {
  const { cardId, correct } = req.body;
  if (cardId === undefined || correct === undefined) {
    return res.status(400).json({ error: 'cardId and correct status are required.' });
  }

  try {
    const cardRes = await db.query(
      'SELECT id, leitner_box FROM vocab_cards WHERE id = $1 AND user_id = $2',
      [cardId, req.user.id]
    );
    if (cardRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary card not found.' });
    }

    const currentBox = cardRes.rows[0].leitner_box;
    let nextBox = 1;
    let daysToAdd = 1;

    if (correct) {
      nextBox = Math.min(5, currentBox + 1);
      daysToAdd = Math.pow(2, nextBox - 1);
    }

    const result = await db.query(
      `UPDATE vocab_cards 
       SET leitner_box = $1, next_review_date = NOW() + INTERVAL '${daysToAdd} days'
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [nextBox, cardId, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// English Modules & DSA Lab Curriculum APIs
// ==========================================
app.get('/api/english/story/:dayNumber', authenticateToken, async (req, res) => {
  try {
    const day = parseInt(req.params.dayNumber);
    const storyRes = await db.query('SELECT * FROM stories WHERE day_number = $1', [day]);
    const comicRes = await db.query('SELECT * FROM comics WHERE day_number = $1', [day]);
    res.json({
      story: storyRes.rows[0] || null,
      comic: comicRes.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/english/listening/:dayNumber', authenticateToken, async (req, res) => {
  try {
    const day = parseInt(req.params.dayNumber);
    const result = await db.query('SELECT * FROM listening WHERE day_number = $1', [day]);
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dsa/lesson/:slug', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dsa_lessons WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'DSA animated lesson not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Aptitude Tricks & Mastery APIs
// ==========================================
app.get('/api/tricks', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, 
              COALESCE(m.drills_attempted, 0) as drills_attempted,
              COALESCE(m.drills_correct, 0) as drills_correct,
              m.best_avg_time_sec,
              m.last_drilled_at,
              COALESCE(m.mastery_score, 0) as mastery_score
       FROM sqltricks t
       LEFT JOIN user_trick_mastery m ON t.id = m.trick_id AND m.user_id = $1
       ORDER BY t.section, t.id`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tricks/:id', authenticateToken, async (req, res) => {
  const trickId = parseInt(req.params.id);
  if (isNaN(trickId)) {
    return res.status(400).json({ error: 'Invalid trick ID.' });
  }

  try {
    const trickRes = await db.query(
      `SELECT t.*, 
              COALESCE(m.drills_attempted, 0) as drills_attempted,
              COALESCE(m.drills_correct, 0) as drills_correct,
              m.best_avg_time_sec,
              m.last_drilled_at,
              COALESCE(m.mastery_score, 0) as mastery_score
       FROM sqltricks t
       LEFT JOIN user_trick_mastery m ON t.id = m.trick_id AND m.user_id = $1
       WHERE t.id = $2`,
      [req.user.id, trickId]
    );

    if (trickRes.rows.length === 0) {
      return res.status(404).json({ error: 'Trick not found.' });
    }

    const drillsRes = await db.query(
      `SELECT id, question_text, options_json, correct_answer, solution_using_trick, expected_solve_time_sec
       FROM trick_drills
       WHERE trick_id = $1
       LIMIT 10`,
      [trickId]
    );

    res.json({
      trick: trickRes.rows[0],
      drills: drillsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tricks/:id/drill', authenticateToken, async (req, res) => {
  const trickId = parseInt(req.params.id);
  const { accuracy, avgTimeSec, drillCorrect, drillTotal } = req.body;

  if (isNaN(trickId) || accuracy === undefined || avgTimeSec === undefined || drillCorrect === undefined || drillTotal === undefined) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  try {
    const trickRes = await db.query('SELECT * FROM sqltricks WHERE id = $1', [trickId]);
    if (trickRes.rows.length === 0) {
      return res.status(404).json({ error: 'Trick not found.' });
    }

    const expectedTime = 30; // standard 30s per question
    const correctPct = accuracy; // 0 to 100
    const timeScore = 100 * Math.max(0, 1 - (avgTimeSec - expectedTime) / expectedTime);
    const recencyScore = 100;
    const masteryScore = Math.min(100, Math.round(0.5 * correctPct + 0.3 * timeScore + 0.2 * recencyScore));

    const existingRes = await db.query(
      `SELECT drills_attempted, best_avg_time_sec 
       FROM user_trick_mastery 
       WHERE user_id = $1 AND trick_id = $2`,
      [req.user.id, trickId]
    );

    if (existingRes.rows.length === 0) {
      await db.query(
        `INSERT INTO user_trick_mastery 
         (user_id, trick_id, drills_attempted, drills_correct, best_avg_time_sec, last_drilled_at, mastery_score)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
         [req.user.id, trickId, drillTotal, drillCorrect, avgTimeSec, masteryScore]
      );
    } else {
      const current = existingRes.rows[0];
      const bestTime = current.best_avg_time_sec ? Math.min(current.best_avg_time_sec, avgTimeSec) : avgTimeSec;
      
      await db.query(
        `UPDATE user_trick_mastery
         SET drills_attempted = drills_attempted + $1,
             drills_correct = drills_correct + $2,
             best_avg_time_sec = $3,
             last_drilled_at = NOW(),
             mastery_score = $4
         WHERE user_id = $5 AND trick_id = $6`,
        [drillTotal, drillCorrect, bestTime, masteryScore, req.user.id, trickId]
      );
    }

    res.json({ success: true, masteryScore });
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
