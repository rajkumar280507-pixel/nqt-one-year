import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Clock, CheckCircle2, ChevronLeft, ChevronRight, Play, Eye, 
  HelpCircle, AlertCircle, X, ShieldAlert, FileCode2, Lock, ArrowRight,
  BarChart, Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MockTests({ token, user }) {
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Exam simulator states
  const [activeMock, setActiveMock] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examPhase, setExamPhase] = useState(null); // 'foundation' | 'transition' | 'advanced' | 'result'
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Active question index in current phase
  // Phase 1 Foundation: 0 to 64 (Aptitude 0-19, Reasoning 20-44, Verbal 45-64)
  // Phase 2 Advanced: 0 to 16 (MCQs 0-14, Coding 15 & 16)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Selected Answers
  // { questionId: selectedOption }
  const [foundationAnswers, setFoundationAnswers] = useState({});
  const [advancedMcqAnswers, setAdvancedMcqAnswers] = useState({});
  
  // Coding Workspace State for Mock Exams
  // { problemId: { code, lang, passedCount, totalCount, results, error } }
  const [codingSubmissions, setCodingSubmissions] = useState({});
  const [activeCodeLang, setActiveCodeLang] = useState('python');
  const [activeCode, setActiveCode] = useState('');
  const [codeRunning, setCodeRunning] = useState(false);

  // Marked for Review
  // { questionId: boolean }
  const [markedForReview, setMarkedForReview] = useState({});
  
  // Navigation visits
  // { questionId: boolean }
  const [visitedQuestions, setVisitedQuestions] = useState({});

  // Review states (post-exam)
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewPhase, setReviewPhase] = useState('foundation'); // 'foundation' | 'advanced'
  const [reviewQuestionIdx, setReviewQuestionIdx] = useState(0);
  const [completedAttemptDetails, setCompletedAttemptDetails] = useState(null);

  useEffect(() => {
    fetchMocks();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (examPhase === 'foundation' || examPhase === 'advanced') {
      if (timeLeft <= 0) {
        handlePhaseTimeout();
        return;
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handlePhaseTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examPhase, timeLeft]);

  const fetchMocks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mock-tests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch mock tests.');
      setMocks(data);
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

  const handleStartExam = async (mock) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setError('');
    setExamLoading(true);
    setActiveMock(mock);
    setFoundationAnswers({});
    setAdvancedMcqAnswers({});
    setCodingSubmissions({});
    setMarkedForReview({});
    setVisitedQuestions({});
    setReviewMode(false);

    try {
      const response = await fetch(`/api/mock-tests/${mock.id}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load mock exam materials.');
      
      setQuestionsData(data);
      // Initialize visited
      const firstQId = data.foundation.aptitude[0]?.id;
      if (firstQId) {
        setVisitedQuestions({ [firstQId]: true });
      }

      // Enter Phase 1: Foundation (75 mins)
      setExamPhase('foundation');
      setTimeLeft(75 * 60); // 4500 seconds
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError(err.message);
      setActiveMock(null);
    } finally {
      setExamLoading(false);
    }
  };

  const getActiveQuestions = () => {
    if (!questionsData) return [];
    if (examPhase === 'foundation') {
      return [
        ...questionsData.foundation.aptitude,
        ...questionsData.foundation.reasoning,
        ...questionsData.foundation.verbal
      ];
    } else if (examPhase === 'advanced') {
      return [
        ...questionsData.advanced.mcqs,
        ...questionsData.advanced.coding
      ];
    }
    return [];
  };

  const handleSelectOption = (qId, optionKey) => {
    if (examPhase === 'foundation') {
      setFoundationAnswers(prev => ({ ...prev, [qId]: optionKey }));
    } else if (examPhase === 'advanced') {
      setAdvancedMcqAnswers(prev => ({ ...prev, [qId]: optionKey }));
    }
  };

  const handleMarkForReview = (qId) => {
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const navigateQuestion = (index) => {
    const questions = getActiveQuestions();
    if (index < 0 || index >= questions.length) return;
    
    // Mark next question visited
    const nextQ = questions[index];
    if (nextQ) {
      setVisitedQuestions(prev => ({ ...prev, [nextQ.id]: true }));
    }
    
    // Sync active coding workspace if transitioning to coding question in Advanced Phase
    if (examPhase === 'advanced' && index >= 15) {
      const codingProblem = questions[index];
      const saved = codingSubmissions[codingProblem.id];
      if (saved) {
        setActiveCodeLang(saved.lang);
        setActiveCode(saved.code);
      } else {
        setActiveCodeLang('python');
        setActiveCode(getCodeTemplate('python', codingProblem.title));
      }
    }

    setCurrentQuestionIndex(index);
  };

  // Compile & Execute code during mock exams
  const handleRunCodeInExam = async (problem) => {
    if (!activeCode) return;
    setCodeRunning(true);
    
    try {
      const response = await fetch('/api/code/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: activeCodeLang,
          source: activeCode,
          problemId: problem.id
        })
      });
      const data = await response.json();
      
      const submitData = {
        code: activeCode,
        lang: activeCodeLang,
        passedCount: data.passed_count || 0,
        totalCount: data.total_count || 8,
        results: data.results || [],
        error: data.error || null
      };

      setCodingSubmissions(prev => ({
        ...prev,
        [problem.id]: submitData
      }));

      if (data.passed) {
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCodeRunning(false);
    }
  };

  const handleLanguageChangeInExam = (problem, lang) => {
    setActiveCodeLang(lang);
    const saved = codingSubmissions[problem.id];
    if (saved && saved.lang === lang) {
      setActiveCode(saved.code);
    } else {
      setActiveCode(getCodeTemplate(lang, problem.title));
    }
  };

  const handlePhaseTimeout = () => {
    if (examPhase === 'foundation') {
      // Auto advance to transition screen
      setExamPhase('transition');
    } else if (examPhase === 'advanced') {
      // Auto submit mock exam
      submitExamResults(true);
    }
  };

  const handleGoToAdvanced = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamPhase('advanced');
    setTimeLeft(115 * 60); // 115 minutes
    setCurrentQuestionIndex(0);
    
    // Visit first advanced question
    const firstAdvQ = questionsData?.advanced.mcqs[0];
    if (firstAdvQ) {
      setVisitedQuestions(prev => ({ ...prev, [firstAdvQ.id]: true }));
    }
  };

  const submitExamResults = async (isTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamLoading(true);

    try {
      // Calculate scores
      // 1. Foundation Score
      let foundationCorrect = 0;
      const fQuestions = [
        ...questionsData.foundation.aptitude,
        ...questionsData.foundation.reasoning,
        ...questionsData.foundation.verbal
      ];
      fQuestions.forEach(q => {
        const userAns = foundationAnswers[q.id];
        if (userAns && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
          foundationCorrect++;
        }
      });

      // 2. Advanced MCQ Score
      let advancedCorrect = 0;
      questionsData.advanced.mcqs.forEach(q => {
        const userAns = advancedMcqAnswers[q.id];
        if (userAns && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
          advancedCorrect++;
        }
      });

      // 3. Coding Scores
      let coding1Passed = 0;
      let coding2Passed = 0;
      const c1 = questionsData.advanced.coding[0];
      const c2 = questionsData.advanced.coding[1];
      if (c1 && codingSubmissions[c1.id]) {
        coding1Passed = codingSubmissions[c1.id].passedCount || 0;
      }
      if (c2 && codingSubmissions[c2.id]) {
        coding2Passed = codingSubmissions[c2.id].passedCount || 0;
      }

      // Total points = 96 points
      const totalPoints = 65 + 15 + 16;
      const scoredPoints = foundationCorrect + advancedCorrect + coding1Passed + coding2Passed;
      const percentage = Math.round((scoredPoints / totalPoints) * 100);

      const scorePayload = {
        foundationScore: { correct: foundationCorrect, total: 65 },
        advancedMcqScore: { correct: advancedCorrect, total: 15 },
        coding1Score: {
          passed: coding1Passed,
          total: 8,
          title: c1?.title || 'Coding Problem 1',
          code: codingSubmissions[c1?.id]?.code || '',
          lang: codingSubmissions[c1?.id]?.lang || ''
        },
        coding2Score: {
          passed: coding2Passed,
          total: 8,
          title: c2?.title || 'Coding Problem 2',
          code: codingSubmissions[c2?.id]?.code || '',
          lang: codingSubmissions[c2?.id]?.lang || ''
        },
        overallPercentage: percentage,
        submittedAnswers: {
          foundation: foundationAnswers,
          advancedMcqs: advancedMcqAnswers
        }
      };

      const response = await fetch(`/api/mock-tests/${activeMock.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score_json: scorePayload })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit exam scores.');

      setCompletedAttemptDetails(scorePayload);
      setExamPhase('result');

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Refresh mock tests list
      fetchMocks();
    } catch (err) {
      setError(err.message);
    } finally {
      setExamLoading(false);
    }
  };

  const handleShowPreviousAttempt = (mock) => {
    if (mock.attempt_details && mock.attempt_details.score_json) {
      setCompletedAttemptDetails(mock.attempt_details.score_json);
      setActiveMock(mock);
      handleLoadReviewMaterials(mock);
    }
  };

  const handleLoadReviewMaterials = async (mock) => {
    setError('');
    setExamLoading(true);
    try {
      const response = await fetch(`/api/mock-tests/${mock.id}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load questions for review.');
      
      setQuestionsData(data);
      setReviewMode(true);
      setExamPhase('result');
      setReviewPhase('foundation');
      setReviewQuestionIdx(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setExamLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentUnlockedMonth = Math.max(1, Math.min(12, Math.floor((user?.last_active_day || 1) / 30) + 1));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <Activity className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Mock Tests...</p>
      </div>
    );
  }

  // RENDER PHASE 1: List Mocks Dashboard
  if (!activeMock) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-8 h-8 text-primary-600" /> Full-Length Monthly Mock Tests
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Replicate the exact exam pressure. 12 Monthly Full-Length Mocks: Foundation Section (75 mins) & Advanced Section (115 mins).
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mocks.map((mock) => {
            const isLocked = mock.month > currentUnlockedMonth;
            const isAttempted = mock.attempted;
            
            return (
              <div 
                key={mock.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 relative flex flex-col justify-between shadow-sm transition-all duration-200 ${
                  isLocked 
                    ? 'border-slate-200 dark:border-slate-800 opacity-60' 
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      Month {mock.month}
                    </span>
                    
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    ) : isAttempted ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attempted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-450 text-xs font-semibold">
                        Ready
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-2">{mock.name}</h3>
                  <p className="text-slate-400 text-xs mb-6">
                    Foundation: 65 Q (75m)<br />
                    Advanced: 15 MCQ + 2 Coding (115m)
                  </p>
                </div>

                <div>
                  {isLocked ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Unlock on Day {(mock.month - 1) * 30 + 1}
                    </button>
                  ) : isAttempted ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowPreviousAttempt(mock)}
                        className="flex-1 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <BarChart className="w-3.5 h-3.5" /> View Score
                      </button>
                      <button
                        onClick={() => handleStartExam(mock)}
                        className="flex-1 py-2.5 px-3 bg-primary-600 hover:bg-primary-705 text-white rounded-xl text-xs font-bold transition"
                      >
                        Retake Test
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartExam(mock)}
                      className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      Start Mock Exam <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (examLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
        <Activity className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="mt-4 text-sm text-slate-500 font-semibold">Processing mock exam payload...</p>
      </div>
    );
  }

  // TRANSITION STATE (Between Foundation and Advanced)
  if (examPhase === 'transition') {
    return (
      <div className="max-w-2xl mx-auto my-16 px-6 py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-xl">
        <Award className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Foundation Section Completed!</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          You have successfully finished the Foundation Section (numerical, reasoning, and verbal). 
          The remaining time has been discarded. 
          Ready to unlock the **Advanced Section**?
        </p>

        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl text-left border border-slate-100 dark:border-slate-850">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Advanced Phase Details:</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <li>⏱️ **Time Limit**: 115 Minutes (no pause)</li>
            <li>🧠 **Programming MCQs**: 15 Advanced Pseudo-code / Logic items</li>
            <li>💻 **Coding DSA**: 2 Advanced Coding problems with compilation console</li>
          </ul>
        </div>

        <button
          onClick={handleGoToAdvanced}
          className="mt-8 py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 mx-auto"
        >
          Begin Advanced Phase <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // RENDER EXAM RESULTS OR PREVIOUS SCORECARD
  if (examPhase === 'result' && completedAttemptDetails) {
    const details = completedAttemptDetails;
    const fCorrect = details.foundationScore.correct;
    const fTotal = details.foundationScore.total;
    const aCorrect = details.advancedMcqScore.correct;
    const aTotal = details.advancedMcqScore.total;
    const c1Passed = details.coding1Score.passed;
    const c2Passed = details.coding2Score.passed;
    const pct = details.overallPercentage;

    const activeReviewQuestions = (() => {
      if (!questionsData) return [];
      if (reviewPhase === 'foundation') {
        return [
          ...questionsData.foundation.aptitude,
          ...questionsData.foundation.reasoning,
          ...questionsData.foundation.verbal
        ];
      } else {
        return [
          ...questionsData.advanced.mcqs,
          ...questionsData.advanced.coding
        ];
      }
    })();

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {!reviewMode ? (
          // SCORECARD REPORT VIEW
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="text-center pb-8 border-b border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white">Mock Test Submitted Successfully</h2>
              <p className="text-slate-400 text-xs mt-1">Review your performance index below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 items-center border-b border-slate-100 dark:border-slate-800">
              <div className="text-center flex flex-col items-center">
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-800">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{pct}%</span>
                </div>
                <span className="text-xs text-slate-500 font-semibold mt-3">Accuracy Index Score</span>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Performance Breakdowns:</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Foundation Accuracy ({fCorrect}/{fTotal} Correct)</span>
                      <span>{Math.round((fCorrect/fTotal)*100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-855 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${(fCorrect/fTotal)*100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Advanced MCQs ({aCorrect}/{aTotal} Correct)</span>
                      <span>{Math.round((aCorrect/aTotal)*100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-855 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-primary-650 h-full" style={{ width: `${(aCorrect/aTotal)*100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Advanced Coding DSA ({c1Passed + c2Passed}/16 Test Cases Passed)</span>
                      <span>{Math.round(((c1Passed+c2Passed)/16)*100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-855 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${((c1Passed+c2Passed)/16)*100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setReviewMode(true);
                  setReviewPhase('foundation');
                  setReviewQuestionIdx(0);
                }}
                className="py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                Review Answers <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveMock(null);
                  setQuestionsData(null);
                  setCompletedAttemptDetails(null);
                }}
                className="py-3 px-6 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-405 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition"
              >
                Return to Mock Tests
              </button>
            </div>
          </div>
        ) : (
          // DETAILED QUESTIONS REVIEW MODE
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Review Mode: {activeMock.name}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Phase: <strong className="uppercase">{reviewPhase}</strong> | Question {reviewQuestionIdx + 1} of {activeReviewQuestions.length}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReviewPhase('foundation');
                      setReviewQuestionIdx(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      reviewPhase === 'foundation' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400' 
                        : 'text-slate-500'
                    }`}
                  >
                    Foundation
                  </button>
                  <button
                    onClick={() => {
                      setReviewPhase('advanced');
                      setReviewQuestionIdx(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      reviewPhase === 'advanced' 
                        ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' 
                        : 'text-slate-500'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              </div>

              {activeReviewQuestions.length > 0 && (() => {
                const q = activeReviewQuestions[reviewQuestionIdx];
                if (!q) return null;

                const isCoding = reviewPhase === 'advanced' && reviewQuestionIdx >= 15;

                if (isCoding) {
                  const submission = completedAttemptDetails[reviewQuestionIdx === 15 ? 'coding1Score' : 'coding2Score'];
                  return (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/35 px-2 py-0.5 rounded-full">
                          Coding Problem
                        </span>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base">{q.title}</h4>
                        <p className="text-slate-650 dark:text-slate-400 text-xs whitespace-pre-wrap leading-relaxed">
                          {q.statement}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 font-mono text-xs">
                        <span className="font-bold text-slate-400 text-[10px]">Your Code Output ({submission.passed}/{submission.total} cases passed):</span>
                        <pre className="mt-2 text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {submission.code || '# Code not submitted'}
                        </pre>
                      </div>

                      {q.solution_code_by_lang_json && (
                        <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                          <h5 className="font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-2">✅ Sample Correct Code (Python):</h5>
                          <pre className="font-mono text-xs text-slate-705 dark:text-slate-350 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850 max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {q.solution_code_by_lang_json.python || 'No reference code available.'}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                }

                const answersMap = completedAttemptDetails.submittedAnswers[reviewPhase === 'foundation' ? 'foundation' : 'advancedMcqs'];
                const userAns = answersMap[q.id];
                const isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();

                return (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-850 px-2.5 py-0.5 rounded-full">
                        {q.section}
                      </span>
                      <p className="font-semibold text-slate-850 dark:text-white mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {q.question_text}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {q.options_json && Object.entries(q.options_json).map(([key, val]) => {
                        const isUserAnswer = String(userAns).trim().toLowerCase() === String(key).trim().toLowerCase();
                        const isCorrectAnswer = String(q.correct_answer).trim().toLowerCase() === String(key).trim().toLowerCase();
                        
                        let optStyle = 'border-slate-200 dark:border-slate-800';
                        if (isCorrectAnswer) {
                          optStyle = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-705 dark:text-emerald-400';
                        } else if (isUserAnswer && !isCorrect) {
                          optStyle = 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-550 text-rose-700 dark:text-rose-450';
                        }

                        return (
                          <div 
                            key={key} 
                            className={`p-3.5 border rounded-xl flex items-center gap-3 text-xs font-semibold ${optStyle}`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-805 flex items-center justify-center font-bold text-slate-505 uppercase">
                              {key}
                            </span>
                            <span>{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-2 text-xs">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Solution Explanation:</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                        {q.solution_explanation}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={reviewQuestionIdx === 0}
                  onClick={() => setReviewQuestionIdx(prev => prev - 1)}
                  className="flex items-center gap-1 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-650"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={() => {
                    setReviewMode(false);
                  }}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Exit Review
                </button>

                <button
                  disabled={reviewQuestionIdx === activeReviewQuestions.length - 1}
                  onClick={() => setReviewQuestionIdx(prev => prev + 1)}
                  className="flex items-center gap-1 py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 text-xs font-bold"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Questions Navigator</h4>
              
              <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto">
                {activeReviewQuestions.map((q, idx) => {
                  const answersMap = completedAttemptDetails.submittedAnswers[reviewPhase === 'foundation' ? 'foundation' : 'advancedMcqs'];
                  
                  let cellStyle = 'border-slate-200 text-slate-500';
                  if (reviewPhase === 'advanced' && idx >= 15) {
                    const submission = completedAttemptDetails[idx === 15 ? 'coding1Score' : 'coding2Score'];
                    const isCodePassed = submission && submission.passed === submission.total;
                    cellStyle = isCodePassed
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 text-emerald-600'
                      : 'bg-rose-50 dark:bg-rose-950/20 border-rose-450 text-rose-505';
                  } else {
                    const userAns = answersMap[q.id];
                    const isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
                    if (userAns) {
                      cellStyle = isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-450 text-emerald-600'
                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-450 text-rose-600';
                    }
                  }

                  if (idx === reviewQuestionIdx) {
                    cellStyle += ' ring-2 ring-primary-500 border-transparent';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setReviewQuestionIdx(idx)}
                      className={`h-9 border rounded-lg text-xs font-bold transition flex items-center justify-center ${cellStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-400 inline-block"></span>
                  <span>Correct Answer</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-450 inline-block"></span>
                  <span>Incorrect Answer</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER ACTIVE MOCK EXAM SIMULATOR
  const activeQuestions = getActiveQuestions();
  const activeQuestion = activeQuestions[currentQuestionIndex];
  const isCodingQuestion = examPhase === 'advanced' && currentQuestionIndex >= 15;

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-[calc(100vh-4rem)] animate-in fade-in duration-200">
      <header className="sticky top-16 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-base font-extrabold text-slate-850 dark:text-white leading-none">
              {activeMock.name}
            </h2>
            <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase mt-1 inline-block">
              Phase: {examPhase === 'foundation' ? 'Foundation (Numerical, Reasoning, Verbal)' : 'Advanced (Logic & Coding)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-950 text-white font-mono text-base font-bold py-1.5 px-4 rounded-xl border border-slate-850">
            <Clock className="w-4 h-4 text-primary-400 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => {
              if (examPhase === 'foundation') {
                if (window.confirm('Are you sure you want to end the Foundation phase? You cannot return.')) {
                  handlePhaseTimeout();
                }
              } else {
                if (window.confirm('Submit final mock test answers for grading?')) {
                  submitExamResults();
                }
              }
            }}
            className="py-2 px-5 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition"
          >
            {examPhase === 'foundation' ? 'Finish Foundation Phase' : 'Submit Final Test'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto p-4 gap-6">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm overflow-y-auto flex flex-col justify-between min-h-[450px]">
          {activeQuestion ? (
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3 mb-5">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {activeQuestion.section} ({activeQuestion.difficulty || 'Advanced'})
                </span>
                
                <span className="text-xs text-slate-400 font-semibold">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length}
                </span>
              </div>

              {isCodingQuestion ? (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-2">{activeQuestion.title}</h3>
                    <p className="text-slate-650 dark:text-slate-405 text-xs whitespace-pre-wrap leading-relaxed">
                      {activeQuestion.statement}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {activeQuestion.input_format && (
                        <div>
                          <strong className="text-[10px] font-extrabold text-slate-400 uppercase">Input Format:</strong>
                          <p className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 mt-1">
                            {activeQuestion.input_format}
                          </p>
                        </div>
                      )}

                      {activeQuestion.output_format && (
                        <div>
                          <strong className="text-[10px] font-extrabold text-slate-400 uppercase">Output Format:</strong>
                          <p className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 mt-1">
                            {activeQuestion.output_format}
                          </p>
                        </div>
                      )}

                      {activeQuestion.constraints && (
                        <div>
                          <strong className="text-[10px] font-extrabold text-slate-400 uppercase">Constraints:</strong>
                          <p className="text-xs font-mono text-rose-500 mt-0.5">{activeQuestion.constraints}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col bg-slate-955 rounded-2xl overflow-hidden border border-slate-800 min-h-[300px]">
                      <div className="flex justify-between items-center bg-slate-900 py-2 px-3 border-b border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono">Solution Workspace</span>
                        <select
                          value={activeCodeLang}
                          onChange={(e) => handleLanguageChangeInExam(activeQuestion, e.target.value)}
                          className="bg-slate-800 border-0 rounded text-[10px] text-white py-0.5 px-2 focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="python">Python 3</option>
                          <option value="cpp">C++ (g++)</option>
                          <option value="java">Java (JDK)</option>
                        </select>
                      </div>

                      <textarea
                        value={activeCode}
                        onChange={(e) => {
                          setActiveCode(e.target.value);
                          setCodingSubmissions(prev => ({
                            ...prev,
                            [activeQuestion.id]: {
                              ...(prev[activeQuestion.id] || {}),
                              code: e.target.value,
                              lang: activeCodeLang
                            }
                          }));
                        }}
                        className="flex-1 bg-slate-950 text-slate-100 p-3 font-mono text-xs focus:outline-none resize-none"
                        spellCheck={false}
                      />

                      <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500">Outputs compared locally</span>
                        <button
                          onClick={() => handleRunCodeInExam(activeQuestion)}
                          disabled={codeRunning}
                          className="flex items-center gap-1 py-1 px-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-[10px] font-bold transition disabled:opacity-40"
                        >
                          {codeRunning ? 'Running...' : 'Run Code'}
                        </button>
                      </div>

                      {codingSubmissions[activeQuestion.id] && codingSubmissions[activeQuestion.id].passedCount !== undefined && (
                        <div className="bg-slate-900 border-t border-slate-800 p-2.5 font-mono text-[10px]">
                          <span className="font-bold text-slate-450 uppercase block">Submission Details:</span>
                          <div className="flex justify-between mt-1 text-slate-350">
                            <span>Status:</span>
                            <span className={codingSubmissions[activeQuestion.id].passedCount === codingSubmissions[activeQuestion.id].totalCount ? 'text-emerald-500 font-bold' : 'text-rose-455 font-bold'}>
                              {codingSubmissions[activeQuestion.id].passedCount}/{codingSubmissions[activeQuestion.id].totalCount} Passed
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <p className="font-semibold text-slate-850 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                    {activeQuestion.question_text}
                  </p>

                  <div className="grid grid-cols-1 gap-3.5">
                    {activeQuestion.options_json && Object.entries(activeQuestion.options_json).map(([key, val]) => {
                      const userAnswersMap = examPhase === 'foundation' ? foundationAnswers : advancedMcqAnswers;
                      const isSelected = userAnswersMap[activeQuestion.id] === key;

                      return (
                        <button
                          key={key}
                          onClick={() => handleSelectOption(activeQuestion.id, key)}
                          className={`w-full text-left p-3.5 border rounded-xl flex items-center gap-3 transition duration-150 text-xs font-semibold ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-550 dark:hover:bg-slate-850/30'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {key}
                          </span>
                          <span>{val}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <HelpCircle className="w-12 h-12 text-slate-300 animate-pulse" />
              <p className="text-xs text-slate-400 mt-2">Loading mock test question...</p>
            </div>
          )}

          {activeQuestion && (
            <div className="flex items-center justify-between border-t border-slate-105 dark:border-slate-850 pt-5 mt-8">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => navigateQuestion(currentQuestionIndex - 1)}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-650"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={() => handleMarkForReview(activeQuestion.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${
                  markedForReview[activeQuestion.id]
                    ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/30 text-purple-650'
                    : 'border-slate-200 dark:border-slate-800 text-slate-505 hover:bg-slate-550 dark:hover:bg-slate-800'
                }`}
              >
                {markedForReview[activeQuestion.id] ? '★ Marked' : '☆ Mark for Review'}
              </button>

              <button
                disabled={currentQuestionIndex === activeQuestions.length - 1}
                onClick={() => navigateQuestion(currentQuestionIndex + 1)}
                className="flex items-center gap-1.5 py-2 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Exam Map Grid</h4>
            
            <div className="grid grid-cols-5 gap-2 max-h-[350px] overflow-y-auto pr-1">
              {activeQuestions.map((q, idx) => {
                const userAnswersMap = examPhase === 'foundation' ? foundationAnswers : advancedMcqAnswers;
                
                let isAnswered = false;
                if (examPhase === 'advanced' && idx >= 15) {
                  isAnswered = codingSubmissions[q.id] && codingSubmissions[q.id].code;
                } else {
                  isAnswered = !!userAnswersMap[q.id];
                }

                const isVisited = visitedQuestions[q.id];
                const isMarked = markedForReview[q.id];
                const isActive = idx === currentQuestionIndex;

                let cellStyle = 'border-slate-200 text-slate-450';
                if (isAnswered) {
                  cellStyle = 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-600 dark:text-primary-400';
                } else if (isVisited) {
                  cellStyle = 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 text-amber-600 dark:text-amber-450';
                }

                if (isMarked) {
                  cellStyle += ' ring-1.5 ring-purple-400';
                }
                
                if (isActive) {
                  cellStyle += ' ring-2 ring-primary-500 border-transparent';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateQuestion(idx)}
                    className={`h-9 border rounded-lg text-xs font-bold transition flex items-center justify-center relative ${cellStyle}`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border border-white dark:border-slate-900"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 dark:border-slate-855 pt-5 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500">
              <span className="w-3.5 h-3.5 rounded bg-primary-50 border border-primary-400 inline-block"></span>
              <span>Answered Questions</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500">
              <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-300 inline-block"></span>
              <span>Visited / Unanswered</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500">
              <span className="w-3.5 h-3.5 rounded border border-slate-200 inline-block"></span>
              <span>Unvisited</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-slate-500">
              <span className="w-3.5 h-3.5 rounded border ring-1.5 ring-purple-400 bg-purple-50 inline-block"></span>
              <span>Marked for Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
