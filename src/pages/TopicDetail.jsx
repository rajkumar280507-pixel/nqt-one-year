import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Zap, Calculator, FlipHorizontal, ListChecks,
  ChevronDown, ChevronUp, Flame, Star, Play, Clock, CheckCircle,
  AlertCircle, Loader2, RefreshCw, ExternalLink, Sparkles, Download, ArrowRight
} from 'lucide-react';
import MasteryRing from '../components/MasteryRing';
import FormulaCard from '../components/FormulaCard';
import TrickCard from '../components/TrickCard';
import LongVsShort from '../components/LongVsShort';

const EXPANDED_DEFINITIONS = {
  'Number System': "The Number System is the mathematical foundation for representing numbers and performing arithmetic. It covers classification of numbers (integers, primes, rationals, and irrationals), divisibility properties, and digit patterns. Mastery of this topic allows you to find units digits of large powers, calculate trailing zeros in factorials, and simplify expressions using remainders. These techniques form the basis for advanced quantitative aptitude questions.",
  'LCM & HCF': "HCF (Highest Common Factor) is the largest number that divides two or more numbers exactly. LCM (Least Common Multiple) is the smallest number that two or more numbers all divide into. They are connected by a useful rule: HCF × LCM = product of the two numbers. You will see them in problems about lining up events, splitting groups, and simplifying fractions."
};

const RELATED_TOPICS = {
  'number-system': [
    { name: 'LCM & HCF', slug: 'lcm-hcf' },
    { name: 'Divisibility Rules', slug: 'divisibility-rules' }
  ],
  'lcm-hcf': [
    { name: 'Number System', slug: 'number-system' },
    { name: 'Divisibility Rules', slug: 'divisibility-rules' }
  ]
};

