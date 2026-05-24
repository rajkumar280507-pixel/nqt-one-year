import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DIFF_LABELS = { 1: { label: 'Foundation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }, 2: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }, 3: { label: 'Advanced', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' } };

export default function TrickCard({ trick, slug, masteryScore = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const diff = DIFF_LABELS[trick.difficulty] || DIFF_LABELS[1];

  const methodSteps = Array.isArray(trick.method_steps_json)
    ? trick.method_steps_json
    : (typeof trick.method_steps_json === 'string' ? JSON.parse(trick.method_steps_json) : []);

  const workedExample = trick.worked_example_json
    ? (typeof trick.worked_example_json === 'string' ? JSON.parse(trick.worked_example_json) : trick.worked_example_json)
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{trick.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${diff.color}`}>{diff.label}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            <span className="font-medium text-slate-600 dark:text-slate-300">Spot it when: </span>
            {trick.spot_when}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {masteryScore > 0 && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{masteryScore}%</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-5 space-y-5">
          {/* Spot it when */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Spot It When…</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{trick.spot_when}</p>
          </div>

          {/* Method steps */}
          {methodSteps.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">The Method</p>
              <ol className="space-y-2">
                {methodSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Worked example */}
          {workedExample && (
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Worked Example</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Q: {workedExample.question}</p>
              {workedExample.steps && workedExample.steps.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {s.text}
                    {s.formula && (
                      <code className="ml-2 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded text-xs font-mono">{s.formula}</code>
                    )}
                  </div>
                </div>
              ))}
              {workedExample.answer && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Answer: </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{workedExample.answer}</span>
                </div>
              )}
            </div>
          )}

          {/* The trap */}
          {trick.trap_text && (
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Common Trap</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{trick.trap_text}</p>
              </div>
            </div>
          )}

          {/* Try it button */}
          <button
            onClick={() => navigate(`/topics/${slug}/trick/${trick.id}/drill`)}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm shadow-primary-500/20"
          >
            <Play className="w-4 h-4" />
            Try It — 3 Questions (30s each)
          </button>
        </div>
      )}
    </div>
  );
}
