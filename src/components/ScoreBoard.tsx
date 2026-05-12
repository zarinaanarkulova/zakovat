import { Trophy, Plus, Minus, Users } from 'lucide-react';
import { TeamScore } from '../types';
import { motion } from 'motion/react';

interface ScoreBoardProps {
  teams: TeamScore[];
  onScoreChange: (index: number, delta: number) => void;
}

export default function ScoreBoard({ teams, onScoreChange }: ScoreBoardProps) {
  return (
    <div className="bento-card gap-4 shadow-2xl">
      <div className="bento-badge bg-[#10b981]">OCHKO HISOBI</div>

      <div className="space-y-2">
        {teams.map((team, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-white/5 transition-all hover:bg-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="w-4 h-4 bg-bento-blue/20 rounded flex items-center justify-center text-[10px] text-bento-blue">{index + 1}</span>
                {team.name}
              </span>
              <span className="text-sm font-black text-bento-accent drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">{team.score.toString().padStart(2, '0')}</span>
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => onScoreChange(index, -1)}
                className="flex-1 bento-btn py-1.5 flex justify-center opacity-40 hover:opacity-100"
              >
                <Minus size={10} />
              </button>
              <button 
                onClick={() => onScoreChange(index, 1)}
                className="flex-1 bento-btn py-1.5 flex justify-center opacity-40 hover:opacity-100 hover:bg-bento-accent hover:text-bento-bg"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between">
        <Trophy className="w-4 h-4 text-bento-accent/20" />
        <span className="text-[8px] text-slate-700 font-bold tracking-widest uppercase">Guliston DP Instituti</span>
      </div>
    </div>
  );
}
