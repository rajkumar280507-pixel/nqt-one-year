import React, { useState, useEffect } from 'react';
import { 
  Search, Code2, AlertCircle, ChevronRight, Play, Eye, 
  Lightbulb, RefreshCw, X, CheckCircle, Flame, FileCode2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Coding({ token }) {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Active IDE Modal
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [ideLoading, setIdeLoading] = useState(false);
  const [codingLanguage, setCodingLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [revealedHints, setRevealedHints] = useState(false);
  const [revealedApproaches, setRevealedApproaches] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState(false);
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeRunResult, setCodeRunResult] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch problems list
      const probRes = await fetch('/api/coding-problems', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const probData = await probRes.json();
      if (!probRes.ok) throw new Error(probData.error || 'Failed to load coding bank.');

      // Fetch topics list
      const topicRes = await fetch('/api/topics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const topicData = await topicRes.json();
      
      setProblems(probData);
      setTopics(topicData.filter(t => t.section === 'Coding'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCodeTemplate = (lang, title) => {
    if (lang === 'python') {
      return `# ${title}\n# Write your Python 3 code here\nimport sys\n\n# Read inputs from stdin\n# Example: data = sys.stdin.read().split()\n`;
    } else if (lang === 'cpp') {
      return `// ${title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write C++ code here\n    return 0;\n}\n`;
    } else if (lang === 'java') {
      return `// ${title}\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write Java code here\n    }\n}\n`;
    }
    return '';
  };

  const handleOpenIDE = async (problem) => {
    setSelectedProblem(problem);
    setIdeLoading(true);
    setDayData(null);
    setCodeRunResult(null);
    setRevealedHints(false);
    setRevealedApproaches(false);
    setRevealedCodes(false);
    
    try {
      // Fetch full day plan to get problem statement, test cases, and solution details
      const response = await fetch(`/api/days/${problem.day_number}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch problem details.');

      setDayData(data);
      const fullProblem = data.codingProblems.find(p => p.id === problem.id);
      
      if (fullProblem) {
        if (fullProblem.attempted && fullProblem.solution_code_by_lang_json) {
          setCodeContent(fullProblem.solution_code_by_lang_json[codingLanguage] || '');
        } else {
          setCodeContent(getCodeTemplate(codingLanguage, fullProblem.title));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIdeLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setCodingLanguage(lang);
    if (!dayData || !selectedProblem) return;
    const fullProblem = dayData.codingProblems.find(p => p.id === selectedProblem.id);
    if (!fullProblem) return;

    if (revealedCodes && fullProblem.solution_code_by_lang_json) {
      setCodeContent(fullProblem.solution_code_by_lang_json[lang] || '');
    } else {
      setCodeContent(getCodeTemplate(lang, fullProblem.title));
    }
  };

  const handleRunCode = async () => {
    if (!selectedProblem || !codeContent) return;
    setCodeRunning(true);
    setCodeRunResult(null);

    try {
      const response = await fetch('/api/code/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: codingLanguage,
          source: codeContent,
          problemId: selectedProblem.id
        })
      });
      const data = await response.json();
      
      setCodeRunResult(data);
      
      if (data.passed) {
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCodeRunning(false);
    }
  };

  const difficulties = ['All', 'Easy', 'Easy-Medium', 'Medium', 'Medium-Hard'];

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    const matchesTopic = selectedTopic === 'All' || String(p.topic_id) === selectedTopic;
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading Coding Bank...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-8 h-8 text-primary-600" /> TCS NQT Coding Bank
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Access all 730 structured coding challenges designed specifically for Advanced TCS NQT DSA syllabus.
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="All">All Difficulties</option>
            {difficulties.slice(1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Topic Dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-2 focus:ring-primary-500 focus:outline-none max-w-xs"
          >
            <option value="All">All Topics</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems List Grid */}
      {filteredProblems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Problems Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try resetting filters or adjusting search queries.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-850">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Slot</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850 bg-transparent text-sm">
                {filteredProblems.map((prob) => (
                  <tr 
                    key={prob.id} 
                    onClick={() => handleOpenIDE(prob)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                      Day {prob.day_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {prob.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prob.difficulty.includes('Easy')
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      Slot {prob.slot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <span className="text-primary-600 dark:text-primary-400 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Solve Code <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screen IDE Modal Overlay */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-6 h-6 text-primary-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedProblem.title}
                  </h2>
                  <p className="text-[10px] text-slate-400">Day {selectedProblem.day_number} Plan Curriculum</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-650"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Modal Body (IDE Split View) */}
            {ideLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="mt-2 text-xs text-slate-500">Loading IDE Workspace...</p>
              </div>
            ) : dayData ? (
              (() => {
                const fullProblem = dayData.codingProblems.find(p => p.id === selectedProblem.id);
                if (!fullProblem) return <p className="p-6 text-center text-rose-500">Problem statement not found.</p>;

                return (
                  <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Panel: Description */}
                    <div className="lg:w-1/2 p-6 overflow-y-auto border-r border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-slate-850 dark:text-slate-200">Problem Description</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {fullProblem.difficulty}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-350 text-sm whitespace-pre-line leading-relaxed">
                          {fullProblem.statement}
                        </p>
                      </div>

                      {fullProblem.input_format && (
                        <div className="space-y-1.5">
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-350">Input Format:</strong>
                          <p className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850 whitespace-pre-line text-slate-600 dark:text-slate-400">
                            {fullProblem.input_format}
                          </p>
                        </div>
                      )}

                      {fullProblem.output_format && (
                        <div className="space-y-1.5">
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-350">Output Format:</strong>
                          <p className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850 whitespace-pre-line text-slate-600 dark:text-slate-400">
                            {fullProblem.output_format}
                          </p>
                        </div>
                      )}

                      {fullProblem.constraints && (
                        <div className="space-y-1">
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-350">Constraints:</strong>
                          <p className="text-xs font-mono text-rose-600 dark:text-rose-400">{fullProblem.constraints}</p>
                        </div>
                      )}

                      {/* Sample Tests */}
                      <div className="space-y-2">
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-350">Sample Test Cases:</strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {fullProblem.sample_tests_json.map((tc, idx) => (
                            <div key={idx} className="p-3 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] space-y-1.5">
                              <span className="font-bold text-[10px] text-slate-400">Sample {idx + 1}</span>
                              <div>
                                <span className="text-primary-600 font-bold">Input:</span>
                                <pre className="whitespace-pre-wrap mt-0.5 text-slate-700 dark:text-slate-300">{tc.input}</pre>
                              </div>
                              <div className="pt-1.5 border-t border-slate-150 dark:border-slate-850">
                                <span className="text-emerald-600 font-bold">Output:</span>
                                <pre className="whitespace-pre-wrap mt-0.5 text-slate-700 dark:text-slate-300">{tc.output}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Progressive Solutions Reveal */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {/* Hint */}
                        {!revealedHints ? (
                          <button
                            onClick={() => setRevealedHints(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 rounded-lg text-xs font-bold border border-amber-250/30"
                          >
                            <Lightbulb className="w-3.5 h-3.5" /> Reveal Hint
                          </button>
                        ) : (
                          <div className="w-full p-3.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                            <strong>💡 Hint:</strong> {fullProblem.hint}
                          </div>
                        )}

                        {/* Approach */}
                        {!revealedApproaches ? (
                          <button
                            onClick={() => setRevealedApproaches(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/40 rounded-lg text-xs font-bold border border-blue-250/30"
                          >
                            <Eye className="w-3.5 h-3.5" /> Reveal Approach
                          </button>
                        ) : (
                          <div className="w-full p-3.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-900/20 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                            <strong>⚙️ Approach:</strong> {fullProblem.approach}
                          </div>
                        )}

                        {/* Solution Code */}
                        {!revealedCodes ? (
                          <button
                            onClick={() => {
                              setRevealedCodes(true);
                              if (fullProblem.solution_code_by_lang_json) {
                                const sol = fullProblem.solution_code_by_lang_json[codingLanguage] || '';
                                if (sol) setCodeContent(sol);
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/40 rounded-lg text-xs font-bold border border-purple-250/30"
                          >
                            <Eye className="w-3.5 h-3.5" /> Reveal Solution Code
                          </button>
                        ) : (
                          <div className="w-full p-3.5 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/40 dark:border-purple-900/20 rounded-xl text-xs text-purple-800 dark:text-purple-300">
                            <strong>💻 Reference Code:</strong> Solution code loaded. Select compiler above to view directly in the workspace.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Editor + Terminal */}
                    <div className="lg:w-1/2 flex flex-col overflow-hidden bg-slate-950">
                      {/* Editor Toolbar */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                        <span className="text-xs text-slate-400 font-mono">
                          workspace.{codingLanguage === 'python' ? 'py' : codingLanguage === 'cpp' ? 'cpp' : 'java'}
                        </span>
                        
                        <select
                          value={codingLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="bg-slate-800 text-slate-350 border-0 rounded-lg text-xs font-bold py-1 px-2.5 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        >
                          <option value="python">Python 3</option>
                          <option value="cpp">C++ (g++)</option>
                          <option value="java">Java (JDK)</option>
                        </select>
                      </div>

                      {/* Textarea Editor */}
                      <textarea
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        placeholder="Write code here..."
                        className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-none border-0"
                        spellCheck={false}
                      />

                      {/* IDE Action Bar */}
                      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">
                          Tested against 3 visible + 5 hidden test cases.
                        </span>
                        
                        <button
                          onClick={handleRunCode}
                          disabled={codeRunning}
                          className="flex items-center gap-1.5 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40"
                        >
                          {codeRunning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling...
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" /> Run Code
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Execution Output Terminal */}
                      {codeRunResult && (
                        <div className="h-44 border-t border-slate-850 bg-slate-900/90 overflow-y-auto p-4 font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-slate-400 uppercase">Terminal Output</span>
                            <span className={`font-bold ${codeRunResult.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {codeRunResult.passed ? 'PASS' : 'FAIL'} ({codeRunResult.passed_count}/{codeRunResult.total_count})
                            </span>
                          </div>

                          {codeRunResult.error && (
                            <pre className="text-rose-450 whitespace-pre-wrap">{codeRunResult.error}</pre>
                          )}

                          {codeRunResult.results && (
                            <div className="space-y-1">
                              {codeRunResult.results.map((res, index) => (
                                <div key={index} className="flex justify-between items-center text-[10px] py-0.5">
                                  <span className="text-slate-400">Case {index + 1}:</span>
                                  <span className={res.passed ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                                    {res.passed ? 'Passed' : 'Wrong Answer'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                <p className="text-xs text-slate-500">Failed to load problem details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
