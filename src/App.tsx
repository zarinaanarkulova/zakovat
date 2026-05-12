/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { LayoutDashboard, Gamepad2, RefreshCcw } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import GameView from './components/GameView';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_EMAIL = 'zarinaanarkulova408@gmail.com';

export default function App() {
  const [view, setView] = useState<'game' | 'admin'>('game');

  return (
    <div className="min-h-screen bg-bento-bg text-[#f8fafc] font-sans selection:bg-bento-accent selection:text-bento-bg">
      {/* Header */}
      <header className="border-b border-bento-border bg-bento-card/80 backdrop-blur-md sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-[10px] text-slate-400 tracking-[0.25em] font-medium mb-1 uppercase">
            O'ZBEKISTON RESPUBLIKASI MAKTABGACHA VA MAKTAB TA'LIMI VAZIRLIGI
          </div>
          <h1 className="text-sm md:text-md font-bold text-slate-100 flex flex-col items-center gap-1">
            GULISTON DAVLAT PEDAGOGIKA INSTITUTI
            <span className="text-xs font-medium text-bento-accent tracking-wide uppercase">
              PEDAGOGIKA VA PSIXOLOGIYA KAFEDRASI
              <span className="block mt-1">ZAKOVAT INTELLEKTUAL O'YINI</span>
            </span>
          </h1>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/5">
        <div className="flex gap-2">
          <button 
            onClick={() => setView('game')}
            className={`bento-btn ${view === 'game' ? 'bg-bento-accent shadow-lg shadow-amber-500/20 text-bento-bg' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 size={12} />
              O'yin
            </div>
          </button>
          <button 
            onClick={() => setView('admin')}
            className={`bento-btn ${view === 'admin' ? 'bg-bento-accent shadow-lg shadow-amber-500/20 text-bento-bg' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard size={12} />
              Boshqaruv
            </div>
          </button>
        </div>

        <div className="text-[10px] uppercase font-black tracking-widest text-[#94a3b8]">
          Zakovat v2.1
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {view === 'admin' ? <AdminDashboard /> : <GameView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
