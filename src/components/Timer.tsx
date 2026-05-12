import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

const END_SOUND = "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"; // Distinct alarm

export default function Timer() {
  const DEFAULT_TIME = 90; // 1:30 in seconds
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const endAudio = useRef<HTMLAudioElement | null>(null);
  const startAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    endAudio.current = new Audio(END_SOUND);
    endAudio.current.volume = 0.8;

    // Start chime 
    startAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    startAudio.current.volume = 0.4;
    
    return () => {
    };
  }, []);

  // Background music effect removed

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (!isMuted && endAudio.current) {
              endAudio.current.play();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isMuted]);

  const toggleTimer = () => {
    if (!isActive && timeLeft > 0 && !isMuted) {
      startAudio.current?.play().catch(() => {});
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / DEFAULT_TIME) * 100;

  return (
    <div className="bento-card items-center space-y-4 shadow-2xl relative overflow-hidden group">
      {/* Background Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-bento-blue/40 transition-all duration-1000"
        style={{ width: `${percentage}%` }}
      />

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">
          <TimerIcon size={12} />
          Vaqt
        </div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      <div className={`text-6xl font-black font-mono tabular-nums tracking-tighter transition-colors ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
        {formatTime(timeLeft)}
      </div>

      <div className="w-full text-center">
        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4">Diqqat, Savol!</div>
        <div className="flex gap-2 w-full">
          <button 
            onClick={toggleTimer}
            className={`flex-1 flex items-center justify-center p-3 rounded-lg transition-all ${isActive ? 'bg-[#334155] text-white' : 'bg-bento-blue text-white shadow-lg shadow-blue-500/20'}`}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button 
            onClick={resetTimer}
            className="p-3 rounded-lg bg-[#334155] text-slate-400 hover:text-white transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {timeLeft === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-red-600/90 backdrop-blur-sm flex items-center justify-center"
        >
          <span className="text-xl font-black uppercase tracking-widest text-white drop-shadow-lg">Vaqt tugadi!</span>
        </motion.div>
      )}
    </div>
  );
}
