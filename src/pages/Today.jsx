import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle, Play, Eye, BookOpen, HelpCircle, FileText, Code2, 
  ChevronRight, ArrowLeft, ArrowRight, Lightbulb, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Today({ token, user, updateUserData }) {
  const [searchParams] = useSearchParams();
  const [dayNumber, setDayNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dayData, setDayData] = useState(null);
  
  // MCQ state
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: selectedValue }
  const [revealedSolutions, setRevealedSolutions] = useState({}); // { questionId: { correct, explanation, correctAns } }
  const [mcqLoading, setMcqLoading] = useState({}); // { questionId: boolean }

  // Coding state
  const [activeCodingTab, setActiveCodingTab] = useState(0); // 0 = Easy, 1 = Easy-Medium
  const [codingLanguage, setCodingLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState({}); // { problemId: code }
  const [revealedHints, setRevealedHints] = useState({}); // { problemId: boolean }
  const [revealedApproaches, setRevealedApproaches] = useState({}); // { problemId: boolean }
  const [revealedCodes, setRevealedCodes] = useState({}); // { problemId: boolean }
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeRunResults, setCodeRunResults] = useState({}); // { problemId: resultObject }

  // Check-in state
  const [sectionsChecked, setSectionsChecked] = useState({}); // { sectionName: boolean }
  const [completionLoading, setCompletionLoading] = useState(false);

  // Active section view
  const [activeSection, setActiveSection] = useState('concept'); // concept, aptitude, reasoning, verbal, programming, coding, checkin

  useEffect(() => {
    // Resolve day from search params or default to user's next active day or 1
    const dayParam = searchParams.get('day');
    if (dayParam) {
      setDayNumber(parseInt(dayParam));
    } else if (user) {
      setDayNumber(Math.max(1, user.last_active_day || 1));
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (dayNumber) {
      fetchDayData();
      setSelectedAnswers({});
      setRevealedSolutions({});
      setActiveCodingTab(0);
      setRevealedHints({});
      setRevealedApproaches({});
      setRevealedCodes({});
      setCodeRunResults({});
      setActiveSection('concept');
    }
  }, [dayNumber]);

  const fetchDayData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/days/${dayNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch day content.');
      }
      setDayData(data);
      
      // Initialize code editors with solution templates or empty templates
      const codeMap = {};
      data.codingProblems.forEach(p => {
        if (p.attempted && p.solution_code_by_lang_json) {
          codeMap[p.id] = p.solution_code_by_lang_json[codingLanguage] || '';
        } else {
          codeMap[p.id] = getCodeTemplate(codingLanguage, p.title);
        }
      });
      setCodeContent(codeMap);

      // Initialize completed sections check-in state
      const checkinMap = {};
      ['Concept', 'Aptitude', 'Reasoning', 'Verbal', 'Programming Logic', 'Coding 1', 'Coding 2'].forEach(sec => {
        checkinMap[sec] = !!data.progress[sec];
      });
      setSectionsChecked(checkinMap);

      // Setup revealed solutions for questions already attempted
      const solutionsMap = {};
      data.questions.forEach(q => {
        if (q.attempted) {
          solutionsMap[q.id] = {
            correct: true, // doesn't matter for view
            correctAns: q.correct_answer,
            explanation: q.solution_explanation
          };
        }
      });
      setRevealedSolutions(solutionsMap);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCodeTemplate = (lang, title) => {
    if (lang === 'python') {
      return `# ${title}\n# Write your Python 3 code here\nimport sys\n\n# Read inputs from stdin\n# Example: data = sys.stdin.read().split()\n`;
    } else if (lang === 'cpp') {
      return `// ${title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write C++ code here\n    return 0;\n}\n`;
    } else if (lang === 'java') {
      return `// ${title}\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write Java code here\n    }\n}\n`;
    }
    return '';
  };

  // Change code templates when language changes
  const handleLanguageChange = (lang) => {
    setCodingLanguage(lang);
    if (!dayData) return;
    const codeMap = { ...codeContent };
    dayData.codingProblems.forEach(p => {
      // If they already revealed code, use the correct seeded code
      if (p.solution_code_by_lang_json && revealedCodes[p.id]) {
        codeMap[p.id] = p.solution_code_by_lang_json[lang] || '';
      } else {
        codeMap[p.id] = getCodeTemplate(lang, p.title);
      }
    });
    setCodeContent(codeMap);
  };

  // MCQ answer submit
  const handleAnswerSubmit = async (questionId, sectionId) => {
    const selected = selectedAnswers[questionId];
    if (!selected) return;

    setMcqLoading(prev => ({ ...prev, [questionId]: true }));
    try {
      const response = await fetch(`/api/days/${dayNumber}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sectionId, questionId, answer: selected })
      });
      const data = await response.json();
      
      setRevealedSolutions(prev => ({
        ...prev,
        [questionId]: {
          correct: data.correct,
          correctAns: data.correctAnswer,
          explanation: data.solutionExplanation
        }
      }));

      // Update local progress indicator
      setDayData(prev => {
        const next = { ...prev };
        next.progress[sectionId] = { attempts: 1, correct_count: data.correct ? 1 : 0 };
        return next;
      });

      // Update streak
      if (data.streak !== undefined && user) {
        updateUserData({ ...user, streak: data.streak });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setMcqLoading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Complete section (e.g. Concept completion)
  const handleSectionComplete = async (sectionId) => {
    setCompletionLoading(true);
    try {
      const response = await fetch(`/api/days/${dayNumber}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sectionId })
      });
      const data = await response.json();
      
      setSectionsChecked(prev => ({ ...prev, [sectionId]: true }));
      
      // Update streak
      if (data.streak !== undefined && user) {
        updateUserData({ ...user, streak: data.streak });
      }

      // If they check off all sections, fire confetti!
      const totalSections = ['Concept', 'Aptitude', 'Reasoning', 'Verbal', 'Programming Logic', 'Coding 1', 'Coding 2'];
      const currentChecked = { ...sectionsChecked, [sectionId]: true };
      const allDone = totalSections.every(sec => currentChecked[sec]);
      if (allDone) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setCompletionLoading(false);
    }
  };

  // Code Runner
  const handleRunCode = async (problemId, slot) => {
    const code = codeContent[problemId];
    if (!code) return;

    setCodeRunning(true);
    try {
      const response = await fetch(`/api/code/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language: codingLanguage, source: code, problemId })
      });
      const data = await response.json();

      setCodeRunResults(prev => ({
        ...prev,
        [problemId]: data
      }));

      // Update progress checkbox
      const sectionName = `Coding ${slot}`;
      if (data.passed) {
        setSectionsChecked(prev => ({ ...prev, [sectionName]: true }));
        // Play small confetti for solving coding problem
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 }
        });
      }

      // Update streak
      if (data.streak !== undefined && user) {
        updateUserData({ ...user, streak: data.streak });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setCodeRunning(false);
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    // Standardize URL to embed format
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtu.be/')) {
      const id = url.split('/').pop().split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtube.com/watch')) {
      const search = new URL(url).searchParams;
      return `https://www.youtube.com/embed/${search.get('v')}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading study syllabus for Day {dayNumber}...</p>
      </div>
    );
  }

  if (error || !dayData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Error Loading Day</p>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mt-2">{error || 'Could not load day details.'}</p>
        <Link to="/calendar" className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700">
          Back to Calendar
        </Link>
      </div>
    );
  }

  const { day, vocabulary, questions, codingProblems } = dayData;

  const currentCodingProblem = codingProblems[activeCodingTab];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Day Header Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-semibold tracking-widest text-primary-600 dark:text-primary-400 uppercase bg-primary-50 dark:bg-primary-950/40 px-3 py-1 rounded-full">
            Month {day.month} • Week {day.week}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            Day {day.day_number} Plan: {day.topic_name}
          </h1>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex items-center gap-3">
          <button
            disabled={dayNumber <= 1}
            onClick={() => setDayNumber(dayNumber - 1)}
            className="flex items-center gap-1.5 px-4 h-11 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Prev
          </button>
          <span className="font-bold text-sm text-slate-700 dark:text-slate-300 min-w-16 text-center">
            Day {dayNumber}/365
          </span>
          <button
            disabled={dayNumber >= 365}
            onClick={() => setDayNumber(dayNumber + 1)}
            className="flex items-center gap-1.5 px-4 h-11 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Sidebar for choosing sections */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
              Daily Sections
            </h3>
            
            <button
              onClick={() => setActiveSection('concept')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all ${
                activeSection === 'concept'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4.5 h-4.5" />
                <span>1. Concept of the Day</span>
              </div>
              {sectionsChecked['Concept'] && <CheckCircle className={`w-4 h-4 ${activeSection === 'concept' ? 'text-white' : 'text-emerald-500'}`} />}
            </button>

            <button
              onClick={() => setActiveSection('aptitude')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all mt-1 ${
                activeSection === 'aptitude'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4.5 h-4.5" />
                <span>2. Aptitude (MCQs)</span>
              </div>
              {sectionsChecked['Aptitude'] && <CheckCircle className={`w-4 h-4 ${activeSection === 'aptitude' ? 'text-white' : 'text-emerald-500'}`} />}
            </button>

            <button
              onClick={() => setActiveSection('reasoning')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all mt-1 ${
                activeSection === 'reasoning'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4.5 h-4.5" />
                <span>3. Reasoning Ability</span>
              </div>
              {sectionsChecked['Reasoning'] && <CheckCircle className={`w-4 h-4 ${activeSection === 'reasoning' ? 'text-white' : 'text-emerald-500'}`} />}
            </button>

            <button
              onClick={() => setActiveSection('verbal')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all mt-1 ${
                activeSection === 'verbal'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5" />
                <span>4. Verbal Ability</span>
              </div>
              {sectionsChecked['Verbal'] && <CheckCircle className={`w-4 h-4 ${activeSection === 'verbal' ? 'text-white' : 'text-emerald-500'}`} />}
            </button>

            <button
              onClick={() => setActiveSection('programming')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all mt-1 ${
                activeSection === 'programming'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4.5 h-4.5" />
                <span>5. Programming Logic</span>
              </div>
              {sectionsChecked['Programming Logic'] && <CheckCircle className={`w-4 h-4 ${activeSection === 'programming' ? 'text-white' : 'text-emerald-500'}`} />}
            </button>

            <button
              onClick={() => setActiveSection('coding')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all mt-1 ${
                activeSection === 'coding'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4.5 h-4.5" />
                <span>6. Coding Problems</span>
              </div>
              {(sectionsChecked['Coding 1'] && sectionsChecked['Coding 2']) && (
                <CheckCircle className={`w-4 h-4 ${activeSection === 'coding' ? 'text-white' : 'text-emerald-500'}`} />
              )}
            </button>

            <button
              onClick={() => setActiveSection('checkin')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-all mt-4 border border-dashed border-slate-300 dark:border-slate-700 ${
                activeSection === 'checkin'
                  ? 'bg-emerald-600 text-white border-transparent'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Check className="w-4.5 h-4.5" />
                <span>7. Check-in & Finish</span>
              </div>
              {Object.values(sectionsChecked).every(Boolean) && <CheckCircle className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right column: Active Section Detailed Workspace */}
        <div className="lg:col-span-9">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm min-h-[500px]">
            
            {/* 1. CONCEPT OF THE DAY */}
            {activeSection === 'concept' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Concept of the Day</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Understand the fundamentals before practicing questions.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-850 dark:text-slate-200">{day.topic_name}</h3>
                  <p className="text-slate-650 dark:text-slate-350 text-sm leading-relaxed mt-2">{day.topic_definition}</p>
                </div>

                {/* Video slot */}
                {day.video_url && (
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                      <Play className="w-4.5 h-4.5 text-primary-500 fill-current" /> Lecture & Concepts Explanation
                    </h4>
                    <div className="aspect-video w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-inner">
                      <iframe
                        src={getYoutubeEmbedUrl(day.video_url)}
                        title="TCS NQT Prep Video"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* Vocabulary Lists */}
                {vocabulary && vocabulary.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Vocabulary & Terms ({vocabulary.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vocabulary.map((vocab) => (
                        <div key={vocab.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                          <span className="font-bold text-sm text-primary-600 dark:text-primary-400">{vocab.term}</span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{vocab.meaning}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1.5">"{vocab.example_sentence}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Check off Concept */}
                {!sectionsChecked['Concept'] && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleSectionComplete('Concept')}
                      disabled={completionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
                    >
                      {completionLoading ? 'Completing...' : 'Mark Concept as Studied ✅'}
                    </button>
                  </div>
                )}
                {sectionsChecked['Concept'] && (
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <CheckCircle className="w-5 h-5 fill-current text-white" />
                    <span>Concept completed for today! Feel free to practice the questions next.</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. APTITUDE / 3. REASONING / 4. VERBAL / 5. PROGRAMMING LOGIC */}
            {['aptitude', 'reasoning', 'verbal', 'programming'].includes(activeSection) && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white capitalize">
                    {activeSection === 'programming' ? 'Programming Logic' : `${activeSection} Ability`}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Attempt the questions below. Solutions reveal automatically once submitted.
                  </p>
                </div>

                <div className="space-y-8">
                  {questions
                    .filter(q => q.section.toLowerCase().includes(activeSection))
                    .map((q, idx) => {
                      const isRevealed = !!revealedSolutions[q.id];
                      const sol = revealedSolutions[q.id];
                      
                      return (
                        <div key={q.id} className="p-6 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-350">Question {idx + 1}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.difficulty === 'Easy' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>

                          <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                            {q.question_text}
                          </p>

                          {/* Options */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {q.options_json.map((opt) => {
                              const isSelected = selectedAnswers[q.id] === opt;
                              const showCorrect = isRevealed && opt === sol?.correctAns;
                              const showWrong = isRevealed && isSelected && !sol?.correct;

                              return (
                                <button
                                  key={opt}
                                  disabled={isRevealed}
                                  onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                  className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium text-left transition-all ${
                                    showCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                      : showWrong
                                      ? 'bg-rose-50 dark:bg-rose-950/25 border-rose-500 text-rose-700 dark:text-rose-400'
                                      : isSelected
                                      ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-700 dark:text-primary-400'
                                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {showCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                                  {showWrong && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Submit button */}
                          {!isRevealed && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleAnswerSubmit(q.id, q.section)}
                                disabled={!selectedAnswers[q.id] || mcqLoading[q.id]}
                                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition"
                              >
                                {mcqLoading[q.id] ? 'Checking...' : 'Check Answer'}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Solution Explanation Panel */}
                          {isRevealed && sol && (
                            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <Lightbulb className="w-4 h-4 text-amber-500 fill-current" />
                                <span>Explanation & Worked Steps</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                                Correct Answer: <strong className="text-emerald-600 dark:text-emerald-400">{sol.correctAns}</strong>
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {sol.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Complete Category checkbox */}
                {questions.filter(q => q.section.toLowerCase().includes(activeSection)).length > 0 && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Make sure you attempted all {activeSection} questions before checking off.
                    </span>
                    
                    {/* Mark Section Complete */}
                    {!sectionsChecked[activeSection === 'programming' ? 'Programming Logic' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)] ? (
                      <button
                        onClick={() => handleSectionComplete(activeSection === 'programming' ? 'Programming Logic' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1))}
                        disabled={completionLoading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                      >
                        {completionLoading ? 'Checking...' : `Mark ${activeSection} Section Done ✅`}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                        <Check className="w-4 h-4" />
                        Section completed!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6. CODING PROBLEMS */}
            {activeSection === 'coding' && currentCodingProblem && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Coding Problems (DSA)</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Solve two structured coding problems each day inside the browser editor.
                  </p>
                </div>

                {/* Tabs to toggle between Code 1 & Code 2 */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  {codingProblems.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveCodingTab(idx)}
                      className={`px-4 py-2.5 font-semibold text-sm -mb-px border-b-2 transition-all ${
                        activeCodingTab === idx
                          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Problem {idx + 1} ({p.difficulty})
                    </button>
                  ))}
                </div>

                {/* Selected Problem Description */}
                <div className="space-y-5">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{currentCodingProblem.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Difficulty: {currentCodingProblem.difficulty}
                    </span>
                  </div>

                  <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-350 space-y-4">
                    <p className="whitespace-pre-line leading-relaxed">{currentCodingProblem.statement}</p>
                    
                    {currentCodingProblem.input_format && (
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">Input Format:</strong>
                        <p className="whitespace-pre-line text-xs font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800 mt-1">
                          {currentCodingProblem.input_format}
                        </p>
                      </div>
                    )}

                    {currentCodingProblem.output_format && (
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">Output Format:</strong>
                        <p className="whitespace-pre-line text-xs font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800 mt-1">
                          {currentCodingProblem.output_format}
                        </p>
                      </div>
                    )}

                    {currentCodingProblem.constraints && (
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">Constraints:</strong>
                        <p className="text-xs font-mono mt-1 text-rose-600 dark:text-rose-400">{currentCodingProblem.constraints}</p>
                      </div>
                    )}

                    {/* Sample Test Cases */}
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Sample Test Cases:</strong>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {currentCodingProblem.sample_tests_json.map((tc, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-1">
                            <span className="font-bold text-[10px] text-slate-400">Sample Case {idx + 1}</span>
                            <div>
                              <span className="text-primary-600 font-bold">Input:</span>
                              <pre className="whitespace-pre-wrap mt-0.5 text-slate-700 dark:text-slate-300">{tc.input}</pre>
                            </div>
                            <div className="pt-1.5 border-t border-slate-150 dark:border-slate-800">
                              <span className="text-emerald-600 font-bold">Output:</span>
                              <pre className="whitespace-pre-wrap mt-0.5 text-slate-700 dark:text-slate-300">{tc.output}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progressive Reveal Drawer (Hints, Approach, Solution) */}
                <div className="flex flex-wrap gap-2.5 pt-4">
                  {/* Hint */}
                  {!revealedHints[currentCodingProblem.id] ? (
                    <button
                      onClick={() => setRevealedHints(prev => ({ ...prev, [currentCodingProblem.id]: true }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 rounded-lg text-xs font-bold border border-amber-200/50 dark:border-amber-900/30"
                    >
                      <Eye className="w-3.5 h-3.5" /> Reveal Hint
                    </button>
                  ) : (
                    <div className="w-full p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <strong>💡 Hint:</strong> {currentCodingProblem.hint}
                    </div>
                  )}

                  {/* Approach */}
                  {!revealedApproaches[currentCodingProblem.id] ? (
                    <button
                      onClick={() => setRevealedApproaches(prev => ({ ...prev, [currentCodingProblem.id]: true }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200/50 dark:border-blue-900/30"
                    >
                      <Eye className="w-3.5 h-3.5" /> Reveal Approach
                    </button>
                  ) : (
                    <div className="w-full p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-900/20 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                      <strong>⚙️ Approach:</strong> {currentCodingProblem.approach}
                    </div>
                  )}

                  {/* Solution Code */}
                  {!revealedCodes[currentCodingProblem.id] ? (
                    <button
                      onClick={() => {
                        setRevealedCodes(prev => ({ ...prev, [currentCodingProblem.id]: true }));
                        // If solutions are loaded, copy the solution into the editor for review
                        if (currentCodingProblem.solution_code_by_lang_json) {
                          const sol = currentCodingProblem.solution_code_by_lang_json[codingLanguage] || '';
                          if (sol) setCodeContent(prev => ({ ...prev, [currentCodingProblem.id]: sol }));
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 rounded-lg text-xs font-bold border border-purple-200/50 dark:border-purple-900/30"
                    >
                      <Eye className="w-3.5 h-3.5" /> Reveal Solution Code
                    </button>
                  ) : (
                    <div className="w-full p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/40 dark:border-purple-900/20 rounded-xl text-xs text-purple-800 dark:text-purple-300">
                      <strong>💻 Official Solution:</strong> Solution code has been unlocked. Select language to view in the code editor, or check the reference solution.
                    </div>
                  )}
                </div>

                {/* IDE Workspace (Editor + Output) */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">In-Browser Code Editor</span>
                    
                    {/* Language Selector */}
                    <select
                      value={codingLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-xs font-bold py-1.5 px-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="python">Python 3</option>
                      <option value="cpp">C++ (g++)</option>
                      <option value="java">Java (JDK)</option>
                    </select>
                  </div>

                  {/* Standard Textarea Code Editor */}
                  <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-slate-100 font-mono text-sm leading-relaxed">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs text-slate-400">
                      <span>solution.{codingLanguage === 'python' ? 'py' : codingLanguage === 'cpp' ? 'cpp' : 'java'}</span>
                      <span>Tab spaces: 4</span>
                    </div>

                    <textarea
                      value={codeContent[currentCodingProblem.id] || ''}
                      onChange={(e) => setCodeContent(prev => ({ ...prev, [currentCodingProblem.id]: e.target.value }))}
                      placeholder="Write code here..."
                      className="w-full h-80 p-4 bg-slate-950 text-slate-100 font-mono text-sm focus:outline-none resize-none border-0"
                      spellCheck={false}
                    />
                  </div>

                  {/* Action Bar (Run code) */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tests will be executed against 3 sample and 5 hidden test cases.
                    </span>

                    <button
                      onClick={() => handleRunCode(currentCodingProblem.id, activeCodingTab + 1)}
                      disabled={codeRunning}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 disabled:opacity-40 transition-all"
                    >
                      {codeRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" /> Run Code & Test
                        </>
                      )}
                    </button>
                  </div>

                  {/* Execution Results Display */}
                  {codeRunResults[currentCodingProblem.id] && (
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Execution Results</h4>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          codeRunResults[currentCodingProblem.id].passed
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}>
                          {codeRunResults[currentCodingProblem.id].passed ? 'ALL TESTS PASSED' : 'TESTS FAILED'} 
                          ({codeRunResults[currentCodingProblem.id].passed_count}/{codeRunResults[currentCodingProblem.id].total_count})
                        </span>
                      </div>

                      {/* Compilation Error or Sandbox failure */}
                      {codeRunResults[currentCodingProblem.id].error && (
                        <pre className="p-3 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap">
                          {codeRunResults[currentCodingProblem.id].error}
                        </pre>
                      )}

                      {/* Individual Test Cases Reports */}
                      {codeRunResults[currentCodingProblem.id].results && (
                        <div className="space-y-2">
                          {codeRunResults[currentCodingProblem.id].results.map((res, index) => (
                            <div key={index} className="p-3 border border-slate-150 dark:border-slate-850 rounded-lg bg-white dark:bg-slate-950 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div>
                                <span className="font-bold text-slate-500">Case {index + 1}: </span>
                                <span className={res.passed ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                                  {res.passed ? 'Success' : 'Incorrect Output'}
                                </span>
                                {index < 3 && (
                                  <div className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
                                    <p>Input: {res.input}</p>
                                    <p>Expected: {res.expected}</p>
                                    <p>Actual: {res.actual}</p>
                                  </div>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                res.passed 
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                              }`}>
                                {res.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. DAILY CHECK-IN & SUBMISSION */}
            {activeSection === 'checkin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Daily Progress Check-in</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Mark off each section once completed. Build your streak and accuracy levels.
                  </p>
                </div>

                {/* Section Checklist */}
                <div className="space-y-3 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                  {['Concept', 'Aptitude', 'Reasoning', 'Verbal', 'Programming Logic', 'Coding 1', 'Coding 2'].map((sec) => (
                    <div key={sec} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          sectionsChecked[sec] 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {sectionsChecked[sec] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{sec}</span>
                      </div>
                      
                      {sectionsChecked[sec] ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1 rounded-full">
                          Completed ✅
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSectionComplete(sec)}
                          disabled={completionLoading}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-slate-650 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-200 dark:border-slate-700 hover:border-primary-200 rounded-lg text-xs font-semibold transition"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Completion summary */}
                <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  {Object.values(sectionsChecked).every(Boolean) ? (
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">🎓 Day {day.day_number} fully completed!</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Awesome job! You've tackled the concept, all mock questions, and solved the coding problems. Your streak has been updated.
                      </p>
                      <div className="pt-2">
                        <Link
                          to={`/today?day=${dayNumber + 1}`}
                          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:from-primary-700 hover:to-indigo-700 transition"
                        >
                          Start Day {dayNumber + 1} Plan <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Sections Pending Completion</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Complete all 7 checklist sections above to unlock full daily points and trigger the completion reward.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
