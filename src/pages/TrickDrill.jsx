import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, CheckCircle, XCircle, Loader2,
  Timer, ChevronRight, BarChart2, Trophy, RefreshCw, Sparkles
} from 'lucide-react';

const TIME_LIMIT_SEC = 30; // per question

export default function TrickDrill({ token, user }) {
  const { slug, trickId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | intro | drilling | result
  const [trick, setTrick] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0); // current question index
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]); // {correct, timeTaken, usedTrick}
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [totalTime, setTotalTime] = useState(0);
  const [didUseTrick, setDidUseTrick] = useState(true); // default to true
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadDrill();
    return () => clearInterval(timerRef.current);
  }, [trickId]);

  async function loadDrill() {
    try {
      // Get trick info
      const topicRes = await fetch(`/api/topics/slug/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const topicData = await topicRes.json();
      const trickData = topicData.tricks?.find(t => String(t.id) === String(trickId));
      setTrick(trickData || { name: 'Trick Drill', spot_when: '' });

      // Get drill questions
      const res = await fetch(`/api/tricks/${trickId}/drill`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const qs = await res.json();
      if (!Array.isArray(qs) || qs.length === 0) {
        setPhase('empty');
        return;
      }
      setQuestions(qs);
      setPhase('intro');
    } catch (e) {
      setPhase('error');
    }
  }

  function startDrill() {
    setPhase('drilling');
    setQi(0);
    setResults([]);
    setTotalTime(0);
    startQuestion();
  }

  function startQuestion() {
    setSelected(null);
    setRevealed(false);
    setTimeLeft(TIME_LIMIT_SEC);
    setDidUseTrick(true); // reset toggle to default
    startTimeRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleTimeout() {
    setRevealed(true);
    clearInterval(timerRef.current);
  }

  function handleSelect(opt) {
    if (revealed) return;
    clearInterval(timerRef.current);
    setSelected(opt);
    setRevealed(true);
  }

  function handleNext() {
    const timeTaken = Math.min(TIME_LIMIT_SEC, (Date.now() - startTimeRef.current) / 1000);
    const q = questions[qi];
    const isCorrect = selected === q.correct_answer;
    
    const newResults = [...results, { 
      correct: isCorrect, 
      timeTaken, 
      selected, 
      correct_answer: q.correct_answer,
      usedTrick: didUseTrick,
      expected: q.expected_solve_time_sec || 15
    }];
    
    setResults(newResults);
    setTotalTime(prev => prev + timeTaken);

    const nextIndex = qi + 1;
    if (nextIndex >= questions.length) {
      finishDrill(newResults, totalTime + timeTaken);
    } else {
      setQi(nextIndex);
      startQuestion();
    }
  }

  async function finishDrill(finalResults, finalTotalTime) {
    setPhase('result');
    setSubmitting(true);
    const correctCount = finalResults.filter(r => r.correct).length;
    try {
      const res = await fetch(`/api/tricks/${trickId}/drill/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ correctCount, timeTakenSec: finalTotalTime })
      });
      const json = await res.json();
      setSubmitted(json);
    } catch (e) {
      setSubmitted({ masteryScore: 0 });
    } finally {
      setSubmitting(false);
    }
  }

  const q = questions[qi];
  const options = q ? (Array.isArray(q.options_json) ? q.options_json : JSON.parse(q.options_json || '[]')) : [];
  const correctCount = results.filter(r => r.correct).length;
  const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  // ── Render phases ──────────────────────────────────────────────────────────

  if (phase === 'loading') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  );

  if (phase === 'empty' || phase === 'error') return (
    <div className="max-w-lg mx-auto mt-20 text-center px-4">
      <div className="text-4xl mb-4">😕</div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No drill questions found</h2>
      <button onClick={() => navigate(`/topics/${slug}`)} className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm">
        Back to Topic
      </button>
    </div>
  );

  if (phase === 'intro') return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/25">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">{trick?.name}</h1>
      {trick?.spot_when && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Use it when:</span> {trick.spot_when}
        </p>
      )}
      <div className="grid grid-cols-3 gap-4 mb-8 text-center">
        {[
          { label: 'Questions', value: questions.length },
          { label: 'Time / Q', value: `${TIME_LIMIT_SEC}s` },
          { label: 'Mode', value: 'Timed' }
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <button
        onClick={startDrill}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Start Drill
      </button>
      <button onClick={() => navigate(`/topics/${slug}`)} className="mt-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
        ← Back to topic
      </button>
    </div>
  );

  if (phase === 'drilling' && q) return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Progress + Timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i < qi ? 'bg-indigo-500 w-6' :
              i === qi ? 'bg-indigo-400 w-8' :
              'bg-slate-200 dark:bg-slate-700 w-4'
            }`} />
          ))}
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${
          timeLeft <= 10 ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-600 dark:text-slate-400'
        }`}>
          <Timer className="w-4 h-4" />
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-rose-500' : 'bg-indigo-500'}`}
          style={{ width: `${(timeLeft / TIME_LIMIT_SEC) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-semibold uppercase tracking-wider">Question {qi + 1} of {questions.length}</p>
        <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">{q.question_text}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isSelected = selected === opt;
          const isCorrect = revealed && opt === q.correct_answer;
          const isWrong = revealed && isSelected && opt !== q.correct_answer;
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={revealed}
              className={`flex items-center gap-2 p-4 rounded-2xl border text-sm font-medium text-left transition-all ${
                isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : isWrong ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                : isSelected ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400 text-indigo-800 dark:text-indigo-300'
                : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30'
              }`}
            >
              {isCorrect ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
               : isWrong ? <XCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
               : <span className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0 opacity-40" />}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Solution hint + 'Did you use the trick?' toggle on reveal */}
      {revealed && (
        <div className="mt-6 space-y-4 animate-fade-in-up">
          {/* Toggle */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Did you use the trick?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Be honest! We track this to show your speed boost.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDidUseTrick(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  didUseTrick 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🔥 Yes
              </button>
              <button
                onClick={() => setDidUseTrick(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  !didUseTrick 
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                📝 No (Long way)
              </button>
            </div>
          </div>

          {q.solution_using_trick && (
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100/60 dark:border-indigo-900/40">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-1">Using the trick:</p>
              <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">{q.solution_using_trick}</p>
            </div>
          )}

          {/* Action button to continue */}
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-indigo-500/20 transition-all"
          >
            {qi + 1 === questions.length ? 'Finish Drill & See Results' : 'Next Question'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );

  if (phase === 'result') {
    const stars = pct >= 100 ? 3 : pct >= 67 ? 2 : pct >= 34 ? 1 : 0;
    const avgTime = results.length ? totalTime / results.length : 0;
    const avgExpected = results.length ? results.reduce((sum, r) => sum + r.expected, 0) / results.length : 15;
    const tricksUsedCount = results.filter(r => r.usedTrick).length;

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <span key={s} className={`text-4xl transition-transform ${s <= stars ? 'scale-110' : 'opacity-20'}`}>⭐</span>
          ))}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-1">
          {pct === 100 ? 'Perfect!' : pct >= 67 ? 'Well done!' : pct >= 34 ? 'Keep practicing' : 'Try again?'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          {correctCount} / {questions.length} correct &bull; {totalTime.toFixed(1)}s total
        </p>

        {/* Speed Analytics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">Your Speed</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {avgTime.toFixed(1)}s
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              vs. expected {avgExpected.toFixed(0)}s
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">Trick Usage</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {tricksUsedCount} / {results.length}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              questions solved using trick
            </p>
          </div>
        </div>

        {/* Results table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 shadow-sm">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 text-sm ${i > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''}`}>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-800 dark:text-slate-200">Question {i + 1}</span>
                <span className="text-xs text-slate-400 mt-0.5">
                  {r.usedTrick ? '🔥 Solved using trick' : '🐌 Textbook method'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">{r.timeTaken?.toFixed(1)}s</span>
                {r.correct ? (
                  <span className="p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="p-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500">
                    <XCircle className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mastery score banner */}
        {submitted && (
          <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
              Mastery score updated to <strong>{submitted.masteryScore}%</strong>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setPhase('intro'); setResults([]); setQi(0); setTotalTime(0); }}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => navigate(`/topics/${slug}`)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            Back to Topic <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
