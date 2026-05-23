import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, BookOpen, Volume2, Award, AlertCircle, Play, Pause,
  RotateCcw, Sparkles, Plus, Check, ChevronRight, X, Headphones,
  VolumeX, HelpCircle, GraduationCap, Star, ArrowRight, BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SPEAKING_PROMPTS = [
  { id: 'intro', text: 'Tell me about yourself. What are your software skills?' },
  { id: 'tcs', text: 'Why do you want to join TCS as a developer?' },
  { id: 'bug', text: 'Tell me about a difficult coding bug. How did you solve it?' },
  { id: 'team', text: 'Describe a project team project. What was your role?' },
  { id: 'explain', text: 'Explain the concept of loops to a complete beginner.' }
];

export default function English({ token, user }) {
  const [activeTab, setActiveTab] = useState('vocab');
  const [dayNumber, setDayNumber] = useState(user?.streak || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary-600 animate-pulse" /> English & Communication Lab
          </h1>
          <p className="text-slate-505 dark:text-slate-400 text-sm mt-1">
            Build your speaking confidence and learn core vocabulary for software jobs.
          </p>
        </div>

        {/* Day Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
          <span className="text-xs font-bold text-slate-500">Practice Day:</span>
          <input
            type="number"
            min="1"
            max="365"
            value={dayNumber}
            onChange={(e) => setDayNumber(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
            className="w-16 px-2 py-1 text-center font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-4 overflow-x-auto pb-1">
        {[
          { id: 'speaking', label: 'Speaking practice', icon: Mic },
          { id: 'listening', label: 'Listening practice', icon: Headphones },
          { id: 'reading', label: 'Bilingual stories & comics', icon: BookMarked },
          { id: 'vocab', label: 'Vocab SRS Deck', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl min-h-[500px]">
        {activeTab === 'speaking' && <SpeakingTab token={token} />}
        {activeTab === 'listening' && <ListeningTab token={token} dayNumber={dayNumber} />}
        {activeTab === 'reading' && <ReadingTab token={token} dayNumber={dayNumber} />}
        {activeTab === 'vocab' && <VocabTab token={token} />}
      </div>
    </div>
  );
}

/* ==========================================================================
   1. SPEAKING TAB
   ========================================================================== */
function SpeakingTab({ token }) {
  const [selectedPrompt, setSelectedPrompt] = useState(SPEAKING_PROMPTS[0].text);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shadowIdx, setShadowIdx] = useState(-1);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Prioritize Indian English accent recognition

      rec.onresult = (event) => {
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + ' ';
          }
        }
        if (finalText) {
          setTranscript((prev) => (prev + ' ' + finalText).trim());
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setErrorMsg('Microphone error. Check browser settings.');
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    } else {
      setErrorMsg('Speech recognition is not supported in this browser.');
    }
  }, []);

  const handleRecordToggle = () => {
    setErrorMsg('');
    if (!recognitionRef.current) {
      setErrorMsg('Recording not available. Please type your response.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setFeedback(null);
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Start error:', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setErrorMsg('Please speak or type a response first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFeedback(null);

    try {
      const res = await fetch('/api/ai/grade-speaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: selectedPrompt, transcript })
      });

      if (!res.ok) throw new Error('AI evaluation failed. Please try again.');
      const data = await res.json();
      setFeedback(data);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakText = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes('EN-IN') || v.name.includes('India'));
    if (indVoice) utterance.voice = indVoice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Speaking Inputs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary-600" /> Daily Interview Prompts
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {SPEAKING_PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPrompt(p.text);
                  setTranscript('');
                  setFeedback(null);
                  setErrorMsg('');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${selectedPrompt === p.text
                    ? 'bg-primary-600 border-transparent text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
              >
                {p.id.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250/30 rounded-2xl p-4 mb-6">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Prompt Question</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-150">{selectedPrompt}</p>
          </div>

          {/* Transcript input */}
          <div className="relative mb-6">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Tap 'Start Recording' and speak into your mic, or type your answer directly here..."
              className="w-full h-40 px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none font-medium"
            />
            {isRecording && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Listening...</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleRecordToggle}
                className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${isRecording
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-600'
                    : 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 text-primary-600 hover:bg-primary-100'
                  }`}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>

              <button
                onClick={() => setTranscript('')}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl transition"
                title="Clear transcript"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !transcript.trim()}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-extrabold disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing speech...
                </>
              ) : (
                <>
                  Evaluate Answer
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-250/20 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Speaking AI Evaluation Panel */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px]">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" /> AI Coach Assessment
          </h2>

          {!feedback && !loading && (
            <div className="h-72 flex flex-col justify-center items-center text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-xs text-slate-400 font-bold max-w-[200px]">
                Speak or write your reply, then tap Evaluate to get immediate correction cards!
              </p>
            </div>
          )}

          {loading && (
            <div className="h-72 flex flex-col justify-center items-center text-center space-y-3">
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-450 font-bold animate-pulse">Running grammar and vocabulary scans...</p>
            </div>
          )}

          {feedback && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Corrections Section */}
              {feedback.corrections?.length > 0 ? (
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wider">Grammar Fixes</h3>
                  <div className="space-y-3">
                    {feedback.corrections.map((c, i) => (
                      <div key={i} className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 rounded-xl p-3 text-xs">
                        <div className="flex items-center gap-1.5 text-red-500 font-bold line-through mb-1">
                          <X className="w-3.5 h-3.5" /> "{c.original}"
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-extrabold mb-2">
                          <Check className="w-3.5 h-3.5" /> "{c.corrected}"
                        </div>
                        <p className="text-slate-500 font-medium text-[11px] bg-white dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-900">
                          {c.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/55 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Excellent work! No grammar issues found.</span>
                </div>
              )}

              {/* Vocab Suggestions Section */}
              {feedback.vocabSuggestions?.length > 0 && (
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wider">Word Upgrades</h3>
                  <div className="space-y-3">
                    {feedback.vocabSuggestions.map((v, i) => (
                      <div key={i} className="bg-primary-50/30 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-950/20 rounded-xl p-3 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-500 font-bold">Instead of: "{v.original}"</span>
                          <span className="text-primary-600 dark:text-primary-400 font-extrabold flex items-center gap-0.5">
                            Try: {v.suggested} <Star className="w-3 h-3 fill-current" />
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1 font-medium">{v.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Feedback */}
              {feedback.pronunciationFeedback && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-850 text-xs">
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-350 mb-1 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary-500" /> Speaking Advice
                  </h4>
                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{feedback.pronunciationFeedback}</p>
                </div>
              )}

              {/* Model Answer Section */}
              {feedback.modelAnswer && (
                <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Model Answer</h3>
                    <button
                      onClick={() => handleSpeakText(feedback.modelAnswer)}
                      className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 italic bg-amber-50/20 border border-amber-100 dark:border-slate-800 p-3.5 rounded-xl leading-relaxed">
                    "{feedback.modelAnswer}"
                  </p>

                  {/* Shadowing Mode Breakdown */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Practice Shadowing (Repeat sentence)</span>
                    {feedback.modelAnswer.split(/[.!?]+/).filter(s => s.trim()).map((sentence, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShadowIdx(idx);
                          handleSpeakText(sentence);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-[11px] font-medium transition flex items-center justify-between border ${shadowIdx === idx
                            ? 'bg-primary-50 border-primary-200 dark:bg-primary-950/20 text-primary-600'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:bg-slate-50'
                          }`}
                      >
                        <span>{sentence.trim()}.</span>
                        <Volume2 className="w-3 h-3 flex-shrink-0 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. LISTENING TAB
   ========================================================================== */
function ListeningTab({ token, dayNumber }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [speechRate, setSpeechRate] = useState(0.9); // Slightly slower English for Indian learners
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const sentencesRef = useRef([]);

  useEffect(() => {
    fetchListeningPassage();
  }, [dayNumber]);

  const fetchListeningPassage = async () => {
    setLoading(true);
    setErrorMsg('');
    setData(null);
    setIsPlaying(false);
    setCurrentSentenceIdx(-1);
    setSelectedAnswers({});
    setShowResults(false);
    window.speechSynthesis.cancel();

    try {
      const res = await fetch(`/api/english/listening/${dayNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Listening session not found.');
      const details = await res.json();
      if (!details) {
        // Fallback default passage for presentation
        setData({
          title: `Listening Practice - Session ${dayNumber}`,
          transcript: `Continuous Integration is a software development method. Developers push code updates to a central repository. After each push, an automated script compiles and tests the program. This process helps teams catch syntax errors quickly. It ensures that the software builds successfully on every code release.`,
          mcqs_json: [
            { question: "What does Continuous Integration prevent?", options: ["Late code compilation", "Database crashes", "Early stage syntax errors", "API server downtime"], correct: "Early stage syntax errors", explanation: "Continuous integration compiles code after each push to detect syntax errors quickly." },
            { question: "Where do developers push code updates?", options: ["Directly to local storage", "To a central code repository", "To the system administration server", "Inside separate text files"], correct: "To a central code repository", explanation: "The passage notes developers push code changes to a central repository." }
          ]
        });
      } else {
        setData(details);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      // Split the transcript into sentences
      sentencesRef.current = data.transcript.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    }
  }, [data]);

  // Sentence-by-sentence reading loop
  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    if (currentSentenceIdx === -1) {
      setCurrentSentenceIdx(0);
      return;
    }

    const sentences = sentencesRef.current;
    if (currentSentenceIdx >= sentences.length) {
      setIsPlaying(false);
      setCurrentSentenceIdx(-1);
      return;
    }

    const textToSpeak = sentences[currentSentenceIdx];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes('EN-IN') || v.name.includes('India'));
    if (indVoice) utterance.voice = indVoice;
    utterance.rate = speechRate;

    utterance.onend = () => {
      setCurrentSentenceIdx(prev => prev + 1);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentSentenceIdx, speechRate]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRepeatSentence = () => {
    if (currentSentenceIdx === -1) return;
    // Cause useEffect trigger to speak the sentence again
    const idx = currentSentenceIdx;
    setIsPlaying(false);
    setTimeout(() => {
      setCurrentSentenceIdx(idx);
      setIsPlaying(true);
    }, 100);
  };

  const handleSelectOption = (qIdx, opt) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-slate-500 animate-pulse">Loading audio lesson content...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{errorMsg || 'Failed to load lesson'}</p>
        <button onClick={fetchListeningPassage} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">Try Again</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Playback Controls & Transcript */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3 mb-5 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{data.title}</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aptitude & Technical listening</span>
            </div>
            <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">10-Min Session</span>
          </div>

          {/* Audio deck controller */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className={`p-4 rounded-full text-white transition flex items-center justify-center ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleRepeatSentence}
                  disabled={currentSentenceIdx === -1}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 rounded-xl transition disabled:opacity-50 flex items-center gap-1 text-xs font-bold shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Repeat Sentence
                </button>
              </div>

              {/* Rate control slider */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Speech Speed:</span>
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 w-8">{speechRate}x</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-24 accent-primary-650 cursor-pointer h-1.5 rounded-lg bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Transcript Render with Highlights */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 min-h-[160px] leading-relaxed">
            <h3 className="text-xs font-extrabold text-slate-450 uppercase mb-3 tracking-wider">Interactive Reading Script</h3>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {sentencesRef.current.map((sentence, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    setCurrentSentenceIdx(idx);
                    setIsPlaying(true);
                  }}
                  className={`cursor-pointer px-1 py-0.5 rounded transition ${currentSentenceIdx === idx
                      ? 'bg-amber-100 text-slate-900 font-extrabold shadow-sm dark:bg-amber-900/30 dark:text-white border-b-2 border-amber-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                >
                  {sentence.trim()}.{' '}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehension Quiz section */}
      <div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-500" /> Comprehension Check
          </h2>

          <div className="space-y-6">
            {data.mcqs_json.map((q, qIdx) => (
              <div key={qIdx} className="space-y-2 border-b border-slate-100 dark:border-slate-850 pb-4 last:border-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{qIdx + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[qIdx] === opt;
                    const isCorrect = opt === q.correct;
                    let optStyle = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400';

                    if (showResults) {
                      if (isCorrect) {
                        optStyle = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-350 text-emerald-700 dark:text-emerald-450';
                      } else if (isSelected) {
                        optStyle = 'bg-red-50 dark:bg-red-950/20 border-red-355 text-red-600';
                      }
                    } else if (isSelected) {
                      optStyle = 'bg-primary-50 border-primary-400 text-primary-700 dark:bg-primary-950/20';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(qIdx, opt)}
                        className={`w-full text-left px-3 py-2 border.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {showResults && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        {showResults && isSelected && !isCorrect && <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-900 text-[10px] text-slate-450 font-medium">
                    <span className="font-extrabold text-slate-600 dark:text-slate-300">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!showResults && (
            <button
              onClick={handleCheckAnswers}
              disabled={Object.keys(selectedAnswers).length < data.mcqs_json.length}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-extrabold disabled:opacity-50 transition"
            >
              Verify Answers
            </button>
          )}

          {showResults && (
            <button
              onClick={fetchListeningPassage}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Restart Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. READING STORIES & COMICS TAB
   ========================================================================== */
function ReadingTab({ token, dayNumber }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Vocabulary Hover / Detail popover state
  const [hoveredVocab, setHoveredVocab] = useState(null);
  const [vocabCoords, setVocabCoords] = useState({ x: 0, y: 0 });
  const [savingCard, setSavingCard] = useState({});

  useEffect(() => {
    fetchReadingContent();
  }, [dayNumber]);

  const fetchReadingContent = async () => {
    setLoading(true);
    setErrorMsg('');
    setData(null);
    try {
      const res = await fetch(`/api/english/story/${dayNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Reading content not found.');
      const result = await res.json();
      if (!result.story) {
        // Fallback static data
        setData({
          story: {
            title: `IT Placement Journey - Day ${dayNumber}`,
            level: 'Beginner (A2)',
            body: `Anish is an engineering student. He dreams of joining a top company like TCS. Every morning, he studies variables and functions. When he makes syntax errors, he does not panic. He debugs the source code slowly. Anish is developing the confidence to face his first programming interview.`,
            vocab_terms_json: [
              { term: 'variable', meaning: 'A storage location paired with an associated name containing some value.', tamil: 'மாறி (மதிப்பைச் சேமிக்கும் கொள்கலன்)', hindi: 'चर (मूल्य रखने वाला पात्र)' },
              { term: 'syntax error', meaning: 'An error in the sequence of characters or rules of the programming language.', tamil: 'வாக்கிய பிழை (மொழி விதிமுறை தவறு)', hindi: 'वाक्य रचना की त्रुटि' },
              { term: 'confidence', meaning: 'A feeling of self-assurance arising from appreciation of one\'s abilities.', tamil: 'தன்னம்பிக்கை', hindi: 'आत्मविश्वास' }
            ]
          },
          comic: {
            title: 'Learning Loops!',
            panels_json: [
              { character: 'Anish', avatar: '👨‍💻', text: 'I am writing the code to run ten times. How do I do it without copy pasting?', translation: 'நான் இந்த குறியீட்டை பத்து முறை இயக்க விரும்புகிறேன். நகலெடுக்காமல் எப்படி செய்வது?' },
              { character: 'Tutor', avatar: '🤖', text: 'Simple, Anish! Use a loop variable. It increments automatically on each pass.', translation: 'எளிது அனிஷ்! ஒரு லூப் மாறியைப் பயன்படுத்தவும். அது ஒவ்வொரு சுற்றிலும் தானாக அதிகரிக்கும்.' }
            ]
          }
        });
      } else {
        setData(result);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVocabCard = async (termObj) => {
    setSavingCard(prev => ({ ...prev, [termObj.term]: 'saving' }));
    try {
      const res = await fetch('/api/vocab/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          term: termObj.term,
          meaning: termObj.meaning,
          example: `Found inside reading passage: "${data.story.title}"`,
          tamil_gloss: termObj.tamil,
          hindi_gloss: termObj.hindi,
          source: 'story'
        })
      });

      if (!res.ok) throw new Error('Failed');
      setSavingCard(prev => ({ ...prev, [termObj.term]: 'saved' }));
      confetti({ particleCount: 15, spread: 30 });
    } catch (err) {
      setSavingCard(prev => ({ ...prev, [termObj.term]: 'error' }));
    }
  };

  // Render story body with highlighted vocab words
  const renderStoryText = () => {
    if (!data?.story) return null;
    const bodyText = data.story.body;
    const terms = data.story.vocab_terms_json || [];

    if (terms.length === 0) return <p className="font-medium">{bodyText}</p>;

    // Regex to match any of the terms (case insensitive)
    const regexParts = terms.map(t => t.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`\\b(${regexParts.join('|')})\\b`, 'gi');

    const parts = bodyText.split(regex);

    return (
      <p className="font-medium leading-relaxed text-sm text-slate-700 dark:text-slate-350 select-text">
        {parts.map((part, idx) => {
          const matchedTerm = terms.find(t => t.term.toLowerCase() === part.toLowerCase());
          if (matchedTerm) {
            return (
              <span key={idx} className="relative inline-block group">
                <button
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setVocabCoords({ x: rect.left, y: rect.top - 8 });
                    setHoveredVocab(matchedTerm);
                  }}
                  onMouseLeave={() => setHoveredVocab(null)}
                  onClick={() => {
                    setHoveredVocab(matchedTerm);
                  }}
                  className="bg-primary-50 hover:bg-primary-100 text-primary-750 dark:bg-primary-950/30 dark:text-primary-400 border-b border-primary-500 font-extrabold px-1 rounded transition text-xs"
                >
                  {part}
                </button>
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-slate-500 animate-pulse">Loading daily stories & comics...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{errorMsg || 'Failed to load stories'}</p>
        <button onClick={fetchReadingContent} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">Try Again</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">

      {/* Popover overlay for hovered vocabulary */}
      <AnimatePresence>
        {hoveredVocab && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              left: Math.max(16, Math.min(window.innerWidth - 300, vocabCoords.x - 120)),
              top: vocabCoords.y - 180,
              zIndex: 9999
            }}
            className="w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl text-xs"
            onMouseEnter={() => setHoveredVocab(hoveredVocab)}
            onMouseLeave={() => setHoveredVocab(null)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-extrabold text-slate-900 dark:text-white capitalize text-sm">{hoveredVocab.term}</span>
              <span className="text-[10px] text-primary-500 font-extrabold uppercase">Vocab Card</span>
            </div>

            <p className="text-slate-500 font-medium leading-relaxed mb-3">{hoveredVocab.meaning}</p>

            {/* Bilingual Hints */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1 mb-3">
              <div className="text-[10px] font-bold text-slate-400">BILINGUAL MEANINGS:</div>
              {hoveredVocab.tamil && <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">🇮🇳 <span className="text-[10px] font-medium text-slate-450">Tamil:</span> {hoveredVocab.tamil}</div>}
              {hoveredVocab.hindi && <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">🇮🇳 <span className="text-[10px] font-medium text-slate-450">Hindi:</span> {hoveredVocab.hindi}</div>}
            </div>

            {/* SRS Add Button */}
            <button
              onClick={() => handleAddVocabCard(hoveredVocab)}
              disabled={savingCard[hoveredVocab.term] === 'saving' || savingCard[hoveredVocab.term] === 'saved'}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-extrabold transition flex items-center justify-center gap-1 disabled:opacity-75"
            >
              {savingCard[hoveredVocab.term] === 'saving' && 'Adding to review deck...'}
              {savingCard[hoveredVocab.term] === 'saved' && <span className="flex items-center gap-1 text-emerald-350"><Check className="w-3.5 h-3.5" /> Added to SRS Deck!</span>}
              {!savingCard[hoveredVocab.term] && (
                <>
                  <Plus className="w-3.5 h-3.5" /> Save to Review Deck
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Column */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{data.story.title}</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Level: {data.story.level}</span>
          </div>
          <span className="text-[10px] text-primary-655 font-bold uppercase">Tap terms for Tamil/Hindi translation</span>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl min-h-[220px]">
          {renderStoryText()}
        </div>

        <div className="bg-amber-50/15 border border-amber-100 dark:border-slate-850 rounded-2xl p-4 flex gap-3 text-xs">
          <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-400">Why read this daily?</span>
            <p className="text-slate-500 font-medium leading-relaxed">
              Reading short stories builds language intuition. Hover over highlighted vocabulary to see instant translations.
            </p>
          </div>
        </div>
      </div>

      {/* Comic Panels Column */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Daily Comic strip</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{data.comic?.title || 'Learning logic visually'}</span>
        </div>

        <div className="space-y-6">
          {data.comic?.panels_json?.length > 0 ? (
            data.comic.panels_json.map((panel, idx) => (
              <div
                key={idx}
                className={`flex gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 relative ${idx % 2 === 1 ? 'flex-row-reverse bg-primary-50/10' : ''
                  }`}
              >
                {/* Character Avatar */}
                <div className="flex flex-col items-center justify-center flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl h-16 w-16 shadow-sm self-start">
                  <span className="text-2xl mb-1">{panel.avatar || '👨‍💻'}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{panel.character}</span>
                </div>

                {/* Speech Bubble */}
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-3 rounded-2xl shadow-sm relative">
                    {panel.text}
                  </p>

                  {/* Local Language translation */}
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal pl-2 border-l-2 border-primary-400 italic">
                    {panel.translation}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col justify-center items-center border border-dashed border-slate-250 rounded-2xl text-center">
              <Sparkles className="w-10 h-10 text-slate-300 animate-pulse mb-3" />
              <p className="text-xs text-slate-400 font-bold max-w-[200px]">No comic panel pre-drawn for today. Practice reading on the left card!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ==========================================================================
   4. VOCAB SRS DECK TAB
   ========================================================================== */
function VocabTab({ token }) {
  const [dueCards, setDueCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Flashcard states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Custom manual vocabulary add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [tamilGloss, setTamilGloss] = useState('');
  const [hindiGloss, setHindiGloss] = useState('');
  const [addFeedback, setAddFeedback] = useState('');

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    setLoading(true);
    setErrorMsg('');
    setDueCards([]);
    setCurrentIdx(0);
    setIsFlipped(false);
    try {
      const res = await fetch('/api/vocab/due', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load review deck.');
      const list = await res.json();
      setDueCards(list);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (correct) => {
    if (dueCards.length === 0) return;
    const activeCard = dueCards[currentIdx];

    try {
      const res = await fetch('/api/vocab/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardId: activeCard.id, correct })
      });

      if (!res.ok) throw new Error('Submission error');

      confetti({ particleCount: 10, spread: 20 });

      // Move to next card
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
      }, 200);

    } catch (err) {
      setErrorMsg('Failed to sync review feedback. Check network.');
    }
  };

  const handleAddManualCard = async (e) => {
    e.preventDefault();
    if (!newTerm.trim() || !newMeaning.trim() || !newExample.trim()) {
      setAddFeedback('Please fill out word, meaning, and example.');
      return;
    }

    try {
      const res = await fetch('/api/vocab/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          term: newTerm,
          meaning: newMeaning,
          example: newExample,
          tamil_gloss: tamilGloss,
          hindi_gloss: hindiGloss,
          source: 'manual'
        })
      });

      if (!res.ok) throw new Error('API failure adding card');

      setAddFeedback('🟢 Word added to deck successfully!');
      setNewTerm('');
      setNewMeaning('');
      setNewExample('');
      setTamilGloss('');
      setHindiGloss('');

      // Reload card list
      fetchDueCards();
      setTimeout(() => {
        setAddFeedback('');
        setShowAddForm(false);
      }, 2000);
    } catch (err) {
      setAddFeedback('❌ Failed to add card. Word might already exist.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Leitner SRS Box Flashcard Deck */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3 mb-5 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" /> Leitner Review Board
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Spaced Repetition System</span>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Word Card
            </button>
          </div>

          {loading && (
            <div className="h-80 flex flex-col justify-center items-center text-center">
              <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-slate-500">Checking due cards...</p>
            </div>
          )}

          {!loading && (dueCards.length === 0 || currentIdx >= dueCards.length) && (
            <div className="h-80 flex flex-col justify-center items-center text-center space-y-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-250 p-6">
              <Check className="w-12 h-12 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-full" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Review deck complete!</h3>
                <p className="text-xs text-slate-450 font-bold max-w-sm leading-relaxed">
                  No vocab cards are currently due for review. Tap 'Add Word Card' or read stories to build your stack!
                </p>
              </div>
              <button
                onClick={fetchDueCards}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold"
              >
                Sync Deck
              </button>
            </div>
          )}

          {!loading && dueCards.length > 0 && currentIdx < dueCards.length && (
            <div className="space-y-6">
              <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                <span>Card {currentIdx + 1} of {dueCards.length}</span>
                <span className="text-primary-600 dark:text-primary-450 uppercase">Box {dueCards[currentIdx].leitner_box}</span>
              </div>

              {/* Flashcard Frame */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[220px] bg-slate-50 dark:bg-slate-950 border border-slate-250/30 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer relative hover:shadow-md transition duration-200 overflow-hidden"
              >
                {!isFlipped ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide capitalize">
                      {dueCards[currentIdx].term}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-200/50 dark:bg-slate-900 px-2.5 py-1 rounded-full">
                      Tap card to reveal definition
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left w-full">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Meaning:</span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dueCards[currentIdx].meaning}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Example context:</span>
                      <p className="text-xs font-medium text-slate-500 italic">"{dueCards[currentIdx].example}"</p>
                    </div>

                    {(dueCards[currentIdx].tamil_gloss || dueCards[currentIdx].hindi_gloss) && (
                      <div className="border-t border-slate-200/50 dark:border-slate-850 pt-3 grid grid-cols-2 gap-4">
                        {dueCards[currentIdx].tamil_gloss && (
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Tamil translation:</span>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{dueCards[currentIdx].tamil_gloss}</p>
                          </div>
                        )}
                        {dueCards[currentIdx].hindi_gloss && (
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Hindi translation:</span>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{dueCards[currentIdx].hindi_gloss}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Review Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleReview(false)}
                  className="py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 border border-red-200 dark:border-red-950/30 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Forgot (Demote Card)
                </button>

                <button
                  onClick={() => handleReview(true)}
                  className="py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-650 border border-emerald-200 dark:border-emerald-950/30 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Got it (Promote Card)
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-250/20 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Manual Word Add Drawer & Box Stats */}
      <div className="space-y-6">
        {/* SRS Box Levels Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-809 dark:text-white mb-4">Box Level intervals</h3>
          <div className="space-y-3.5">
            {[
              { box: 1, label: 'Box 1: Review Daily', interval: '1 day' },
              { box: 2, label: 'Box 2: Review Multi-Day', interval: '2 days' },
              { box: 3, label: 'Box 3: Weekly checks', interval: '4 days' },
              { box: 4, label: 'Box 4: Semi-Monthly', interval: '8 days' },
              { box: 5, label: 'Box 5: Full Mastered', interval: '16 days' }
            ].map((box) => (
              <div key={box.box} className="flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{box.label}</span>
                  <p className="text-[10px] text-slate-400 font-medium">Next prompt: every {box.interval}</p>
                </div>
                <span className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 px-2 py-0.5 rounded-md font-bold text-[10px] text-slate-400">Level {box.box}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Card Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddManualCard}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-200"
          >
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Create Vocabulary Card</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">English word *</label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="e.g. Iteration"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Clear definition *</label>
                <textarea
                  required
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="Keep sentences short. Max 12 words."
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 h-16 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Example sentence *</label>
                <input
                  type="text"
                  required
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Show a concrete example first."
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Tamil translation</label>
                  <input
                    type="text"
                    value={tamilGloss}
                    onChange={(e) => setTamilGloss(e.target.value)}
                    placeholder="உதாரணம்: சுழற்சி"
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Hindi translation</label>
                  <input
                    type="text"
                    value={hindiGloss}
                    onChange={(e) => setHindiGloss(e.target.value)}
                    placeholder="जैसे: दोहराव"
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition"
            >
              Add Card to Deck
            </button>

            {addFeedback && (
              <p className="text-[10px] font-bold text-center mt-2">{addFeedback}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
