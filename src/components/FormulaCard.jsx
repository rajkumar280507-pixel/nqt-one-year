import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

export default function FormulaCard({ formula }) {
  const [copied, setCopied] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formula.formula_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="group flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
      {/* Formula text */}
      <code 
        onClick={handleCopy}
        className="flex-1 font-mono text-sm text-indigo-900 dark:text-indigo-200 break-all leading-relaxed cursor-pointer hover:underline"
        title="Tap to copy"
      >
        {formula.formula_text}
      </code>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Info icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowHint(v => !v)}
            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            aria-label="When to use"
          >
            <Info className="w-4 h-4" />
          </button>
          {showHint && (
            <div className="absolute right-0 bottom-8 w-56 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-xl p-3 shadow-xl z-20 leading-relaxed">
              {formula.use_when_hint}
              <div className="absolute bottom-[-6px] right-3 w-3 h-3 bg-slate-900 dark:bg-slate-700 rotate-45" />
            </div>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          aria-label="Copy formula"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
