import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Question, TeamScore } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Timer as TimerIcon, Trophy, X, ChevronRight, Eye, Flag, RefreshCcw } from 'lucide-react';
import Timer from './Timer';
import ScoreBoard from './ScoreBoard';

export default function GameView() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<TeamScore[]>([
    { name: '1-Jamoa', score: 0 },
    { name: '2-Jamoa', score: 0 },
    { name: '3-Jamoa', score: 0 },
    { name: '4-Jamoa', score: 0 },
  ]);

  useEffect(() => {
    const q = collection(db, 'questions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      // Sort in memory to include questions without 'order' field
      qs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setQuestions(qs);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectQuestion = (q: Question) => {
    if (usedQuestions.has(q.id)) return;
    setSelectedQuestion(q);
    setShowAnswer(false);
  };

  const closeQuestion = () => {
    if (selectedQuestion) {
      setUsedQuestions(prev => new Set(prev).add(selectedQuestion.id));
    }
    setSelectedQuestion(null);
    setShowAnswer(false);
  };

  const updateScore = (index: number, delta: number) => {
    const newTeams = [...teams];
    newTeams[index].score = Math.max(0, newTeams[index].score + delta);
    setTeams(newTeams);
  };

  return (
    <div className="grid grid-cols-12 gap-5 min-h-[70vh]">
      {/* Left Column: Timer & Info */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <Timer />
        
        <div className="bento-card bg-[#8b5cf6]/10 border-[#8b5cf6]/20">
          <div className="bento-badge bg-[#8b5cf6]">SAVOLLAR BAZASI</div>
          <div className="space-y-3 mt-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Jami savollar:</span>
              <span className="text-white font-bold">{questions.length} ta</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>O'ynalgan:</span>
              <span className="text-white font-bold">{usedQuestions.size} ta</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#8b5cf6] h-full transition-all duration-1000" 
                style={{ width: `${questions.length ? (usedQuestions.size / questions.length) * 100 : 0}%` }}
              />
            </div>
            <button 
              onClick={() => {
                if (confirm('Barcha savollarni qaytadan o\'ynashni xohlaysizmi?')) {
                  setUsedQuestions(new Set());
                }
              }}
              className="w-full mt-4 py-2 border border-white/5 hover:border-white/10 rounded-lg text-[9px] uppercase font-black tracking-widest text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={10} />
              Savollarni Qaytarish
            </button>
          </div>
        </div>
      </div>

      {/* Center Column: Flags Grid */}
      <div className="col-span-12 lg:col-span-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {questions.map((q) => {
            const isUsed = usedQuestions.has(q.id);
            return (
              <motion.button
                key={q.id}
                whileHover={!isUsed ? { scale: 1.05, borderColor: '#fbbf24' } : {}}
                whileTap={!isUsed ? { scale: 0.95 } : {}}
                onClick={() => handleSelectQuestion(q)}
                disabled={isUsed}
                className={`aspect-square relative flex flex-col items-center justify-center rounded-xl border-2 transition-all overflow-hidden p-2 ${
                  isUsed 
                    ? 'bg-black/40 border-slate-900 opacity-20 cursor-not-allowed' 
                    : 'bg-bento-card border-bento-border hover:bg-slate-800 cursor-pointer shadow-lg'
                }`}
              >
                <span className={`text-sm sm:text-lg font-black tracking-tighter mb-1 transition-all text-center leading-tight ${isUsed ? 'text-slate-800' : 'text-slate-100 group-hover:text-bento-accent'}`}>
                  {q.title}
                </span>
                <div className="w-6 h-1 bg-white/5 rounded-full mt-1" />
              </motion.button>
            );
          })}
        </div>

        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-bento-card border border-dashed border-bento-border rounded-xl">
            <Flag className="w-10 h-10 text-white/5 mb-4" />
            <p className="text-white/20 text-xs">Hozircha savollar yo'q.</p>
          </div>
        )}
      </div>

      {/* Right Column: Scores */}
      <div className="col-span-12 lg:col-span-3">
        <ScoreBoard teams={teams} onScoreChange={updateScore} />
      </div>

      {/* Active Question Bar (Visible when something is selected) */}
      <div className="col-span-12 mt-4">
        {selectedQuestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card border-dashed flex-row items-center gap-6 p-6"
          >
           <div className="w-16 h-16 bg-[#334155] border border-white/10 rounded-lg flex items-center justify-center text-xs font-black text-center text-slate-400 p-1 shadow-inner">
             {selectedQuestion.title}
           </div>
           <div className="flex-1">
             <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Hozirgi savol: <span className="text-bento-accent font-black">{selectedQuestion.title}</span></div>
             <div className="text-xs text-slate-500 max-w-lg">Savol orqasiga javob yashirilgan. Javobni ko'rish uchun "Javobni Ko'rish" tugmasini bosing.</div>
           </div>
           <div className="flex gap-3">
             <button onClick={closeQuestion} className="bento-btn">Yopish</button>
             {!showAnswer && <button onClick={() => setShowAnswer(true)} className="bento-btn-accent">Javobni ochish</button>}
           </div>
          </motion.div>
        )}
      </div>

      {/* Question Detail Modal (Heavily Styled) */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bento-bg/95 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-6xl h-full max-h-[85vh] bg-bento-card border border-bento-accent/30 rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black relative"
            >
              <div className="p-1 items-center justify-center bg-bento-accent flex">
                <span className="text-[10px] font-black tracking-[0.5em] text-bento-bg py-1 uppercase">DIQQAT, SAVOL!</span>
              </div>
              
              <button 
                onClick={closeQuestion}
                className="absolute top-10 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto p-10 md:p-14 flex flex-col gap-8">
                <AnimatePresence mode="wait">
                  {!showAnswer ? (
                    <motion.div
                      key="question"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex-1 flex flex-col gap-8"
                    >
                      <div className="flex items-center gap-5 shrink-0">
                        <div className="text-2xl font-black text-bento-accent tracking-tighter bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                          {selectedQuestion.title}
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">{selectedQuestion.mediaType} SAVOLI</h4>
                      </div>

                      <div className={`flex flex-col ${selectedQuestion.mediaType !== 'text' ? 'lg:grid lg:grid-cols-2' : ''} gap-8 items-start`}>
                        <p className="text-xl md:text-2xl font-bold leading-tight text-slate-100 tracking-tight">
                          {selectedQuestion.text}
                        </p>

                        {selectedQuestion.mediaType !== 'text' && selectedQuestion.mediaUrl && (
                          <div className="w-full rounded-xl overflow-hidden border border-white/5 bg-black/40 aspect-video flex flex-col items-center justify-center shadow-inner relative group">
                            {selectedQuestion.mediaType === 'image' ? (
                              <img 
                                src={selectedQuestion.mediaUrl} 
                                alt="Question media" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <>
                                <video 
                                  key={selectedQuestion.mediaUrl}
                                  src={selectedQuestion.mediaUrl} 
                                  controls 
                                  playsInline
                                  preload="metadata"
                                  className="w-full h-full"
                                >
                                  Sizning brauzeringiz videoni qo'llab-quvvatlamaydi.
                                </video>
                                <a 
                                  href={selectedQuestion.mediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 hover:bg-black/80 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                >
                                  To'liq ochish
                                </a>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
                    >
                      <div className="w-20 h-20 bg-bento-accent/20 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-10 h-10 text-bento-accent" />
                      </div>
                      <div className="space-y-4">
                        <h6 className="text-[12px] uppercase tracking-[0.4em] text-slate-500 font-black">TO'G'RI JAVOB:</h6>
                        <p className="text-2xl md:text-3xl font-black text-bento-accent leading-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                          {selectedQuestion.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-8 border-t border-bento-border bg-black/40 flex gap-4">
                {!showAnswer ? (
                  <button 
                    onClick={() => setShowAnswer(true)}
                    className="flex-1 py-5 bg-bento-accent text-bento-bg font-black uppercase tracking-[0.2em] rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
                  >
                    <Eye size={20} />
                    Javobni Ko'rish
                  </button>
                ) : (
                  <button 
                    onClick={closeQuestion}
                    className="flex-1 py-5 bg-white/5 text-white/60 font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <ChevronRight size={20} />
                    Davom Ettirish
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
