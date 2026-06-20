"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { CardDisplay } from "@/components/cards/CardDisplay";
import { Button } from "@/components/ui/Button";
import { ACHIEVEMENTS, TIER_COLOR } from "@/engine/achievement-defs";
import { rarityStyle } from "@/lib/cosmetics";
import { calculateRank } from "@/engine/ranking";
import { AlertCircle, Trophy, Swords, Layers, Star, Lock, Clock, Activity, Flame } from "lucide-react";
import { RankBadge } from "@/components/ui/RankBadge";
import { motion } from "framer-motion";

const RARITY_ORDER = ["UNCOMMON", "RARE", "EPIC", "LEGENDARY", "RELIC", "GIGA"];

export default function ProfilePage() {
  const { address, isConnected, isConnecting, connect } = useWallet();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/profile?wallet=${address}`)
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .finally(() => setLoading(false));
  }, [address]);

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertCircle className="mx-auto text-white/40 mb-4" size={48} />
        <h1 className="text-3xl font-heading font-bold mb-4">Your Dashboard</h1>
        <p className="text-white/60 max-w-md mx-auto mb-8">Connect your Abstract wallet to view your competitive stats, collection, and match history.</p>
        <Button variant="primary" onClick={connect} isLoading={isConnecting}>Connect Abstract Wallet</Button>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-white/50 tracking-widest uppercase text-sm font-bold animate-pulse">Syncing Gigaverse Data...</div>
      </div>
    );
  }

  const earnedKeys = new Set<string>((profile?.achievements || []).map((a: any) => a.achievementKey));
  const earnedCount = earnedKeys.size;
  const rank = calculateRank(profile?.eloRating ?? 1000, profile?.totalBattles ?? 0);

  const stats = [
    { label: "Collection Score", value: profile?.collectionScore ?? 0, icon: <Layers size={20} />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
    { label: "Battles Won", value: profile?.battlesWon ?? 0, icon: <Trophy size={20} />, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
    { label: "Win Rate", value: `${profile?.winRate ?? 0}%`, icon: <Activity size={20} />, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      
      {/* ─── Premium Player Banner ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-8 mb-10 overflow-hidden border"
        style={{ borderColor: `${rank.color}44`, backgroundColor: "#0a0a16" }}
      >
        {/* Animated Glows */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 -top-32 w-96 h-96 rounded-full blur-[80px] z-0" 
          style={{ backgroundColor: rank.color }} 
        />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full blur-[100px] z-0 opacity-10 bg-primary" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-md opacity-50" style={{ backgroundColor: rank.color }} />
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-heading font-black shadow-2xl relative border"
                   style={{ background: `linear-gradient(135deg, ${rank.color}22, #000)`, borderColor: `${rank.color}88`, color: rank.color }}>
                {(profile?.username || address).slice(2, 4).toUpperCase()}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-heading font-black tracking-wide mb-1 text-white drop-shadow-md">{profile?.username || "Unnamed Racer"}</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm font-mono text-white/50 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
                <div className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60">
                  {profile?.cardCount ?? 0} Cards
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-black/40 backdrop-blur-md p-4 pr-8 rounded-2xl border border-white/10 shadow-xl">
            <RankBadge tier={rank.tier} subTier={rank.subTier} size={80} />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Competitive Rank</div>
              <div className="text-2xl font-black drop-shadow-md" style={{ color: rank.color }}>{rank.label}</div>
              <div className="text-sm font-mono text-white/70 mt-0.5">{profile?.eloRating ?? 1000} Rating</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Glassmorphism Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className={`relative overflow-hidden rounded-2xl p-6 border bg-surface/50 backdrop-blur-sm ${s.border} group hover:bg-surface transition-all`}
          >
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity ${s.bg}`} />
            <div className="relative z-10">
              <div className={`flex items-center gap-3 mb-3 ${s.color}`}>
                <div className={`p-2 rounded-lg ${s.bg}`}>{s.icon}</div>
                <span className="text-xs uppercase tracking-widest text-white/50 font-bold">{s.label}</span>
              </div>
              <div className={`text-4xl font-mono font-black ${s.color} drop-shadow-sm`}>{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        
        {/* ─── LEFT COLUMN (WIDER) ─── */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Top Cards (rendered explicitly so they don't shrink) */}
          {profile?.topCards?.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-primary" size={24} />
                <h2 className="text-2xl font-heading font-bold">Top Fighters</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {profile.topCards.map((card: any) => (
                  <CardDisplay key={card.id || card.giglingId} card={card} />
                ))}
              </div>
            </section>
          )}

          {/* Collection Rarity Breakdown */}
          {profile?.cardCount > 0 && (
            <section className="bg-surface/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-5">Rarity Distribution</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RARITY_ORDER.filter((r) => profile.rarityBreakdown?.[r]).map((r) => {
                  const s = rarityStyle(r);
                  const count = profile.rarityBreakdown[r];
                  const pct = Math.round((count / profile.cardCount) * 100);
                  return (
                    <div key={r} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border" style={{ borderColor: `${s.base}44` }}>
                        <img src={s.icon} alt="" className="h-6 w-6 [image-rendering:pixelated]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1 font-bold">
                          <span style={{ color: s.glow }}>{r[0] + r.slice(1).toLowerCase()}</span>
                          <span className="font-mono text-white/80">{count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.base, boxShadow: `0 0 10px ${s.base}` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>

        {/* ─── RIGHT COLUMN (NARROWER SIDEBAR) ─── */}
        <div className="space-y-10">
          
          {/* Match History */}
          {profile?.recentBattles?.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Swords className="text-white/70" size={20} />
                <h2 className="text-xl font-heading font-bold">Match History</h2>
              </div>
              <div className="space-y-3">
                {profile.recentBattles.slice(0, 5).map((b: any) => {
                  const isWin = b.result === "WIN";
                  const isDraw = b.result === "DRAW";
                  return (
                    <div key={b.id} className="flex items-center justify-between bg-surface/40 hover:bg-surface border-l-4 rounded-r-xl rounded-l-sm p-3 transition-colors border-y border-r border-y-white/5 border-r-white/5"
                         style={{ borderLeftColor: isWin ? "#10b981" : isDraw ? "#64748b" : "#f43f5e" }}>
                      <div>
                        <div className={`text-sm font-black tracking-wide ${isWin ? "text-emerald-400" : isDraw ? "text-slate-400" : "text-rose-400"}`}>
                          {b.result}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[9px] uppercase tracking-widest text-white/40">{b.arenaTier}</div>
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <div className="text-[9px] uppercase tracking-widest text-white/40 flex items-center gap-1"><Clock size={10}/> {b.turns}T</div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-base ${b.eloChange > 0 ? "text-emerald-400" : b.eloChange < 0 ? "text-rose-400" : "text-slate-400"}`}>
                        {b.eloChange > 0 ? "+" : ""}{b.eloChange}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Vertical Achievements */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Flame className="text-amber-500" size={20} />
                <h2 className="text-xl font-heading font-bold">Achievements</h2>
              </div>
              <div className="text-xs font-mono text-white/50">
                <span className="text-white font-bold">{earnedCount}</span> / {ACHIEVEMENTS.length}
              </div>
            </div>
            
            <div className="space-y-3">
              {ACHIEVEMENTS.map((a) => {
                const earned = earnedKeys.has(a.key);
                return (
                  <div key={a.key} className={`relative rounded-xl p-3 border transition-all duration-300 flex items-center gap-4 ${earned ? "bg-surface/80 border-white/10" : "bg-black/40 border-white/5"}`}
                       style={earned ? { boxShadow: `0 4px 20px ${TIER_COLOR[a.tier]}15`, borderLeftColor: TIER_COLOR[a.tier], borderLeftWidth: 3 } : {}}>
                    <div className={`text-2xl shrink-0 ${earned ? "" : "grayscale opacity-20"}`}>
                      {earned ? a.icon : <Lock className="text-white/30" size={24} />}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${earned ? "text-white" : "text-white/40"}`}>{a.title}</div>
                      <div className="text-[10px] text-white/40 leading-snug mt-0.5">{a.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}

