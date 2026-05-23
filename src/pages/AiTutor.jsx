import React, { useState } from 'react';
import { MessageSquareCode, Mic, AlertCircle, Sparkles } from 'lucide-react';

export default function AiTutor({ token, user }) {
  const [talkMode, setTalkMode] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-600 animate-pulse" /> AI Interview Coach
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Interact with your personal English tutor and TCS NQT preparation coach.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTalkMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              !talkMode ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setTalkMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              talkMode ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Talk
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[400px] flex flex-col justify-between shadow-sm">
        <div className="flex-1 flex flex-col justify-center items-center">
          <MessageSquareCode className="w-12 h-12 text-slate-350 animate-pulse" />
          <p className="text-slate-500 mt-4 text-xs font-bold">Start typing or tap the voice toggle to talk to the Tutor...</p>
        </div>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3">
          <input
            type="text"
            placeholder="Type a message to your AI tutor..."
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            disabled
          />
          <button className="p-3 bg-primary-600 text-white rounded-2xl cursor-not-allowed">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
