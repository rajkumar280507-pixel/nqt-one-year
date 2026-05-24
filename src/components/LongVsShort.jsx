import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LongVsShort({ lvs }) {
  const [page, setPage] = useState(0); // 0 = long, 1 = short (mobile swipe)
  if (!lvs) return null;

  const longMethod = typeof lvs.long === 'string' ? JSON.parse(lvs.long) : lvs.long;
  const shortMethod = typeof lvs.short === 'string' ? JSON.parse(lvs.short) : lvs.short;

  if (!longMethod || !shortMethod) return null;

  const MethodColumn = ({ method, label, color }) => (
    <div className={`flex-1 p-5 rounded-2xl border ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20">
          <Clock className="w-3 h-3" />
          ~{method.time_sec}s
        </span>
      </div>
      <ol className="space-y-2">
        {(method.steps || []).map((step, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="w-4 h-4 rounded-full bg-white/50 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div>
      {/* Desktop: side-by-side */}
      <div className="hidden sm:flex gap-4">
        <MethodColumn method={longMethod} label="Long Way" color="border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300" />
        <MethodColumn method={shortMethod} label="⚡ Shortcut" color="border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300" />
      </div>

      {/* Mobile: swipeable */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500">
            {page === 0 ? '📖 Long Way' : '⚡ Shortcut'}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(0)} className={`w-2 h-2 rounded-full transition-colors ${page === 0 ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <button onClick={() => setPage(1)} className={`w-2 h-2 rounded-full transition-colors ${page === 1 ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
          </div>
          <div className="flex gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        {page === 0
          ? <MethodColumn method={longMethod} label="Long Way" color="border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300" />
          : <MethodColumn method={shortMethod} label="⚡ Shortcut" color="border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300" />
        }
      </div>
    </div>
  );
}
