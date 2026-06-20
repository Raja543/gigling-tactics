import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RankBadge } from './RankBadge';

interface RankingSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RANKS = [
  { tier: "RADIANT", name: "Radiant", elo: "3100+" },
  { tier: "IMMORTAL", name: "Immortal", elo: "2800 - 3099" },
  { tier: "ASCENDANT", name: "Ascendant", elo: "2500 - 2799" },
  { tier: "DIAMOND", name: "Diamond", elo: "2200 - 2499" },
  { tier: "PLATINUM", name: "Platinum", elo: "1900 - 2199" },
  { tier: "GOLD", name: "Gold", elo: "1600 - 1899" },
  { tier: "SILVER", name: "Silver", elo: "1300 - 1599" },
  { tier: "BRONZE", name: "Bronze", elo: "1000 - 1299" },
  { tier: "IRON", name: "Iron", elo: "0 - 999" },
];

export function RankingSystemModal({ isOpen, onClose }: RankingSystemModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] bg-[#0a0a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Ranking System</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              Play 3 placement matches to reveal your rank. Win battles to gain ELO rating and climb the ladder. Each rank (except Radiant) has 3 sub-tiers.
            </p>
            
            <div className="space-y-3">
              {RANKS.map((rank, i) => (
                <div 
                  key={rank.tier}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <RankBadge tier={rank.tier} subTier={3} size={48} />
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider">{rank.name}</div>
                      <div className="text-xs text-white/40 font-mono">Tier {RANKS.length - i}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Rating Req</div>
                    <div className="font-mono font-bold text-white/90">{rank.elo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
