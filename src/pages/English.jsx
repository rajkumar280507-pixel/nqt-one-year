import React, { useState } from 'react';
import { Mic, BookOpen, Volume2, Award, AlertCircle } from 'lucide-react';

export default function English({ token, user }) {
  const [activeTab, setActiveTab] = useState('vocab');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary-600" /> English & Communication Skills
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Develop speaking fluency, vocabulary power, and listening comprehension for IT interviews.
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-4 overflow-x-auto">
        {[
          { id: 'speaking', label: 'Speaking', icon: Mic },
          { id: 'listening', label: 'Listening', icon: Volume2 },
          { id: 'reading', label: 'Reading Stories', icon: BookOpen },
          { id: 'vocab', label: 'Vocab SRS Deck', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[300px] flex flex-col justify-center items-center">
        <AlertCircle className="w-10 h-10 text-slate-300 animate-pulse" />
        <p className="text-slate-450 mt-4 text-xs font-semibold">Select a tab above to launch A2/B1 curriculum components...</p>
      </div>
    </div>
  );
}
