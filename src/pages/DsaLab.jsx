import React from 'react';
import { Code2, Activity, Play, ChevronRight, HelpCircle } from 'lucide-react';

export default function DsaLab({ token }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-8 h-8 text-primary-600" /> NQT DSA Laboratory
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Learn data structures and algorithms through interactive, step-by-step SVG animations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-center items-center min-h-[400px]">
          <Activity className="w-12 h-12 text-slate-300 animate-pulse" />
          <p className="text-slate-450 mt-4 text-xs font-semibold">Select an algorithm to begin animated traversal...</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-850 dark:text-white mb-4">Algorithm Catalog</h3>
          <p className="text-xs text-slate-500 mb-4">Select a category below to explore visualizations:</p>
          <div className="space-y-2">
            {['Arrays & Lists', 'Sorting Algorithms', 'Searching & Trees', 'Dynamic Programming'].map((cat) => (
              <div key={cat} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex justify-between items-center text-xs font-bold transition">
                <span>{cat}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
