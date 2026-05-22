import React, { useState, useEffect } from 'react';
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Flame, Award, CheckCircle2, AlertTriangle, BookOpen, Clock, 
  BarChart2, HelpCircle, Activity, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ token, user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/progress/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load progress summary.');
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } fontName:
    setLoading(false);
  };

  const fetchSummarySafe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/progress/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load progress summary.');
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch using final logic block
  useEffect(() => {
    fetchSummarySafe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <Activity className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Analyzing prep stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  // Calculate overall metrics
  const totalCompletedDays = summary?.totalDaysDone || 0;
  const coveragePercent = Math.round((totalCompletedDays / 365) * 100);
  
  // Format accuracy chart data
  const accuracyData = summary?.accuracyBySection 
    ? Object.entries(summary.accuracyBySection)
        .filter(([name]) => name !== 'Concept') // Don't chart concepts since they are checkbox, not MCQ/code scores
        .map(([name, data]) => ({
          name,
          accuracy: data.percentage,
          correct: data.correct,
          attempts: data.attempts
        }))
    : [];

  const totalAttempts = accuracyData.reduce((acc, curr) => acc + curr.attempts, 0);
  const totalCorrect = accuracyData.reduce((acc, curr) => acc + curr.correct, 0);
  const aggregateAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs font-semibold shadow-md space-y-1">
          <p className="text-slate-400">{data.name}</p>
          <p className="text-emerald-400 font-bold">{data.accuracy}% Accuracy</p>
          <p className="text-[10px] text-slate-400">
            {data.correct} Correct out of {data.attempts} Attempts
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-8 h-8 text-primary-600" /> Prep Analytics Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor your daily metrics, strengths, syllabus coverages, and auto-flagged weak spots.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Streak card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Flame className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Streak</p>
            <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white mt-0.5">
              {summary?.streak || 0} Days
            </h3>
          </div>
        </div>

        {/* Syllabus coverage card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syllabus Coverage</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white">
                {coveragePercent}%
              </h3>
              <span className="text-[10px] text-slate-500">({totalCompletedDays}/365 Days)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-primary-600 h-full" style={{ width: `${coveragePercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Accuracy Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Accuracy</p>
            <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white mt-0.5">
              {aggregateAccuracy}%
            </h3>
          </div>
        </div>

        {/* Total Questions Solved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Questions Answered</p>
            <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white mt-0.5">
              {totalAttempts}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recharts Accuracy Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-6 flex items-center gap-1.5">
            <BarChart2 className="w-5 h-5 text-primary-600" /> Accuracy per Syllabus Section
          </h3>

          {totalAttempts === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <BarChart2 className="w-12 h-12 text-slate-400 mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-350">No Data to Display</h4>
              <p className="text-slate-400 text-xs mt-1">Start answering today's concepts or programming tests to generate accuracy analytics.</p>
              <Link to="/today" className="mt-4 py-2 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                Start Day Plan
              </Link>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={accuracyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(tick) => `${tick}%`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {accuracyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.accuracy >= 75 ? '#10B981' : entry.accuracy >= 55 ? '#4F46E5' : '#EF4444'} 
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Weak Topics Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-4 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Auto-Flagged Weak Topics
            </h3>
            
            {summary?.weakTopics && summary.weakTopics.length > 0 ? (
              <div className="space-y-3.5 mt-4">
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-xl text-xs text-rose-700 dark:text-rose-400">
                  You have logged below 60% accuracy on the following subjects. We recommend targeted practice in the Coding Bank or revision pages.
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {summary.weakTopics.map((topic, index) => (
                    <div key={index} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{topic.name}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{topic.section}</p>
                      </div>
                      <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full text-[10px]">
                        {topic.accuracy}% accuracy
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-slate-850 dark:text-white text-sm">All Clean!</h4>
                <p className="text-slate-400 text-xs mt-1">No weak areas flagged. You are maintaining healthy accuracies across completed concepts.</p>
              </div>
            )}
          </div>

          <Link
            to="/coding"
            className="w-full mt-6 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition flex items-center justify-center gap-1.5"
          >
            Launch Coding Bank <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Activity heat map & study log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mt-8">
        <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-6 flex items-center gap-1.5">
          <Activity className="w-5 h-5 text-indigo-650" /> Study Activity Log
        </h3>

        {summary?.recentActivity && summary.recentActivity.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {summary.allActivity.slice(0, 14).map((activity) => (
              <div 
                key={activity.day_number}
                className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl text-center space-y-1"
              >
                <span className="text-[10px] text-slate-405 font-bold uppercase">Day {activity.day_number}</span>
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-current" />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">
                    {activity.completed_sections}/7
                  </span>
                </div>
                <p className="text-[9px] text-slate-400">sections complete</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No logged activity in database yet. Log daily items to track history.
          </div>
        )}
      </div>
    </div>
  );
}
