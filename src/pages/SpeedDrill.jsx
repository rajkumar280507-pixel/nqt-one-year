import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Flame, CheckCircle, XCircle, Loader2,
  Timer, ChevronRight, RefreshCw, Zap
} from 'lucide-react';

const TIME_PER_Q = 25;

export default function SpeedDrill({ token }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | intro | drilling | result
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [totalTime, setTotalTime] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    load();
    return () => clearInterval(timerRef.current);
  }, [slug]);

  async function load() {
    try {
      const res = await fetch(`/api/topics/slug/${slug}/speed-drill`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const qs = await res.json();
      if (!Array.isArray(qs) || qs.length === 0) {
        setPhase('empty');
        return;
      }
      setQuestions(qs);
      setPhase('intro');
    } catch {
      setPhase('error');
    }
  }

  function start() {
    setPhase('drilling');
    setQi(0);
    setResults([]);
    setTotalTime(0);
    beginQuestion();
  }

  function beginQuestion() {
    setSelected(null);
    setRevealed(false);
    setTimeLeft(TIME_PER_Q);
    startRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function onTimeout() {
    setRevealed(true);
    const t = (Date.now() - startRef.current) / 1000;
    const newR = [...results, { correct: false, timeTaken: t, timedOut: true }];
    setResults(newR);
    setTotalTime(prev => prev + t);
    setTimeout(() => advance(newR), 1000);
  }

  function handleSelect(opt) {
    if (revealed) return;
    clearInterval(timerRef.current);
    const t = (Date.now() - startRef.current) / 1000;
    const q = questions[qi];
    const correct = opt === q.correct_answer;
    setSelected(opt);
    setRevealed(true);
    const newR = [...results, { correct, timeTaken: t, selected: opt, correct_answer: q.correct_answer }];
    setResults(newR);
    setTotalTime(prev => prev + t);
    setTimeout(() => advance(newR), correct ? 700 : 1200);
  }

  function advance(newR) {
    const next = qi + 1;
    if (next >= questions.length) {
      finish(newR);
    } else {
      setQi(next);
      beginQuestion();
    }
  }

  async function finish(finalR) {
    setPhase('result');
    const cc = finalR.filter(r => r.correct).length;
    try {
      const res = await fetch(`/api/topics/slug/${slug}/speed-drill/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ correctCount: cc, timeTakenSec: totalTime })
      });
      setSubmitted(await res.json());
    } catch {
      setSubmitted({});
    }
  }

  const q = questions[qi];
  const options = q ? (Array.isArray(q.options_json) ? q.options_json : JSON.parse(q.options_json || '[]')) : [];
  const correctCount = results.filter(r => r.correct).length;
  const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  if (phase === 'loading') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  );

  if (phase === 'empty' || phase === 'error') return (
    <div className="max-w-lg mx-auto mt-20 text-center px-4">
      <p className="text-slate-500 dark:text-slate-400">No speed drill questions available for this topic yet.</p>
      <button onClick={() => navigate(`/topics/${slug}`)} className="mt-4 px-5 py-2 bg-primary-600 text-white rounded-xl text-sm">← Back to topic</button>
    </div>
  );

  if (phase === 'intro') return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
        <Flame className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">Speed Drill</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm mx-auto">
        {questions.length} mixed questions from all tricks in this topic. {TIME_PER_Q}s per question.
        Apply your shortcuts!
      </p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ label: 'Questions', value: questions.length }, { label: 'Time / Q', value: `${TIME_PER_Q}s` }, { label: 'Mixed', value: '✓' }].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <button onClick={start} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold rounded-2xl text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
        Start Speed Drill 🔥
      </button>
      <button onClick={() => navigate(`/topics/${slug}`)} className="mt-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">← Back to topic</button>
    </div>
  );

  if (phase === 'drilling' && q) return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i < qi ? 'bg-amber-500 w-5' : i === qi ? 'bg-amber-400 w-7' : 'bg-slate-200 dark:bg-slate-700 w-3'
            }`} />
          ))}
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${timeLeft <= 8 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
          <Timer className="w-4 h-4" /> {timeLeft}s
        </div>
      </div>

      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 8 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${(timeLeft / TIME_PER_Q) * 100}%` }} />
      </div>

      {q.trick_name && (
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{q.trick_name}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Q {qi + 1} / {questions.length}</p>
        <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">{q.question_text}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isSel = selected === opt;
          const isC = revealed && opt === q.correct_answer;
          const isW = revealed && isSel && opt !== q.correct_answer;
          return (
            <button key={i} onClick={() => handleSelect(opt)} className={`flex items-center gap-2 p-4 rounded-2xl border text-sm font-medium text-left transition-all ${
              isC ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-800 dark:text-emerald-300'
              : isW ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 text-rose-800 dark:text-rose-300'
              : isSel ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-800 dark:text-amber-300'
              : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-700'
            }`}>
              {isC ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : isW ? <XCircle className="w-4 h-4 flex-shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-current opacity-40 flex-shrink-0" />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (phase === 'result') {
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map(s => <span key={s} className={`text-4xl ${s <= stars ? '' : 'opacity-20'}`}>⭐</span>)}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-1">{pct}% Correct</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{correctCount}/{questions.length} correct  •  {totalTime.toFixed(1)}s total</p>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden mb-6">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{questions[i]?.question_text?.slice(0, 42)}…</span>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs tabular-nums text-slate-400">{r.timeTaken?.toFixed(1)}s</span>
                {r.correct ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setPhase('intro'); setResults([]); setQi(0); setTotalTime(0); }} className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button onClick={() => navigate(`/topics/${slug}`)} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors">
            Back to Topic <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
