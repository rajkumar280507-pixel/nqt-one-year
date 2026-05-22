import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Award, BookOpen, AlertCircle, ArrowRight, X, FileText, CheckCircle } from 'lucide-react';

export default function Topics({ token }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  
  // Detail modal state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/topics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch topics.');
      }
      setTopics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = async (topic) => {
    setSelectedTopic(topic);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const response = await fetch(`/api/topics/${topic.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch topic details.');
      }
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const sections = ['All', 'Aptitude', 'Reasoning', 'Verbal', 'Programming Logic', 'Coding'];

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'All' || t.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading Topics Library...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-8 h-8 text-primary-600" /> Syllabus Topics Library
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore all TCS NQT core syllabus concepts, terminology, definitions, and vocabulary sheets.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic name, definitions..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Section Pill Filters */}
        <div className="flex flex-wrap gap-1.5">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                selectedSection === sec
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Topics Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try resetting filters or adjusting search queries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full">
                  {topic.section}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {topic.name}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-2">
                  {topic.definition}
                </p>
              </div>

              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                <span>{parseInt(topic.questions_count || 0)} Questions Seeded</span>
                <span className="text-primary-600 dark:text-primary-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic Detail Modal overlay */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full">
                  {selectedTopic.section}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
                  {selectedTopic.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-650"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Definition</h4>
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-mono bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl">
                  {selectedTopic.definition}
                </p>
              </div>

              {/* Vocabulary lists */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Vocabulary & Core Concepts</h4>
                
                {detailLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-2">Loading vocab sheets...</p>
                  </div>
                ) : detailData?.vocabulary && detailData.vocabulary.length > 0 ? (
                  <div className="space-y-3.5">
                    {detailData.vocabulary.map((vocab) => (
                      <div key={vocab.id} className="p-4 border border-slate-150 dark:border-slate-850 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30">
                        <span className="font-bold text-sm text-primary-600 dark:text-primary-400">{vocab.term}</span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{vocab.meaning}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2">"{vocab.example_sentence}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No vocabulary sheets loaded for this topic.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {detailData?.questions?.length || 0} practice questions available.
              </span>

              <button
                disabled={!detailData?.questions?.length}
                onClick={() => {
                  const dayNum = detailData.questions[0].day_number;
                  setSelectedTopic(null);
                  navigate(`/today?day=${dayNum}`);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-40 disabled:hover:bg-primary-600 transition"
              >
                Practice Questions <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
