import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, CheckCircle, AlertTriangle, Calendar as CalendarIcon, ChevronRight, Lock } from 'lucide-react';

export default function Calendar({ token, user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [activeMonth, setActiveMonth] = useState(1);
  const navigate = useNavigate();

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
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch summary data.');
      }
      setSummaryData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (dayNum) => {
    if (!summaryData) return 'locked';
    
    const currentDay = Math.max(1, user?.last_active_day || 1);
    
    // Find activity for this day
    const dayActivity = summaryData.allActivity.find(a => a.day_number === dayNum);
    const completedCount = dayActivity ? parseInt(dayActivity.completed_sections) : 0;

    if (dayNum > currentDay) {
      return 'locked';
    }

    if (completedCount === 7) {
      return 'completed'; // Green
    } else if (completedCount > 0) {
      return 'partial'; // Yellow
    } else if (dayNum < currentDay) {
      return 'missed'; // Red
    } else {
      return 'today'; // Highlighted gray/blue
    }
  };

  const monthsInfo = [
    { num: 1, name: 'Month 1', label: 'Foundation & Basics', desc: 'Number System, C/Python syntax, and 1-D arrays.' },
    { num: 2, name: 'Month 2', label: 'Percentages & Loops', desc: 'Averages, profit/loss, strings, coding-decoding, and loops.' },
    { num: 3, name: 'Month 3', label: 'Time, Work & Recursion', desc: 'Time/speed/distance, probability, recursion, and 2-D matrices.' },
    { num: 4, name: 'Month 4', label: 'Geometry & Sorting', desc: 'Area, volume, pie charts, pointers, searching and sorting.' },
    { num: 5, name: 'Month 5', label: 'Advanced Quant & Lists', desc: 'Mixtures, SI/CI, clocks, pseudo-codes, and linked lists.' },
    { num: 6, name: 'Month 6', label: 'Probability & Stacks', desc: 'Venn diagrams, critical reasoning, stacks and queues.' },
    { num: 7, name: 'Month 7', label: 'OOP, DBMS, OS & Trees', desc: 'OOP concepts, query basics, system scheduling, and trees.' },
    { num: 8, name: 'Month 8', label: 'Hashing & Sliding Window', desc: 'Collision handling, maps, two-pointer arrays.' },
    { num: 9, name: 'Month 9', label: 'Greedy & Backtracking', desc: 'Knapsack algorithms, backtracking search patterns.' },
    { num: 10, name: 'Month 10', label: 'Dynamic Programming', desc: 'Tabulation vs memoization, LIS, LCS, coin changes.' },
    { num: 11, name: 'Month 11', label: 'Graphs & BFS/DFS', desc: 'Representations, Dijkstra shortest paths, topological sorts.' },
    { num: 12, name: 'Month 12', label: 'Revision & Timed Mocks', desc: 'Full length revision under timer controls.' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading Calendar Grid...</p>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-500 font-bold">Error loading summary metrics: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Streak</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{summaryData.streak} Days</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Days Started/Completed</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{summaryData.totalDaysDone} / 365 Days</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Preparation Journey</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {Math.round((summaryData.totalDaysDone / 365) * 100)}% Complete
            </p>
          </div>
        </div>
      </div>

      {/* Legend & Layout title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">365-Day Study Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Tap any active day to view the concept topics and practice questions.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
            <span>Completed (7/7)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-500"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-500"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800"></div>
            <span>Locked / Future</span>
          </div>
        </div>
      </div>

      {/* Main Calendar View: Months on left, active month details grid on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Month Selector Cards */}
        <div className="lg:col-span-4 space-y-2.5">
          {monthsInfo.map((m) => (
            <button
              key={m.num}
              onClick={() => setActiveMonth(m.num)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                activeMonth === m.num
                  ? 'bg-primary-600 text-white border-transparent shadow-lg shadow-primary-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="pr-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeMonth === m.num ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'}`}>
                  {m.name}
                </span>
                <h4 className="font-extrabold text-sm mt-0.5">{m.label}</h4>
                <p className={`text-[11px] mt-1 leading-snug ${activeMonth === m.num ? 'text-primary-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {m.desc}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 opacity-70" />
            </button>
          ))}
        </div>

        {/* Selected Month 30-Day Grid */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <span className="text-xs font-bold uppercase text-primary-600 dark:text-primary-400">Viewing Month Curriculum</span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {monthsInfo[activeMonth - 1].label} Grid
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Days {(activeMonth - 1) * 30 + 1} to {activeMonth * 30}
              </p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-4">
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = (activeMonth - 1) * 30 + idx + 1;
                const status = getDayStatus(dayNum);
                const isLocked = status === 'locked';
                
                let statusColors = 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed';
                if (status === 'completed') {
                  statusColors = 'bg-emerald-500 text-white hover:bg-emerald-600';
                } else if (status === 'partial') {
                  statusColors = 'bg-amber-500 text-white hover:bg-amber-600';
                } else if (status === 'missed') {
                  statusColors = 'bg-rose-500 text-white hover:bg-rose-600';
                } else if (status === 'today') {
                  statusColors = 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-2 border-primary-500 font-bold hover:bg-primary-100/50';
                }

                return (
                  <button
                    key={dayNum}
                    disabled={isLocked}
                    onClick={() => navigate(`/today?day=${dayNum}`)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 ${statusColors}`}
                    title={`Day ${dayNum} - Status: ${status}`}
                  >
                    {isLocked ? (
                      <Lock className="w-4 h-4 opacity-55" />
                    ) : (
                      <>
                        <span className="text-[10px] opacity-75">DAY</span>
                        <span className="text-lg font-extrabold leading-none mt-0.5">{dayNum}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
