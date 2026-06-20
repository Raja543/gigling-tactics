"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useDecks } from "@/hooks/useDecks";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { calculateRank } from "@/engine/ranking";
import { Shield, Swords, AlertCircle, Info } from "lucide-react";
import { RankBadge } from "@/components/ui/RankBadge";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const ClashArena = dynamic(() => import("@/components/battle/ClashArena").then((mod) => mod.ClashArena), { ssr: false });
const RankingSystemModal = dynamic(() => import("@/components/ui/RankingSystemModal").then((mod) => mod.RankingSystemModal), { ssr: false });
import { Trophy, Flame, Crown, Star, Zap } from "lucide-react";

export default function ArenaPage() {
  const { address } = useWallet();
  const { decks, isLoading } = useDecks(address);
  const toast = useToast();

  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [rankInfo, setRankInfo] = useState<{ elo: number; total: number; won: number; lost: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRank = () => {
    if (!address) return;
    fetch(`/api/profile?wallet=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setRankInfo({ elo: d.profile.eloRating, total: d.profile.totalBattles, won: d.profile.battlesWon, lost: d.profile.battlesLost });
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadRank();
  }, [address]);

  // Try to pre-select a deck if there's only one, or one is complete
  useEffect(() => {
    if (decks && decks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-heading font-bold mb-4">Connect Wallet</h1>
        <p className="text-white/60 mb-6">You need to connect your wallet to enter the arena.</p>
      </div>
    );
  }

  const startBattle = async () => {
    if (!selectedDeckId) return;
    setIsStarting(true);
    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: selectedDeckId, walletAddress: address, arenaTier: rank?.tier ?? "IRON" }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveBattle({
          ...data.battle,
          playerTeam: data.playerTeam,
          aiTeam: data.aiTeam ?? data.battle.aiTeam,
          mvp: data.mvp,
          eloRating: data.eloRating,
          totalBattles: data.totalBattles,
        });
      } else {
        toast.error("Failed to start battle: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error starting battle.");
    } finally {
      setIsStarting(false);
    }
  };

  if (activeBattle) {
    return (
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
        <ClashArena
          battleData={activeBattle}
          onExit={() => {
            setActiveBattle(null);
            loadRank();
          }}
        />
      </div>
    );
  }

  const rank = rankInfo ? calculateRank(rankInfo.elo, rankInfo.total) : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <RankingSystemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* ─── Title Section ─── */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <Swords className="text-primary" size={48} />
          <h1 className="text-5xl md:text-6xl font-heading font-black uppercase tracking-widest">
            Battle Arena
          </h1>
          <Swords className="text-primary" size={48} />
        </div>
        <p className="text-white/50 text-lg tracking-wide">
          Choose your arena and fight!
        </p>
      </motion.div>

      {/* ─── Player Rank ─── */}
      {rank && (
        <motion.div
          className="max-w-md mx-auto mb-10 bg-black/40 border border-white/10 rounded-2xl p-6 relative backdrop-blur-md shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <button 
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
            title="Rank Info"
          >
            <Info size={18} />
          </button>

          {/* Player Stats / Rank */}
          {rankInfo && (
            <div>
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-5">Competitive Rank</h3>
              
              <div className="flex items-center gap-6 mb-5">
                <div className="w-20 h-20 flex items-center justify-center relative shrink-0">
                   <div className="absolute inset-0 rounded-full opacity-20 blur-md" style={{ backgroundColor: rank.color }} />
                   <RankBadge tier={rank.tier} subTier={rank.subTier} size={80} />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-black uppercase tracking-widest" style={{ color: rank.color }}>{rank.label}</div>
                  {rank.isPlacing ? (
                    <div className="text-sm font-mono text-white/50 mt-1">{rankInfo.total} / 3 Placements</div>
                  ) : (
                    <div className="text-sm font-mono text-white/50 mt-1">{rankInfo.elo} Rating <span className="text-white/30 ml-1">({rankInfo.won}W - {rankInfo.lost}L)</span></div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {!rank.isPlacing && rank.tier !== 'RADIANT' && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-white/40 mb-1.5 uppercase tracking-widest font-bold">
                    <span>Rank Progress</span>
                    <span>{Math.round(rank.progress)} / 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      style={{ backgroundColor: rank.color, boxShadow: `0 0 10px ${rank.color}88` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rank.progress}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}



      {/* ─── Deck Selection & Enter Button ─── */}
      <motion.div
        className="max-w-lg mx-auto bg-surface border border-white/10 rounded-2xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Trophy className="mr-2 text-accent" size={22} />
          Prepare for Battle
        </h2>

        <div className="space-y-6">
          <div>
            <Select
              label="Select Your Team"
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              options={[
                { label: "Choose a deck...", value: "" },
                ...(decks?.map((d: any) => ({ label: d.name, value: d.id })) || []),
              ]}
              disabled={isLoading || !decks?.length}
            />
            {decks?.length === 0 && (
              <p className="text-xs text-red-400 mt-2">You don&apos;t have any complete teams yet. Go to the Team Builder!</p>
            )}
          </div>



          <Button
            variant="primary"
            size="lg"
            className="w-full h-14 text-lg mt-2"
            disabled={!selectedDeckId || isStarting}
            isLoading={isStarting}
            onClick={startBattle}
          >
            <Swords className="mr-2" size={20} />
            Enter Arena
          </Button>
        </div>
      </motion.div>

      {/* Keyframe for champion tier spinning border */}
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
