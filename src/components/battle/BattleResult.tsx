"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Trophy, Skull, Swords, Target, Activity, Zap, Timer, Flame } from "lucide-react";
import { calculateRank, PLACEMENT_MATCHES_REQUIRED } from "@/engine/ranking";
import { RankBadge } from "@/components/ui/RankBadge";

interface BattleResultProps {
  result: 'WIN' | 'LOSS' | 'DRAW';
  eloChange: number;
  turns: number;
  playerDamageDealt: number;
  playerDamageTaken: number;
  mvpName?: string;
  criticals?: number;
  eloRating: number;
  totalBattles: number;
  onBack: () => void;
}

export function BattleResult({
  result, eloChange, turns, playerDamageDealt, playerDamageTaken, mvpName, criticals = 0, eloRating, totalBattles, onBack
}: BattleResultProps) {
  const isWin = result === 'WIN';
  const isDraw = result === 'DRAW';
  
  // ELO and ranking logic
  const oldElo = eloRating - eloChange;
  const oldRankInfo = calculateRank(oldElo, Math.max(0, totalBattles - 1));
  const rankInfo = calculateRank(eloRating, totalBattles);

  const themeColor = isWin ? "emerald" : isDraw ? "yellow" : "red";
  const glowShadow = isWin ? "shadow-[0_0_80px_rgba(16,185,129,0.3)]" : isDraw ? "shadow-[0_0_80px_rgba(234,179,8,0.3)]" : "shadow-[0_0_80px_rgba(239,68,68,0.3)]";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`bg-[#0a0a1a] border border-white/10 rounded-2xl p-5 max-w-sm w-full mx-auto relative overflow-hidden ${glowShadow}`}
    >
      {/* Top Border Accent */}
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-${themeColor}-500 shadow-[0_0_20px_var(--tw-shadow-color)] shadow-${themeColor}-500/50`} />
      
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-${themeColor}-500/10 blur-[60px] pointer-events-none`} />

      <div className="relative z-10 text-center mb-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
          className="inline-flex justify-center mb-3 relative"
        >
          <div className={`absolute inset-0 bg-${themeColor}-500/30 blur-2xl rounded-full`} />
          <div className={`relative p-3.5 rounded-xl bg-[#111122] border border-${themeColor}-500/30 text-${themeColor}-400 shadow-xl`}>
            {isWin ? <Trophy size={34} strokeWidth={1.5} /> : isDraw ? <Swords size={34} strokeWidth={1.5} /> : <Skull size={34} strokeWidth={1.5} />}
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-3xl font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 drop-shadow-md`}
        >
          {isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
        </motion.h2>
      </div>

      {/* Competitive Ranking Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4 p-3.5 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        
        {rankInfo.isPlacing ? (
          <div className="text-center relative z-10">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Placement Matches</h3>
            <div className="flex justify-center gap-3 mb-2">
              {[...Array(PLACEMENT_MATCHES_REQUIRED)].map((_, i) => (
                <div key={i} className={`w-12 h-2 rounded-full transition-all duration-1000 ${i < totalBattles ? `bg-${themeColor}-500 shadow-[0_0_10px_var(--tw-shadow-color)] shadow-${themeColor}-500/50` : 'bg-white/10'}`} />
              ))}
            </div>
            <div className="text-xl font-black tracking-widest text-white/80">
              {totalBattles} / {PLACEMENT_MATCHES_REQUIRED}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 relative z-10">
            {/* Rank Badge */}
            <div className="flex flex-col items-center shrink-0 w-24">
              <div className="w-20 h-20 mb-2 rounded-xl flex items-center justify-center relative">
                 <div className="absolute inset-0 rounded-full opacity-20 blur-md" style={{ backgroundColor: rankInfo.color }} />
                 <RankBadge tier={rankInfo.tier} subTier={rankInfo.subTier} size={80} />
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-center" style={{ color: rankInfo.color }}>
                {rankInfo.label}
              </div>
            </div>

            {/* Rank Progress */}
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <div className="text-sm font-bold text-white/60">Rating Progress</div>
                <div className={`text-lg font-black font-mono ${eloChange > 0 ? 'text-green-400' : eloChange < 0 ? 'text-red-400' : 'text-white/60'}`}>
                  {eloChange > 0 ? '+' : ''}{eloChange} ELO
                </div>
              </div>
              
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ backgroundColor: rankInfo.color }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${rankInfo.progress}%` }}
                  transition={{ delay: 1.2, duration: 2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] font-mono text-white/30">
                <span>{oldElo}</span>
                <span>{eloRating}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Combat Stats Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 gap-2 mb-4"
      >
        <div className="bg-[#111122] rounded-lg p-2.5 border border-white/5 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Target size={15} /></div>
          <div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Damage Dealt</div>
            <div className="text-base font-mono font-bold text-white/90">{playerDamageDealt}</div>
          </div>
        </div>

        <div className="bg-[#111122] rounded-lg p-2.5 border border-white/5 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Activity size={15} /></div>
          <div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Damage Taken</div>
            <div className="text-base font-mono font-bold text-white/90">{playerDamageTaken}</div>
          </div>
        </div>

        <div className="bg-[#111122] rounded-lg p-2.5 border border-white/5 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Zap size={15} /></div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">MVP</div>
            <div className="text-xs font-bold text-white/90 truncate">{mvpName || '-'}</div>
          </div>
        </div>

        <div className="bg-[#111122] rounded-lg p-2.5 border border-white/5 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Timer size={15} /></div>
          <div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Turns</div>
            <div className="text-base font-mono font-bold text-white/90">{turns}</div>
          </div>
        </div>

        <div className="bg-[#111122] rounded-lg p-2.5 border border-white/5 flex items-center gap-2 col-span-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400"><Flame size={15} /></div>
          <div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Critical Hits</div>
            <div className="text-base font-mono font-bold text-white/90">{criticals}</div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <Button
          variant={isWin ? "primary" : "secondary"}
          size="lg"
          className="w-full text-sm tracking-widest uppercase font-bold py-3.5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
          onClick={onBack}
        >
          Return to Arena
        </Button>
      </motion.div>
    </motion.div>
  );
}
