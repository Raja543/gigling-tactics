"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap, Swords, Trophy, Crown, Medal, Users, Gem } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { CardDisplay } from "@/components/cards/CardDisplay";
import { useState, useEffect } from "react";
import { DamageNumber } from "@/components/battle/DamageNumber";
import { Footer } from "@/components/layout/Footer";

// Fallback Mock data
const fallbackDemoCards = [
  { id: "demo-1", giglingId: "302", name: "Golden Archon", imageUrl: "/archongigling.png", rarity: "RELIC", faction: "ARCHON", ovr: 94, attack: 90, defense: 90, speed: 75, health: 85, luck: 70, passiveAbility: "Iron Guard", specialAbility: "Divine Shield", traitScore: 95, performanceScore: 95, totalRaces: 200, totalWins: 110, winRatePct: 55, elo: 1800, traits: [] },
  { id: "demo-2", giglingId: "404", name: "Mystic Foxglove", imageUrl: "/foxglovegigling.png", rarity: "RELIC", faction: "FOXGLOVE", ovr: 92, attack: 85, defense: 80, speed: 95, health: 80, luck: 85, passiveAbility: "Nature's Grace", specialAbility: "Petal Storm", traitScore: 90, performanceScore: 92, totalRaces: 150, totalWins: 85, winRatePct: 56, elo: 1750, traits: [] },
  { id: "demo-3", giglingId: "606", name: "Swift Chobo", imageUrl: "/chobogigling.png", rarity: "LEGENDARY", faction: "CHOBO", ovr: 89, attack: 85, defense: 70, speed: 98, health: 65, luck: 75, passiveAbility: "Wind Walker", specialAbility: "Tailwind Dash", traitScore: 85, performanceScore: 88, totalRaces: 220, totalWins: 110, winRatePct: 50, elo: 1600, traits: [] }
];

const fallbackFeaturedCards = [
  { id: "feat-1", giglingId: "777", name: "Alpha Gigus", imageUrl: null, rarity: "GIGA", faction: "GIGUS", ovr: 99, attack: 99, defense: 99, speed: 99, health: 99, luck: 99, passiveAbility: "Apex Predator", specialAbility: "Earth Shatter", traitScore: 100, performanceScore: 100, totalRaces: 500, totalWins: 350, winRatePct: 70, elo: 2500, traits: [] },
  { id: "feat-2", giglingId: "404", name: "Mystic Foxglove", imageUrl: "/foxglovegigling.png", rarity: "RELIC", faction: "FOXGLOVE", ovr: 92, attack: 85, defense: 80, speed: 95, health: 80, luck: 85, passiveAbility: "Nature's Grace", specialAbility: "Petal Storm", traitScore: 90, performanceScore: 92, totalRaces: 150, totalWins: 85, winRatePct: 56, elo: 1750, traits: [] },
  { id: "feat-3", giglingId: "505", name: "Chaos Summoner", imageUrl: null, rarity: "RELIC", faction: "SUMMONER", ovr: 91, attack: 92, defense: 75, speed: 85, health: 85, luck: 90, passiveAbility: "Dark Pact", specialAbility: "Chaos Bolt", traitScore: 88, performanceScore: 90, totalRaces: 180, totalWins: 90, winRatePct: 50, elo: 1680, traits: [] },
  { id: "feat-4", giglingId: "606", name: "Swift Chobo", imageUrl: "/chobogigling.png", rarity: "LEGENDARY", faction: "CHOBO", ovr: 89, attack: 85, defense: 70, speed: 98, health: 65, luck: 75, passiveAbility: "Wind Walker", specialAbility: "Tailwind Dash", traitScore: 85, performanceScore: 88, totalRaces: 220, totalWins: 110, winRatePct: 50, elo: 1600, traits: [] }
];

// Format a count for the stats banner: rounded down to a clean "+" figure.
function formatStat(n: number | undefined): string {
  if (!n || n <= 0) return "0";
  if (n < 100) return String(n);
  if (n < 1000) return `${Math.floor(n / 50) * 50}+`;
  if (n < 1_000_000) return `${(Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${(n / 1_000_000).toFixed(1)}M+`;
}

interface SiteStats { cards: number; players: number; battles: number; factions: number; }

