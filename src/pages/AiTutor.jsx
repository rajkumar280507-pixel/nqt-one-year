import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquareCode, Mic, MicOff, AlertCircle, Sparkles, Send, 
  Volume2, VolumeX, RotateCcw, Plus, Check, Play, Square, User, Bot, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function AiTutor({ token, user }) {
  const [talkMode, setTalkMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Coach. I will help you practice English communication and coding logic for the TCS NQT. Let's chat! Speak or type a message below.",
      suggestedVocab: ['Communication', 'Interview', 'Logic']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [speakResponses, setSpeakResponses] = useState(true);
  const [savingCard, setSavingCard] = useState({});

  // Talk Mode specific states
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Focus on Indian English phonetic patterns

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      rec.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimSpeech(interim);
        }

        if (final) {
          setInputText((prev) => (prev + ' ' + final).trim());
          setInterimSpeech('');
          
          // If in Talk Mode, reset the 1.5s silence timer
          if (talkMode) {
            resetSilenceTimer();
          }
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        if (e.error !== 'no-speech') {
          setErrorMsg(`Voice capture alert: ${e.error}`);
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setErrorMsg('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [talkMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimSpeech, loading]);

  // Stop synthesis when leaving page or toggling talk mode
  useEffect(() => {
    window.speechSynthesis.cancel();
    setInputText('');
    setInterimSpeech('');
  }, [talkMode]);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      // Auto submit after 1.5 seconds of silence
      handleAutoSubmitFromSpeech();
    }, 1500);
  };

  const handleAutoSubmitFromSpeech = () => {
    setInputText((latestInput) => {
      if (latestInput.trim()) {
        // Trigger submit
        submitMessage(latestInput.trim());
      }
      return '';
    });
  };

  const startVoiceCapture = () => {
    if (!recognitionRef.current) return;
    window.speechSynthesis.cancel();
    setAiIsSpeaking(false);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Voice start err:', err);
    }
  };

  const stopVoiceCapture = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Voice stop err:', err);
    }
  };

  const toggleVoiceListen = () => {
    if (isListening) {
      stopVoiceCapture();
    } else {
      startVoiceCapture();
    }
  };

  const submitMessage = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;
    
    // Stop recording while API executes
    if (isListening) stopVoiceCapture();

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setErrorMsg('');

    try {
      const history = messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: history })
      });

      if (res.status === 429) {
        throw new Error('Daily AI request limit (50 messages) reached for today.');
      }
      if (!res.ok) throw new Error('AI Coach is temporarily offline.');

      const data = await res.json();
      setMessageCount(prev => prev + 1);

      const aiMessage = {
        role: 'assistant',
        content: data.reply,
        suggestedVocab: data.suggestedVocab || []
      };

      setMessages(prev => [...prev, aiMessage]);

      // TTS Playback of response
      if (speakResponses || talkMode) {
        speakResponseText(data.reply);
      }
    } catch (err) {
      setErrorMsg(err.message);
      // If voice-to-voice talk mode was active, resume listening on errors
      if (talkMode) {
        setTimeout(startVoiceCapture, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const speakResponseText = (text) => {
    window.speechSynthesis.cancel();
    setAiIsSpeaking(true);
    
    // Filter out the vocabulary footnote if it got appended
    const cleanText = text.replace(/\[Words to learn:[^\]]+\]/gi, '').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes('EN-IN') || v.name.includes('India'));
    if (indVoice) utterance.voice = indVoice;
    
    utterance.rate = 0.95; // Slightly slower, highly clear Indian English
    
    utterance.onend = () => {
      setAiIsSpeaking(false);
      // In Talk Mode, resume listening immediately after AI finishes speaking
      if (talkMode) {
        startVoiceCapture();
      }
    };

    utterance.onerror = () => {
      setAiIsSpeaking(false);
      if (talkMode) startVoiceCapture();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSaveSuggestedVocab = async (word) => {
    setSavingCard(prev => ({ ...prev, [word]: 'saving' }));
    try {
      const res = await fetch('/api/vocab/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          term: word,
          meaning: `Learned during chat with AI interview partner.`,
          example: `Usage suggestion: Practice introducing yourself using '${word}'.`,
          source: 'chat'
        })
      });

      if (!res.ok) throw new Error('API failure');
      setSavingCard(prev => ({ ...prev, [word]: 'saved' }));
      confetti({ particleCount: 10, spread: 30 });
    } catch (err) {
      setSavingCard(prev => ({ ...prev, [word]: 'error' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      
      {/* Upper control layout */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-600 animate-pulse" /> AI Interview Coach
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Build fluent communication. Ask questions on DSA, Aptitude, or grammar.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 self-start sm:self-center">
          <button
            onClick={() => setTalkMode(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              !talkMode ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm font-extrabold' : 'text-slate-500'
            }`}
          >
            Chat Mode
          </button>
          <button
            onClick={() => setTalkMode(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              talkMode ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm font-extrabold' : 'text-slate-500'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Hands-free Talk
          </button>
        </div>
      </div>

      {/* Main chat window container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 min-h-[500px] flex flex-col justify-between shadow-sm relative overflow-hidden">
        
        {/* Chat Header Status */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Online Partner</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-405">Quota: {messageCount}/50 messages today</span>
            
            {!talkMode && (
              <button
                onClick={() => setSpeakResponses(!speakResponses)}
                className={`p-1.5 rounded-lg border transition ${
                  speakResponses ? 'border-primary-200 text-primary-650 bg-primary-50/50 dark:bg-primary-950/20' : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
                title="Speak AI answers out loud"
              >
                {speakResponses ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Talk Mode View vs Chat Mode View */}
        {talkMode ? (
          /* ==================== TALK MODE VIEW ==================== */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
            
            {/* Audio Wave Visualizer representation */}
            <div className="h-48 w-48 relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-primary-500/20"
                  />
                )}
                {aiIsSpeaking && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-amber-500/20"
                  />
                )}
              </AnimatePresence>

              {/* Core Wave Circle */}
              <div 
                className={`h-36 w-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg ${
                  isListening 
                    ? 'bg-primary-600 text-white shadow-primary-500/30' 
                    : aiIsSpeaking
                      ? 'bg-amber-500 text-white shadow-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-12 h-12 animate-pulse" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider mt-2">Listening...</span>
                  </>
                ) : aiIsSpeaking ? (
                  <>
                    <Volume2 className="w-12 h-12 animate-bounce" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider mt-2">Speaking...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-12 h-12" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider mt-2">Muted</span>
                  </>
                )}
              </div>
            </div>

            {/* Subtitles & Status */}
            <div className="max-w-md space-y-3 min-h-[80px]">
              {isListening && (
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 animate-pulse">
                  {interimSpeech || inputText || 'Speak now... AI automatically replies on 1.5s pauses.'}
                </p>
              )}
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-405">Tutor is preparing answer...</p>
                </div>
              )}
              {aiIsSpeaking && (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{messages[messages.length - 1]?.content}"
                </p>
              )}
              {!isListening && !aiIsSpeaking && !loading && (
                <p className="text-xs text-slate-400 font-bold">
                  Tap 'Start Practice' below. Talk freely in English!
                </p>
              )}
            </div>

            {/* Talk mode action */}
            <button
              onClick={toggleVoiceListen}
              disabled={loading || aiIsSpeaking}
              className={`px-8 py-3.5 rounded-2xl text-xs font-extrabold shadow-sm transition ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/25'
              }`}
            >
              {isListening ? 'Pause Voice Practice' : 'Start Voice Practice'}
            </button>
          </div>
        ) : (
          /* ==================== CHAT MODE VIEW ==================== */
          <div className="flex-1 flex flex-col justify-between overflow-y-auto max-h-[450px] pr-2">
            
            {/* Messages box */}
            <div className="flex-1 space-y-4 mb-4 select-text">
              {messages.map((m, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Chat Avatar */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    m.role === 'user' ? 'bg-primary-600' : 'bg-slate-700'
                  }`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble text */}
                  <div className="space-y-1">
                    <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed relative ${
                      m.role === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>

                    {/* Suggested vocabulary words box */}
                    {m.role === 'assistant' && m.suggestedVocab?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 pl-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Tutor word bank:</span>
                        {m.suggestedVocab.map((word) => {
                          const status = savingCard[word];
                          return (
                            <button
                              key={word}
                              onClick={() => handleSaveSuggestedVocab(word)}
                              disabled={status === 'saving' || status === 'saved'}
                              className={`px-2 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold transition flex items-center gap-1 ${
                                status === 'saved' 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-600' 
                                  : 'bg-white dark:bg-slate-900 text-slate-650 hover:bg-slate-55'
                              }`}
                            >
                              <span>{word}</span>
                              {status === 'saved' ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5 opacity-60" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3.5 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat bottom input box */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitMessage(inputText)}
                placeholder={isListening ? "Listening... Speak now or type here" : "Ask about Java sorting, percentages, or grammar..."}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs focus:ring-1 focus:ring-primary-500 outline-none font-medium"
              />

              <button
                onClick={toggleVoiceListen}
                className={`p-3 rounded-2xl border transition ${
                  isListening 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-500' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
                title={isListening ? 'Mute Mic' : 'Dictate Message'}
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={() => submitMessage(inputText)}
                disabled={!inputText.trim()}
                className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl disabled:opacity-50 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="absolute top-16 left-6 right-6 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-250/20 rounded-xl text-xs font-bold shadow-md z-10 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="ml-auto text-amber-650 font-bold hover:underline">Dismiss</button>
          </div>
        )}
      </div>

      {/* Tip panel for beginner learners */}
      <div className="mt-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
        <HelpCircle className="w-5 h-5 text-primary-550 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">How to practice with the Coach:</span>
          <p className="text-slate-505 dark:text-slate-400 font-medium">
            1. Use **Chat Mode** to ask technical questions step-by-step.
            2. Toggle **Talk Mode** for interview conversation simulation.
            3. Tap words in the assistant's replies to save them to your vocabulary cards deck.
          </p>
        </div>
      </div>

    </div>
  );
}
