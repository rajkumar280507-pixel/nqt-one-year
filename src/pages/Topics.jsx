import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Award, BookOpen, AlertCircle, ArrowRight, Zap, Calculator, Star } from 'lucide-react';
import MasteryRing from '../components/MasteryRing';

function getDifficultyBadge(topicName) {
  const foundation = ['Number System', 'LCM & HCF', 'Divisibility Rules', 'Decimal Fractions', 'Power & Roots', 'BODMAS Rule', 'C & Python Syntax Basics', '1-D Arrays Traversal', 'Synonyms & Antonyms', 'Sentence Correction'];
  const advanced = ['Permutations & Combinations', 'Probability Intro', 'Advanced P&C and Probability', 'Geometry', 'Mensuration', 'Volume & Surface Area', 'Clocks & Calendars', 'Mixtures & Alligation', 'Simple & Compound Interest', 'Dynamic Programming', 'Graphs', 'Trees & Binary Search Trees', 'Greedy & Backtracking', 'Linked Lists Basics', 'Stacks & Queues', 'Hashing & Sliding Window', 'Advanced Pseudo-Code', 'OOP, DBMS & OS Basics'];
  
  if (foundation.some(f => topicName.includes(f) || f.includes(topicName))) {
    return { label: 'Foundation', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' };
  } else if (advanced.some(a => topicName.includes(a) || a.includes(topicName))) {
    return { label: 'Advanced', color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40' };
  } else {
    return { label: 'Intermediate', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' };
  }
}


function slugify(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const SECTION_COLORS = {
  'Aptitude':          'from-primary-500 to-indigo-500',
  'Reasoning':         'from-violet-500 to-purple-500',
  'Verbal':            'from-pink-500 to-rose-500',
  'Programming Logic': 'from-amber-500 to-orange-500',
  'Coding':            'from-teal-500 to-emerald-500',
};

const SECTION_ICONS = {
  'Aptitude': Calculator,
  'Reasoning': Star,
  'Verbal': BookOpen,
  'Programming Logic': Zap,
  'Coding': Zap,
};

export default function Topics({ token }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/topics', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch topics.');
      setTopics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sections = ['All', 'Aptitude', 'Reasoning', 'Verbal', 'Programming Logic', 'Coding'];

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'All' || t.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  // Group by section for visual separation
  const grouped = {};
  filteredTopics.forEach(t => {
    if (!grouped[t.section]) grouped[t.section] = [];
    grouped[t.section].push(t);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading Topics Library…</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Topics Library</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {topics.length} topics  •  Click any topic to study formulas, tricks, and drills
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            id="topics-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topics…"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sections.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSection === sec
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Topics grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No topics match your search</h3>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([section, sectionTopics]) => {
            const Icon = SECTION_ICONS[section] || BookOpen;
            const gradient = SECTION_COLORS[section] || 'from-slate-500 to-slate-600';
            return (
              <div key={section}>
                {/* Section header */}
                {selectedSection === 'All' && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{section}</h2>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({sectionTopics.length})</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-2" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sectionTopics.map(topic => {
                    const TopicIcon = SECTION_ICONS[topic.section] || BookOpen;
                    const grad = SECTION_COLORS[topic.section] || 'from-slate-500 to-slate-600';
                    const topicSlug = slugify(topic.name);
                    const difficultyBadge = getDifficultyBadge(topic.name);
                    return (
                      <Link
                        key={topic.id}
                        to={`/topics/${topicSlug}`}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-800 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <TopicIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{topic.section}</span>
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${difficultyBadge.color}`}>
                                    {difficultyBadge.label}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                                  {topic.name}
                                </h3>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <MasteryRing percent={parseInt(topic.mastery_score || 0)} size={36} stroke={3.5} />
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {topic.definition}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              📘 {topic.vocab_count || 0} vocab &bull; ⚡ {topic.tricks_count || 0} tricks &bull; 📝 {topic.questions_count || 0} questions
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                            Study <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