export default function Home() {
  const [demoCards, setDemoCards] = useState(fallbackDemoCards);
  const [featuredCards, setFeaturedCards] = useState(fallbackFeaturedCards);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  // Fetch real top cards from the leaderboard (the API returns `cards`).
  useEffect(() => {
    fetch('/api/leaderboards')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.cards) && data.cards.length >= 7) {
          const cards = data.cards.map((c: any) => ({ ...c, owner: c.user }));
          setDemoCards(cards.slice(0, 3));
          setFeaturedCards(cards.slice(3, 7));
        }
      })
      .catch(err => console.error("Failed to load real cards:", err));
  }, []);

  // Fetch real site-wide stats for the banner.
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => { if (data.success) setSiteStats(data.stats); })
      .catch(() => {});
  }, []);

  // Battle Preview Loop
  const [battleTick, setBattleTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setBattleTick(p => (p + 1) % 6), 600);
    return () => clearInterval(interval);
  }, []);

  const p1Lunge = battleTick === 1;
  const a1Hit = battleTick === 2;
  const a1Lunge = battleTick === 3;
  const p1Hit = battleTick === 4;

  return (
    <div className="flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden min-h-screen font-sans selection:bg-primary/30">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col justify-center pt-24 overflow-hidden z-10 border-b border-white/5">
        
        {/* Extremely Soft, Minimal Spotlight */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-end">
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-20 flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* Left Side: Text Content - Moved up by ~20% */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left -translate-y-16">
            
            <h1 className="text-5xl sm:text-6xl md:text-[5rem] lg:text-[5.5rem] font-heading font-black mb-6 tracking-tighter leading-[0.9] text-white">
              <span className="block">THE ULTIMATE</span>
              <span className="block text-primary whitespace-nowrap">TCG EXPERIENCE</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed font-medium max-w-xl">
              Collect dynamically generated cards from your Gigaverse racing stats. Build the perfect deck, forge faction synergies, and test your might in the explosive Auto-Battler mini-game.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/arena">
                <Button variant="primary" size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-none">
                  Enter The Arena <Swords size={20} className="ml-2 inline-block" />
                </Button>
              </Link>
              <Link href="/explorer">
                <Button variant="secondary" size="lg" className="h-14 px-8 text-lg font-bold rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300">
                  Explore Cards <ArrowRight size={20} className="ml-2 inline-block" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side: Clean Card Display - Moved up by ~15% */}
          <div className="w-full lg:w-1/2 relative h-[500px] lg:h-[600px] flex items-center justify-center perspective-1000 -translate-y-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-[500px] h-full flex items-center justify-center"
            >
              {/* Back Left Card */}
              <motion.div 
                initial={{ opacity: 1, x: -140, y: -10, rotate: -10, scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -40, x: -150, rotate: -5, zIndex: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute z-10 w-64 cursor-pointer"
              >
                <CardDisplay card={demoCards[1] as any} interactive={false} className="shadow-2xl shadow-black/60" />
              </motion.div>

              {/* Back Right Card */}
              <motion.div 
                initial={{ opacity: 1, x: 140, y: 15, rotate: 10, scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -10, x: 150, rotate: 5, zIndex: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute z-10 w-64 cursor-pointer"
              >
                <CardDisplay card={demoCards[2] as any} interactive={false} className="shadow-2xl shadow-black/60" />
              </motion.div>

              {/* Front Center Card */}
              <motion.div 
                initial={{ opacity: 1, scale: 1.1, y: 0, x: 0, rotate: 0 }}
                whileHover={{ scale: 1.2, y: -10, zIndex: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute z-30 w-72 cursor-pointer"
              >
                <CardDisplay card={demoCards[0] as any} interactive={false} className="shadow-[0_30px_60px_rgba(0,0,0,0.8)]" />
              </motion.div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* --- STATS BANNER --- */}
      <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur-md relative z-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5 text-center">
            {[
              { label: "Giglings", value: siteStats ? formatStat(siteStats.cards) : "…" },
              { label: "Players", value: siteStats ? formatStat(siteStats.players) : "…" },
              { label: "Active Factions", value: siteStats ? String(siteStats.factions) : "7" },
              { label: "Battles Fought", value: siteStats ? formatStat(siteStats.battles) : "…" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-3xl md:text-4xl font-heading font-black text-white drop-shadow-md">{stat.value}</span>
                <span className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PIPELINE SECTION --- */}
      <section className="py-32 relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-primary mb-4">The Pipeline</h2>
            <h3 className="text-4xl md:text-6xl font-heading font-black">HOW IT WORKS</h3>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Glowing Connection Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {[
                { icon: <Zap size={24} />, title: "Connect Wallet", desc: "Link your wallet. We instantly detect your Gigaverse NFT assets." },
                { icon: <Sparkles size={24} />, title: "Generate Cards", desc: "Racing stats are deterministically converted into trading cards." },
                { icon: <Shield size={24} />, title: "Build Team", desc: "Create a 3-unit squad and combine factions for hidden bonuses." },
                { icon: <Swords size={24} />, title: "Battle AI", desc: "Watch your team fight in the turn-based Auto-Battler Arena." }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 rounded-[2rem] bg-[#0A0A0F] border border-white/10 flex items-center justify-center mb-8 relative rotate-45 group-hover:rotate-0 group-hover:border-primary/50 transition-all duration-500 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                    <div className="-rotate-45 group-hover:rotate-0 transition-all duration-500 text-white/60 group-hover:text-primary">
                      {step.icon}
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold mb-4 font-heading">{step.title}</h4>
                  <p className="text-white/50 text-base leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURED CARDS --- */}
      <section className="py-32 relative z-20 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-accent mb-4">Pinnacle Rarity</h2>
            <h3 className="text-4xl md:text-6xl font-heading font-black">CHASE THE LEGENDS</h3>
          </div>

          <div className="flex flex-wrap justify-center gap-10">
            {featuredCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -20, scale: 1.02 }}
                className="w-full max-w-[280px] relative group perspective-1000"
              >
                {/* Holographic Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-purple-500 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 rounded-3xl" />
                <div className="relative z-10 transition-transform duration-500 group-hover:rotate-x-12 group-hover:-rotate-y-12">
                  <CardDisplay card={card as any} interactive={false} className="shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BATTLE PREVIEW --- */}
      <section className="py-32 relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-red-500 mb-4">Spectator Mode</h2>
            <h3 className="text-4xl md:text-6xl font-heading font-black">THE ARENA</h3>
          </div>

          <div className="max-w-6xl mx-auto relative rounded-[3rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent">
            <div className="bg-[#05050A] rounded-[3rem] p-8 lg:p-16 relative overflow-hidden shadow-2xl">
              
              {/* Arena Floor Grid */}
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.05)_100%),linear-gradient(90deg,transparent_95%,rgba(255,255,255,0.05)_100%)] bg-[length:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-50 pointer-events-none" />

              <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10 h-[500px]">
                {/* Player Team (Left) */}
                <div className="flex gap-4 items-center h-full">
                  <div className="w-32 opacity-40 scale-90 hidden lg:block filter grayscale"><CardDisplay card={demoCards[2] as any} interactive={false} /></div>
                  <div className="w-40 opacity-70 scale-95 hidden md:block filter blur-[1px]"><CardDisplay card={demoCards[1] as any} interactive={false} /></div>
                  <motion.div 
                    className="w-56 z-20 relative origin-bottom"
                    animate={
                      p1Lunge ? { x: [0, 150, 0], scale: [1, 1.1, 1], rotate: [0, 10, 0] } : 
                      p1Hit ? { x: [0, -15, 15, -10, 10, 0], filter: "brightness(2) contrast(1.5)" } : {}
                    }
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {p1Hit && (
                      <div className="absolute top-0 right-0 -mt-12 -mr-12 z-50 scale-150">
                        <DamageNumber amount={145} isCritical={false} type="damage" onComplete={() => {}} />
                      </div>
                    )}
                    <CardDisplay card={demoCards[0] as any} interactive={false} className={p1Lunge ? "shadow-[0_0_80px_rgba(139,92,246,0.6)]" : "shadow-2xl"} />
                  </motion.div>
                </div>

                {/* VS Divider */}
                <div className="flex flex-col items-center justify-center pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-32 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_100px_rgba(255,0,0,0.1)]">
                    <span className="text-4xl font-black italic text-white/50">VS</span>
                  </div>
                </div>

                {/* AI Team (Right) */}
                <div className="flex gap-4 items-center flex-row-reverse h-full">
                  <div className="w-32 opacity-40 scale-90 hidden lg:block filter grayscale"><CardDisplay card={featuredCards[1] as any} interactive={false} /></div>
                  <div className="w-40 opacity-70 scale-95 hidden md:block filter blur-[1px]"><CardDisplay card={featuredCards[2] as any} interactive={false} /></div>
                  <motion.div 
                    className="w-56 z-20 relative origin-bottom"
                    animate={
                      a1Lunge ? { x: [0, -150, 0], scale: [1, 1.1, 1], rotate: [0, -10, 0] } : 
                      a1Hit ? { x: [0, 15, -15, 10, -10, 0], filter: "brightness(2) contrast(1.5)" } : {}
                    }
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {a1Hit && (
                      <div className="absolute top-0 left-0 -mt-12 -ml-12 z-50 scale-150">
                        <DamageNumber amount={320} isCritical={true} type="damage" onComplete={() => {}} />
                      </div>
                    )}
                    <CardDisplay card={featuredCards[0] as any} interactive={false} className={a1Lunge ? "shadow-[0_0_80px_rgba(6,182,212,0.6)]" : "shadow-2xl"} />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ROADMAP --- */}
      <section className="py-32 relative z-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 mb-4">Roadmap</h2>
          <h3 className="text-4xl md:text-6xl font-heading font-black mb-20">FUTURE POTENTIAL</h3>

          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {[
              { icon: <Swords />, text: "PvP Battles (WebSocket)" },
              { icon: <Trophy />, text: "Ranked Seasons + Ladder" },
              { icon: <Shield />, text: "Guild System + Guild Wars" },
              { icon: <Gem />, text: "Card Trading + Marketplace" },
              { icon: <Users />, text: "Pack Opening Experience" },
              { icon: <Medal />, text: "Tournaments" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                className="flex items-center gap-4 px-8 py-5 bg-[#0A0A0F] border border-white/10 rounded-full hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default group"
              >
                <div className="text-white/40 group-hover:text-primary transition-colors">{item.icon}</div>
                <span className="font-bold text-lg text-white/80 group-hover:text-white transition-colors">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <section className="py-32 relative z-20 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
              <Crown size={40} className="text-primary" />
            </div>
            <h2 className="text-5xl md:text-7xl font-heading font-black mb-8 tracking-tighter">ENTER THE GIGAVERSE</h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12">
              The arena is waiting. Connect your wallet now to automatically claim your first cards and start building your legacy.
            </p>
            <Link href="/team-builder">
              <button className="px-12 py-6 bg-white text-black font-black text-xl rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)]">
                PLAY NOW FOR FREE
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
