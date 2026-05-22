import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Video, Plus, FileQuestion, Code, Save, 
  Trash2, RefreshCw, AlertCircle, CheckCircle2, ChevronDown 
} from 'lucide-react';

export default function Admin({ token }) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'mcq' | 'coding'
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // 1. Concept Video URL Fields
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // 2. MCQ Fields
  const [mcqData, setMcqData] = useState({
    id: '',
    day_number: '',
    section: 'Aptitude',
    type: 'MCQ',
    question_text: '',
    options: { A: '', B: '', C: '', D: '' },
    correct_answer: 'A',
    solution_explanation: '',
    difficulty: 'Medium'
  });

  // 3. Coding Problem Fields
  const [codingData, setCodingData] = useState({
    id: '',
    day_number: '',
    slot: 1,
    title: '',
    statement: '',
    input_format: '',
    output_format: '',
    constraints: '',
    sample_tests: [{ input: '', output: '' }, { input: '', output: '' }],
    hidden_tests: [{ input: '', output: '' }, { input: '', output: '' }, { input: '', output: '' }],
    hint: '',
    approach: '',
    solution_code: { python: '', cpp: '', java: '' },
    topic_id: '',
    difficulty: 'Easy'
  });

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
      setTopics(data);
      if (data.length > 0) setSelectedTopicId(data[0].id);
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Failed to load syllabus topics.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!selectedTopicId || !videoUrl) {
      setFeedback({ type: 'error', msg: 'Please select a topic and enter video URL.' });
      return;
    }
    setSubmitLoading(true);
    setFeedback({ type: '', msg: '' });
    try {
      const response = await fetch('/api/admin/video-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topicId: parseInt(selectedTopicId), url: videoUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update video URL.');
      
      setFeedback({ type: 'success', msg: data.message || 'Successfully updated concept video URL.' });
      setVideoUrl('');
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveMcq = async (e) => {
    e.preventDefault();
    const { day_number, section, question_text, options, correct_answer, solution_explanation, difficulty } = mcqData;
    if (!day_number || !section || !question_text || !options.A || !options.B || !solution_explanation || !difficulty) {
      setFeedback({ type: 'error', msg: 'Please complete all required MCQ fields.' });
      return;
    }
    setSubmitLoading(true);
    setFeedback({ type: '', msg: '' });
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: mcqData.id ? parseInt(mcqData.id) : undefined,
          day_number: parseInt(day_number),
          section,
          type: mcqData.type,
          question_text,
          options_json: options,
          correct_answer,
          solution_explanation,
          difficulty
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save question details.');

      setFeedback({ type: 'success', msg: `Question successfully ${mcqData.id ? 'updated' : 'created'} (ID: ${data.id})` });
      // Reset form
      setMcqData({
        id: '',
        day_number: '',
        section: 'Aptitude',
        type: 'MCQ',
        question_text: '',
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: 'A',
        solution_explanation: '',
        difficulty: 'Medium'
      });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveCoding = async (e) => {
    e.preventDefault();
    const { day_number, slot, title, statement, sample_tests, hidden_tests, solution_code, topic_id, difficulty } = codingData;
    if (!day_number || !slot || !title || !statement || !difficulty) {
      setFeedback({ type: 'error', msg: 'Please complete all required fields for coding problem.' });
      return;
    }
    setSubmitLoading(true);
    setFeedback({ type: '', msg: '' });
    try {
      const response = await fetch('/api/admin/coding-problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: codingData.id ? parseInt(codingData.id) : undefined,
          day_number: parseInt(day_number),
          slot: parseInt(slot),
          title,
          statement,
          input_format: codingData.input_format,
          output_format: codingData.output_format,
          constraints: codingData.constraints,
          sample_tests_json: sample_tests,
          hidden_tests_json: hidden_tests,
          hint: codingData.hint,
          approach: codingData.approach,
          solution_code_by_lang_json: solution_code,
          topic_id: topic_id ? parseInt(topic_id) : null,
          difficulty
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save coding problem.');

      setFeedback({ type: 'success', msg: `Coding problem successfully ${codingData.id ? 'updated' : 'created'} (ID: ${data.id})` });
      // Reset form
      setCodingData({
        id: '',
        day_number: '',
        slot: 1,
        title: '',
        statement: '',
        input_format: '',
        output_format: '',
        constraints: '',
        sample_tests: [{ input: '', output: '' }, { input: '', output: '' }],
        hidden_tests: [{ input: '', output: '' }, { input: '', output: '' }, { input: '', output: '' }],
        hint: '',
        approach: '',
        solution_code: { python: '', cpp: '', java: '' },
        topic_id: '',
        difficulty: 'Easy'
      });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddSampleCase = () => {
    setCodingData(prev => ({
      ...prev,
      sample_tests: [...prev.sample_tests, { input: '', output: '' }]
    }));
  };

  const handleAddHiddenCase = () => {
    setCodingData(prev => ({
      ...prev,
      hidden_tests: [...prev.hidden_tests, { input: '', output: '' }]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <RefreshCw className="w-8 h-8 text-primary-650 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Validating Admin Credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-500" /> Admin Content Manager
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Superuser panel: seed/update daily curriculum lectures, MCQs, and coding problem definitions.
          </p>
        </div>
      </div>

      {/* Feedback Panel */}
      {feedback.msg && (
        <div className={`p-4 mb-6 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/35 text-emerald-650 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-4">
        <button
          onClick={() => { setActiveTab('video'); setFeedback({ type: '', msg: '' }); }}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'video' 
              ? 'border-primary-605 text-primary-600 dark:text-primary-400 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Video className="w-4.5 h-4.5" /> Concept Video URLs
        </button>

        <button
          onClick={() => { setActiveTab('mcq'); setFeedback({ type: '', msg: '' }); }}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'mcq' 
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileQuestion className="w-4.5 h-4.5" /> MCQ Manager
        </button>

        <button
          onClick={() => { setActiveTab('coding'); setFeedback({ type: '', msg: '' }); }}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'coding' 
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code className="w-4.5 h-4.5" /> Coding Problems
        </button>
      </div>

      {/* TAB 1: Concept Video Editor */}
      {activeTab === 'video' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-6">Attach/Update Concept Lecture Video</h3>
          <form onSubmit={handleUpdateVideo} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Select Syllabus Topic:</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold"
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>[{t.section}] {t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">YouTube URL Embed Link:</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Please provide standard embeddable format e.g. /embed/ID format if possible, otherwise standard YouTube URL.</p>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 flex items-center gap-1.5 justify-center"
            >
              {submitLoading ? 'Updating DB...' : 'Save Video URL'} <Save className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MCQ Manager */}
      {activeTab === 'mcq' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-6">Create or Edit MCQ Item</h3>
          <form onSubmit={handleSaveMcq} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Question ID (optional for edit):</label>
                <input
                  type="number"
                  placeholder="Insert to edit existing"
                  value={mcqData.id}
                  onChange={(e) => setMcqData({ ...mcqData, id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Day Number (1-365) *:</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={mcqData.day_number}
                  onChange={(e) => setMcqData({ ...mcqData, day_number: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Section *:</label>
                <select
                  value={mcqData.section}
                  onChange={(e) => setMcqData({ ...mcqData, section: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs font-semibold"
                >
                  <option value="Aptitude">Aptitude</option>
                  <option value="Reasoning">Reasoning</option>
                  <option value="Verbal">Verbal</option>
                  <option value="Programming Logic">Programming Logic / Pseudo-Code</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Question Text *:</label>
              <textarea
                value={mcqData.question_text}
                onChange={(e) => setMcqData({ ...mcqData, question_text: e.target.value })}
                rows="3"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Option A *:</label>
                <input
                  type="text"
                  value={mcqData.options.A}
                  onChange={(e) => setMcqData({ ...mcqData, options: { ...mcqData.options, A: e.target.value } })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Option B *:</label>
                <input
                  type="text"
                  value={mcqData.options.B}
                  onChange={(e) => setMcqData({ ...mcqData, options: { ...mcqData.options, B: e.target.value } })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Option C:</label>
                <input
                  type="text"
                  value={mcqData.options.C}
                  onChange={(e) => setMcqData({ ...mcqData, options: { ...mcqData.options, C: e.target.value } })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Option D:</label>
                <input
                  type="text"
                  value={mcqData.options.D}
                  onChange={(e) => setMcqData({ ...mcqData, options: { ...mcqData.options, D: e.target.value } })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Correct Answer Option *:</label>
                <select
                  value={mcqData.correct_answer}
                  onChange={(e) => setMcqData({ ...mcqData, correct_answer: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs font-bold"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Difficulty *:</label>
                <select
                  value={mcqData.difficulty}
                  onChange={(e) => setMcqData({ ...mcqData, difficulty: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs font-semibold"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Worked Solution Explanation *:</label>
              <textarea
                value={mcqData.solution_explanation}
                onChange={(e) => setMcqData({ ...mcqData, solution_explanation: e.target.value })}
                rows="4"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 flex items-center gap-1.5 justify-center"
            >
              {submitLoading ? 'Saving...' : 'Save Question'} <Save className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Coding Problems */}
      {activeTab === 'coding' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-6">Create or Edit DSA Coding Challenge</h3>
          <form onSubmit={handleSaveCoding} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Problem ID (optional for edit):</label>
                <input
                  type="number"
                  placeholder="Insert to edit existing"
                  value={codingData.id}
                  onChange={(e) => setCodingData({ ...codingData, id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Day Number (1-365) *:</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={codingData.day_number}
                  onChange={(e) => setCodingData({ ...codingData, day_number: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Slot (1 or 2) *:</label>
                <select
                  value={codingData.slot}
                  onChange={(e) => setCodingData({ ...codingData, slot: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs font-bold"
                >
                  <option value="1">Slot 1 (Easy)</option>
                  <option value="2">Slot 2 (Easy-Medium / Medium)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Difficulty *:</label>
                <select
                  value={codingData.difficulty}
                  onChange={(e) => setCodingData({ ...codingData, difficulty: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs font-semibold"
                >
                  <option value="Easy">Easy</option>
                  <option value="Easy-Medium">Easy-Medium</option>
                  <option value="Medium">Medium</option>
                  <option value="Medium-Hard">Medium-Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Problem Title *:</label>
                <input
                  type="text"
                  value={codingData.title}
                  onChange={(e) => setCodingData({ ...codingData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Topic Selection:</label>
                <select
                  value={codingData.topic_id}
                  onChange={(e) => setCodingData({ ...codingData, topic_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none text-xs font-semibold"
                >
                  <option value="">None (General Coding)</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>[{t.section}] {t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Problem Statement *:</label>
              <textarea
                value={codingData.statement}
                onChange={(e) => setCodingData({ ...codingData, statement: e.target.value })}
                rows="4"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Input Format:</label>
                <textarea
                  value={codingData.input_format}
                  onChange={(e) => setCodingData({ ...codingData, input_format: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Output Format:</label>
                <textarea
                  value={codingData.output_format}
                  onChange={(e) => setCodingData({ ...codingData, output_format: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Constraints:</label>
                <textarea
                  value={codingData.constraints}
                  onChange={(e) => setCodingData({ ...codingData, constraints: e.target.value })}
                  placeholder="e.g. 1 <= N <= 10^5"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Test Cases Arrays */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Sample Test Cases (Shown to Student)</h4>
                <button
                  type="button"
                  onClick={handleAddSampleCase}
                  className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Case
                </button>
              </div>

              {codingData.sample_tests.map((test, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Sample Input {idx + 1}:</label>
                    <textarea
                      value={test.input}
                      onChange={(e) => {
                        const nextTests = [...codingData.sample_tests];
                        nextTests[idx].input = e.target.value;
                        setCodingData({ ...codingData, sample_tests: nextTests });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Expected Output {idx + 1}:</label>
                    <textarea
                      value={test.output}
                      onChange={(e) => {
                        const nextTests = [...codingData.sample_tests];
                        nextTests[idx].output = e.target.value;
                        setCodingData({ ...codingData, sample_tests: nextTests });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Hidden Evaluation Test Cases (5 Required)</h4>
                <button
                  type="button"
                  onClick={handleAddHiddenCase}
                  className="text-xs text-primary-650 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Case
                </button>
              </div>

              {codingData.hidden_tests.map((test, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Hidden Input {idx + 1}:</label>
                    <textarea
                      value={test.input}
                      onChange={(e) => {
                        const nextTests = [...codingData.hidden_tests];
                        nextTests[idx].input = e.target.value;
                        setCodingData({ ...codingData, hidden_tests: nextTests });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Expected Output {idx + 1}:</label>
                    <textarea
                      value={test.output}
                      onChange={(e) => {
                        const nextTests = [...codingData.hidden_tests];
                        nextTests[idx].output = e.target.value;
                        setCodingData({ ...codingData, hidden_tests: nextTests });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Problem Hint:</label>
                <textarea
                  value={codingData.hint}
                  onChange={(e) => setCodingData({ ...codingData, hint: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Approach explanation:</label>
                <textarea
                  value={codingData.approach}
                  onChange={(e) => setCodingData({ ...codingData, approach: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Python 3 Reference Solution Code:</label>
              <textarea
                value={codingData.solution_code.python}
                onChange={(e) => setCodingData({ ...codingData, solution_code: { ...codingData.solution_code, python: e.target.value } })}
                rows="4"
                className="w-full bg-slate-955 text-slate-100 p-3 font-mono text-xs rounded-xl focus:outline-none resize-none border border-slate-800"
                spellCheck={false}
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 flex items-center gap-1.5 justify-center"
            >
              {submitLoading ? 'Saving...' : 'Save Coding Problem'} <Save className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