export default function TopicDetail({ token, user }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceRevealed, setPracticeRevealed] = useState({});
  const [wrongQuestionIds, setWrongQuestionIds] = useState(new Set());
  const [selectedDifficulty, setSelectedDifficulty] = useState('All'); // All | Easy | Medium | Hard | Incorrect

  const practiceRef = useRef(null);

  useEffect(() => {
    fetchTopicData();
    // Reset page states
    setPracticeAnswers({});
    setPracticeRevealed({});
    setWrongQuestionIds(new Set());
    setSelectedDifficulty('All');
  }, [slug]);

  async function fetchTopicData() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/topics/slug/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load topic');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Calculate overall mastery
  const overallMastery = data?.tricks?.length
    ? Math.round(data.tricks.reduce((s, t) => s + (t.mastery_score || 0), 0) / data.tricks.length)
    : 0;

  const tricksWithLvS = data?.tricks?.filter(t => {
    const lvs = t.long_vs_short_json;
    if (!lvs) return false;
    const parsed = typeof lvs === 'string' ? JSON.parse(lvs) : lvs;
    return parsed && parsed.long && parsed.short;
  }) || [];

  // Calculate Leitner-style spaced repetition reviews
  const getReviewStatus = () => {
    if (!data?.tricks || data.tricks.length === 0) return 'No reviews scheduled';
    
    let dueCount = 0;
    let minTimeRemainingMs = Infinity;

    data.tricks.forEach(t => {
      if (t.attempts > 0 && t.last_drilled_at) {
        const lastDrilled = new Date(t.last_drilled_at).getTime();
        // Spacing based on mastery score: 0-49: 1 day, 50-79: 2 days, 80-99: 4 days, 100: 8 days
        const score = t.mastery_score || 0;
        const intervalDays = score === 100 ? 8 : score >= 80 ? 4 : score >= 50 ? 2 : 1;
        const nextReviewTime = lastDrilled + intervalDays * 24 * 60 * 60 * 1000;
        const remainingMs = nextReviewTime - Date.now();

        if (remainingMs <= 0) {
          dueCount++;
        } else if (remainingMs < minTimeRemainingMs) {
          minTimeRemainingMs = remainingMs;
        }
      } else {
        // Not started yet
        dueCount++;
      }
    });

    if (dueCount > 0) {
      return { status: `${dueCount} review${dueCount > 1 ? 's' : ''} due now`, color: 'text-rose-600 dark:text-rose-400 font-extrabold' };
    }

    const remainingHours = Math.ceil(minTimeRemainingMs / (1000 * 60 * 60));
    if (remainingHours <= 24) {
      return { status: `Next review in ${remainingHours}h`, color: 'text-amber-600 dark:text-amber-400 font-bold' };
    }
    const remainingDays = Math.ceil(remainingHours / 24);
    return { status: `Next review in ${remainingDays} days`, color: 'text-slate-500 dark:text-slate-400 font-medium' };
  };

  const reviewStatus = getReviewStatus();

  // Scroll handler
  const handleScrollToPractice = () => {
    practiceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToTrick = (trickId) => {
    const el = document.getElementById(`trick-card-${trickId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      // highlight border temporarily
      el.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-indigo-500');
      }, 2000);
    }
  };

  const triggerDownloadCheatSheet = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading topic...</p>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-lg mx-auto mt-20 text-center px-4">
      <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Topic not found</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error || 'Data could not be loaded.'}</p>
      <button onClick={() => navigate('/topics')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Topics
      </button>
    </div>
  );

  const { topic, vocabulary, formulas, tricks, questions } = data;
  const expandedDef = EXPANDED_DEFINITIONS[topic.name] || topic.definition;

  // Filter practice questions
  const filteredQuestions = questions.filter(q => {
    if (selectedDifficulty === 'All') return true;
    if (selectedDifficulty === 'Incorrect') return wrongQuestionIds.has(q.id);
    return q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">
      {/* ─── Breadcrumb & Header ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/topics')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Topics Library
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 font-bold">{topic.section}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{tricks?.length || 0} tricks &bull; {questions?.length || 0} practice questions</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mt-1 tracking-tight">{topic.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Page Grid ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Section A: Definition */}
            <section id="definition">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Definition</p>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{expandedDef}</p>
              </div>
            </section>

            {/* Section B: Vocabulary & Core Concepts */}
            {vocabulary?.length > 0 && (
              <section id="vocabulary">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Vocabulary & Core Concepts</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vocabulary.map((v, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">{v.term}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{v.meaning}</p>
                      </div>
                      {v.example_sentence && (
                        <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                          "{v.example_sentence}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section C: Quick Formulas */}
            {formulas?.length > 0 && (
              <section id="formulas">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Formulas</p>
                <div className="space-y-3">
                  {formulas.map((f, i) => (
                    <FormulaCard key={i} formula={f} />
                  ))}
                </div>
              </section>
            )}

            {/* Section D: Tricks & Methods */}
            {tricks?.length > 0 && (
              <section id="tricks">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Tricks & Methods</p>
                <div className="space-y-4">
                  {tricks.map((trick, index) => (
                    <div id={`trick-card-${trick.id}`} key={trick.id}>
                      <TrickCard
                        trick={trick}
                        slug={slug}
                        masteryScore={trick.mastery_score || 0}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section E: Long vs Short */}
            {tricksWithLvS.length > 0 && (
              <section id="longshort">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Long Way vs Shortcut</p>
                <div className="space-y-6">
                  {tricksWithLvS.slice(0, 2).map((trick, index) => {
                    const lvs = typeof trick.long_vs_short_json === 'string'
                      ? JSON.parse(trick.long_vs_short_json)
                      : trick.long_vs_short_json;
                    return (
                      <div key={trick.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                          Comparison: <span className="text-indigo-600 dark:text-indigo-400">{trick.name}</span>
                        </p>
                        <LongVsShort lvs={lvs} />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section F: Practice Questions */}
            {questions?.length > 0 && (
              <section ref={practiceRef} id="practice" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Practice Questions</p>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                    {['All', 'Easy', 'Medium', 'Hard', 'Incorrect'].map((diff) => {
                      if (diff === 'Incorrect' && wrongQuestionIds.size === 0) return null;
                      return (
                        <button
                          key={diff}
                          onClick={() => setSelectedDifficulty(diff)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            selectedDifficulty === diff
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {diff === 'Incorrect' ? `Wrong (${wrongQuestionIds.size})` : diff}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">No questions match this filter.</p>
                    </div>
                  ) : (
                    filteredQuestions.map((q, qi) => {
                      // Dynamically associate a trick
                      const associatedTrick = tricks.find(t => {
                        const kw = t.name.toLowerCase().split(' ')[0];
                        return kw.length > 3 && q.question_text.toLowerCase().includes(kw);
                      }) || tricks[qi % tricks.length];

                      return (
                        <PracticeQuestion
                          key={q.id}
                          q={{ ...q, associatedTrick }}
                          index={qi}
                          token={token}
                          userId={user?.id}
                          answers={practiceAnswers}
                          setAnswers={setPracticeAnswers}
                          revealed={practiceRevealed}
                          setRevealed={setPracticeRevealed}
                          wrongQuestionIds={wrongQuestionIds}
                          setWrongQuestionIds={setWrongQuestionIds}
                          handleScrollToTrick={handleScrollToTrick}
                        />
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column / Sticky Sidebar (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              
              {/* Mastery progress card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 text-center flex flex-col items-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Topic Mastery</p>
                <MasteryRing percent={overallMastery} size={96} stroke={8} />
                <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-4">{overallMastery}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">Average mastery across all exam tricks</p>
              </div>

              {/* Spaced repetition review scheduler */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Spaced Repetition</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm ${reviewStatus.color || 'text-slate-700 dark:text-slate-300'}`}>{reviewStatus.status}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Leitner-based drill intervals</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Quick Actions */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5 space-y-3">
                <button
                  onClick={handleScrollToPractice}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all"
                >
                  <ListChecks className="w-4 h-4" />
                  Practice Questions
                </button>
                
                {tricks?.length > 0 && (
                  <Link
                    to={`/topics/${slug}/speed-drill`}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all border border-slate-200/55 dark:border-slate-600/40"
                  >
                    <Flame className="w-4 h-4 text-amber-500" />
                    Speed Drill (10 Q)
                  </Link>
                )}

                <button
                  onClick={triggerDownloadCheatSheet}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs transition-all border border-slate-200/50 dark:border-slate-700/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print Topic Cheat Sheet
                </button>
              </div>

              {/* Related topics */}
              {RELATED_TOPICS[slug] && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Related Topics</p>
                  <div className="space-y-2">
                    {RELATED_TOPICS[slug].map((rt, i) => (
                      <Link
                        key={i}
                        to={`/topics/${rt.slug}`}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-750 hover:border-indigo-300 dark:hover:border-indigo-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all bg-slate-50/50 dark:bg-slate-900/10"
                      >
                        <span>{rt.name}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PracticeQuestion({ q, index, token, userId, answers, setAnswers, revealed, setRevealed, wrongQuestionIds, setWrongQuestionIds, handleScrollToTrick }) {
  const selected = answers[q.id];
  const isRevealed = revealed[q.id];
  const options = Array.isArray(q.options_json) ? q.options_json : JSON.parse(q.options_json || '[]');

  const handleSelect = async (opt) => {
    if (isRevealed) return;
    setAnswers(prev => ({ ...prev, [q.id]: opt }));
    setRevealed(prev => ({ ...prev, [q.id]: true }));

    const isCorrect = opt === q.correct_answer;
    if (!isCorrect) {
      setWrongQuestionIds(prev => {
        const copy = new Set(prev);
        copy.add(q.id);
        return copy;
      });
    }

    // Submit progress (standard day number completion helper)
    try {
      await fetch(`/api/days/${q.day_number || 1}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ section: q.section, answer: opt, questionId: q.id })
      });
    } catch (e) { /* silent */ }
  };

  const isCorrect = isRevealed && selected === q.correct_answer;
  const isWrong = isRevealed && selected && selected !== q.correct_answer;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{q.section}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              q.difficulty === 'Hard' ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600' :
              q.difficulty === 'Medium' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600' :
              'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600'
            }`}>{q.difficulty}</span>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{q.question_text}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt, oi) => {
          const isSelected = selected === opt;
          const isThisCorrect = isRevealed && opt === q.correct_answer;
          const isThisWrong = isRevealed && isSelected && opt !== q.correct_answer;
          return (
            <button
              key={oi}
              onClick={() => handleSelect(opt)}
              disabled={isRevealed}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-left font-medium transition-all border ${
                isThisCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : isThisWrong
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                  : isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {isThisCorrect ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" /> :
               isThisWrong ? <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" /> :
               <span className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0 opacity-50" />}
              {opt}
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div className="mt-4 space-y-3">
          {/* Wrong answer contextual tip linking back to trick */}
          {isWrong && q.associatedTrick && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/35 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                This used the <strong>{q.associatedTrick.name}</strong>.{' '}
                <button
                  onClick={() => handleScrollToTrick(q.associatedTrick.id)}
                  className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                >
                  Go review it
                </button>
              </span>
            </div>
          )}

          {q.solution_explanation && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Explanation</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{q.solution_explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
