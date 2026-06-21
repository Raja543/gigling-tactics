"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Swords, Trophy, Crown, Gem, Wallet, Layers, Flame, Target, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { CardDisplay } from "@/components/cards/CardDisplay";
import { rarityStyle, factionStyle, type FactionKey } from "@/lib/cosmetics";
import { useRef, useState, useEffect } from "react";
import { Footer } from "@/components/layout/Footer";

// Below-the-fold, heavy (pulls in ClashCard + battle choreography) — code-split
// it out of the initial bundle so the hero paints fast.
const BattlePreview = dynamic(
  () => import("@/components/battle/BattlePreview").then((m) => m.BattlePreview),
  { ssr: false, loading: () => <div className="h-[320px] flex items-center justify-center text-white/30 text-sm">Loading preview…</div> },
);

const fallbackDemoCards = [
  { id: "demo-1", giglingId: "302", name: "Golden Archon", imageUrl: "/archongigling.png", rarity: "RELIC", faction: "ARCHON", ovr: 94, attack: 90, defense: 90, speed: 75, health: 85, luck: 70, passiveAbility: "Iron Guard", specialAbility: "Divine Shield", traitScore: 95, performanceScore: 95, totalRaces: 200, totalWins: 110, winRatePct: 55, elo: 1800, traits: [] },
  { id: "demo-2", giglingId: "404", name: "Mystic Foxglove", imageUrl: "/foxglovegigling.png", rarity: "RELIC", faction: "FOXGLOVE", ovr: 92, attack: 85, defense: 80, speed: 95, health: 80, luck: 85, passiveAbility: "Nature's Grace", specialAbility: "Petal Storm", traitScore: 90, performanceScore: 92, totalRaces: 150, totalWins: 85, winRatePct: 56, elo: 1750, traits: [] },
  { id: "demo-3", giglingId: "606", name: "Swift Chobo", imageUrl: "/chobogigling.png", rarity: "LEGENDARY", faction: "CHOBO", ovr: 89, attack: 85, defense: 70, speed: 98, health: 65, luck: 75, passiveAbility: "Wind Walker", specialAbility: "Tailwind Dash", traitScore: 85, performanceScore: 88, totalRaces: 220, totalWins: 110, winRatePct: 50, elo: 1600, traits: [] },
];

const fallbackFeaturedCards = [
  { id: "feat-1", giglingId: "777", name: "Alpha Gigus", imageUrl: null, rarity: "GIGA", faction: "GIGUS", ovr: 99, attack: 99, defense: 99, speed: 99, health: 99, luck: 99, passiveAbility: "Apex Predator", specialAbility: "Earth Shatter", traitScore: 100, performanceScore: 100, totalRaces: 500, totalWins: 350, winRatePct: 70, elo: 2500, traits: [] },
  { id: "feat-2", giglingId: "404", name: "Mystic Foxglove", imageUrl: "/foxglovegigling.png", rarity: "RELIC", faction: "FOXGLOVE", ovr: 92, attack: 85, defense: 80, speed: 95, health: 80, luck: 85, passiveAbility: "Nature's Grace", specialAbility: "Petal Storm", traitScore: 90, performanceScore: 92, totalRaces: 150, totalWins: 85, winRatePct: 56, elo: 1750, traits: [] },
  { id: "feat-3", giglingId: "505", name: "Chaos Summoner", imageUrl: null, rarity: "RELIC", faction: "SUMMONER", ovr: 91, attack: 92, defense: 75, speed: 85, health: 85, luck: 90, passiveAbility: "Dark Pact", specialAbility: "Chaos Bolt", traitScore: 88, performanceScore: 90, totalRaces: 180, totalWins: 90, winRatePct: 50, elo: 1680, traits: [] },
  { id: "feat-4", giglingId: "606", name: "Swift Chobo", imageUrl: "/chobogigling.png", rarity: "LEGENDARY", faction: "CHOBO", ovr: 89, attack: 85, defense: 70, speed: 98, health: 65, luck: 75, passiveAbility: "Wind Walker", specialAbility: "Tailwind Dash", traitScore: 85, performanceScore: 88, totalRaces: 220, totalWins: 110, winRatePct: 50, elo: 1600, traits: [] },
];

const FACTIONS: FactionKey[] = ["CRUSADER", "OVERSEER", "ATHENA", "ARCHON", "FOXGLOVE", "SUMMONER", "CHOBO", "GIGUS"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

// Cursor-tracked 3D tilt.
function Tilt({ children, className = "", max = 14 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 18 });
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className={className}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/90">{children}</span>
    </div>
  );
}

export default function Home() {
  const [demoCards, setDemoCards] = useState(fallbackDemoCards);
  const [featuredCards, setFeaturedCards] = useState(fallbackFeaturedCards);

  useEffect(() => {
    fetch("/api/leaderboards")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.cards) && d.cards.length >= 7) {
          const cards = d.cards.map((c: any) => ({ ...c, owner: c.user }));
          setDemoCards(cards.slice(0, 3));
          setFeaturedCards(cards.slice(3, 7));
        }
      })
      .catch(() => {});
  }, []);

  const marquee = [...featuredCards, ...demoCards, ...featuredCards];

  return (
    <div className="flex flex-col bg-background text-zinc-100 overflow-hidden min-h-screen selection:bg-primary/30">

      {/* ═══════════ CINEMATIC HERO (split, card-forward) ═══════════ */}
      <section className="relative flex items-center overflow-hidden pt-20 pb-28 lg:min-h-screen">
        {/* void backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="aurora absolute right-[12%] top-[6%] w-[760px] h-[760px] rounded-full blur-[160px]" style={{ background: "radial-gradient(circle, rgba(226,59,214,0.18), transparent 62%)" }} />
          <div className="aurora absolute left-[-12%] bottom-[-8%] w-[560px] h-[560px] rounded-full blur-[150px]" style={{ background: "radial-gradient(circle, rgba(45,212,191,0.12), transparent 62%)", animationDelay: "4s" }} />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(226,59,214,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(226,59,214,0.6)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_70%_45%,black,transparent_72%)]" />
          <div className="absolute inset-0 [box-shadow:inset_0_0_240px_70px_rgba(0,0,0,0.85)]" />
          {[...Array(10)].map((_, i) => (
            <motion.span key={i} className="absolute rounded-full" style={{ left: `${52 + i * 4}%`, bottom: "8%", width: 2 + (i % 3), height: 2 + (i % 3), background: i % 3 ? "#e23bd6" : "#2dd4bf", boxShadow: "0 0 8px currentColor" }}
              animate={{ y: [0, -160 - (i % 4) * 40, 0], opacity: [0, 0.7, 0] }} transition={{ duration: 7 + (i % 5), repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }} />
          ))}
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-20 grid lg:grid-cols-[1.05fr_1fr] items-center gap-16 lg:gap-20">
          {/* ── Left: copy ── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.h1 variants={fadeUp} className="font-heading font-black tracking-tighter leading-[0.85] text-[clamp(2.9rem,7vw,6rem)]">
              <span className="block text-white">COLLECT.</span>
              <span className="block text-white">BATTLE.</span>
              <span className="block text-holo">CONQUER.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-zinc-400 mt-8 mb-11 max-w-xl leading-relaxed font-medium">
              Your Gigling Racing NFTs become living trading cards. Draft a squad, forge faction synergies, and dominate a cinematic 3v3 auto-battler.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 mb-12">
              <Link href="/arena">
                <Button variant="primary" size="lg" className="h-14 px-9 text-lg font-bold rounded-xl shadow-[0_0_36px_rgba(226,59,214,0.5)] hover:scale-[1.03] transition-transform">
                  Enter The Arena <Swords size={20} className="ml-2 inline-block" />
                </Button>
              </Link>
              <Link href="/explorer">
                <Button variant="secondary" size="lg" className="h-14 px-8 text-lg font-bold rounded-xl border-white/15 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-200">
                  Explore Cards <ArrowRight size={20} className="ml-2 inline-block" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3">
              {[["4,700+", "Giglings"], ["7", "Rarities"], ["8", "Factions"], ["3v3", "Auto-Battler"]].map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-2">
                  <span className="text-xl font-heading font-black text-holo">{v}</span>
                  <span className="text-xs uppercase tracking-widest text-white/40 font-bold">{l}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: dramatic card stage ── */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[440px] sm:h-[520px] hidden md:flex items-center justify-center [perspective:1600px]">
            {/* spotlight beam + ground glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 55% 42%, rgba(226,59,214,0.16), transparent 60%)" }} />
            <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-64 h-10 rounded-[50%] blur-2xl pointer-events-none" style={{ background: "rgba(226,59,214,0.35)" }} />

            {/* flanking cards — wider fan, clearly behind, dimmed */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute z-10 w-40 lg:w-44 foil-sheen rounded-xl brightness-[0.7]" style={{ transform: "translateX(-180px) translateY(36px) rotate(-13deg)" }}>
              <CardDisplay card={demoCards[1] as any} interactive={false} className="shadow-2xl shadow-black/80" />
            </motion.div>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute z-10 w-40 lg:w-44 foil-sheen rounded-xl brightness-[0.7]" style={{ transform: "translateX(180px) translateY(36px) rotate(13deg)" }}>
              <CardDisplay card={demoCards[2] as any} interactive={false} className="shadow-2xl shadow-black/80" />
            </motion.div>

            {/* hero card (tilts to cursor) */}
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative z-30">
              <Tilt className="w-60 lg:w-72 foil-sheen rounded-xl">
                <div className="absolute -inset-5 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(226,59,214,0.4), transparent 70%)", filter: "blur(22px)" }} />
                <CardDisplay card={demoCards[0] as any} interactive={false} className="shadow-[0_40px_90px_rgba(0,0,0,0.9)]" />
              </Tilt>

              {/* floating chips at the OUTER edges so they never cover card content */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                className="absolute -left-24 lg:-left-32 top-10 z-40">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/75 border border-primary/30 backdrop-blur-md shadow-xl">
                  <Sparkles size={14} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-white whitespace-nowrap">Synergy <span className="text-primary">+15%</span></span>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}
                className="absolute -right-20 lg:-right-28 top-1/2 -translate-y-1/2 z-40">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="flex flex-col items-center px-3.5 py-2 rounded-xl bg-black/75 border border-yellow-400/40 backdrop-blur-md shadow-xl">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-300/80">Critical</span>
                  <span className="text-xl font-mono font-black text-yellow-300 leading-none">-318</span>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-40">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 border border-accent/30 backdrop-blur-md shadow-xl whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-accent">On-chain Stats</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* scroll cue */}
        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <ChevronDown size={22} />
        </motion.div>

        {/* foil divider */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </section>

      {/* ═══════════ FACTION STRIP ═══════════ */}
      <section className="relative border-y border-white/5 bg-white/[0.015] py-9 overflow-hidden">
        <div className="flex items-center gap-3 justify-center flex-wrap px-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/30 mr-2">8 Factions</span>
          {FACTIONS.map((f) => {
            const s = factionStyle(f);
            return (
              <div key={f} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${s.color}14`, border: `1px solid ${s.color}33` }}>
                {s.logo && <img src={s.logo} alt="" className="h-3.5 w-3.5 [image-rendering:pixelated]" />}
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: s.color }}>{f}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ ARENA SPOTLIGHT (full-width, asymmetric) ═══════════ */}
      <section className="py-36 relative">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-16 items-center">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
              <motion.div variants={fadeUp}><Eyebrow>Spectator Mode</Eyebrow></motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-heading font-black tracking-tight mt-5 mb-5">
                Watch Them <span className="text-holo">Clash</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 text-lg leading-relaxed mb-7">
                Deterministic 3v3 combat with faction synergies, critical hits, and class-based VFX. Lunges, impacts, floating damage and a victory sequence. Every fight is a replayable spectacle.
              </motion.p>
              <motion.ul variants={fadeUp} className="space-y-3 mb-8">
                {[["Synergy buffs", "Same-faction squads hit harder."], ["Crit & combo", "Big swings, bigger moments."], ["Skill-matched AI", "Adapts to your win streak."]].map(([t, d]) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0"><Flame size={12} className="text-primary" /></span>
                    <span><b className="text-white">{t}.</b> <span className="text-white/45">{d}</span></span>
                  </li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp}>
                <Link href="/arena"><Button variant="primary" size="lg" className="h-12 px-7 font-bold rounded-xl">Enter The Arena <Swords size={18} className="ml-2 inline-block" /></Button></Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
              className="rounded-3xl border border-primary/50 bg-[#07060c] overflow-hidden"
              style={{ boxShadow: "0 0 0 1px rgba(226,59,214,0.35), 0 0 40px rgba(226,59,214,0.35), 0 40px 90px rgba(0,0,0,0.6)" }}>
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10 bg-white/[0.02]">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cyan-300"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Your Squad</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Bronze Arena</span>
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-fuchsia-300">Opponent <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" /></span>
              </div>
              <BattlePreview player={demoCards[0] as any} enemy={featuredCards[0] as any} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS (numbered rail) ═══════════ */}
      <section className="py-24 relative border-y border-white/5 bg-white/[0.012]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="max-w-2xl mb-14">
            <motion.div variants={fadeUp}><Eyebrow>The Pipeline</Eyebrow></motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-heading font-black tracking-tight mt-5">From NFT to <span className="text-holo">Battlefield</span></motion.h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "01", icon: Wallet, title: "Connect", desc: "Sign in with your Abstract Global Wallet. Giglings detected instantly." },
              { n: "02", icon: Sparkles, title: "Generate", desc: "Racing stats deterministically become trading cards." },
              { n: "03", icon: Shield, title: "Build", desc: "Draft a 3-unit squad and stack faction synergies." },
              { n: "04", icon: Swords, title: "Battle", desc: "Watch the cinematic auto-battler decide your fate." },
            ].map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-primary/40 hover:bg-primary/[0.04] transition-colors overflow-hidden">
                <span className="absolute -top-3 -right-1 text-6xl font-heading font-black text-white/[0.04] group-hover:text-primary/10 transition-colors">{s.n}</span>
                <div className="w-11 h-11 rounded-xl bg-primary/12 border border-primary/30 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform"><s.icon size={20} /></div>
                <h4 className="text-lg font-heading font-bold mb-2">{s.title}</h4>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WHY DIFFERENT ═══════════ */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="text-center max-w-2xl mx-auto mb-14">
            <motion.div variants={fadeUp} className="flex justify-center"><Eyebrow>Built Different</Eyebrow></motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-heading font-black tracking-tight mt-5">Skill, Not Just <span className="text-holo">Rarity</span></motion.h2>
          </motion.div>
          {/* Proof panel: the Common-beats-Legendary thesis, split copy + VS */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="relative max-w-5xl mx-auto rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-white/[0.01] to-transparent p-7 md:p-10 overflow-hidden mb-5">
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(226,59,214,0.2)" }} />
            <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
              {/* copy */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-4">
                  <Target size={13} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90">Skill-Weighted OVR</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-heading font-black leading-tight mb-3">A grinder's <span className="text-accent">Common</span> can crush a lazy <span className="text-holo">Legendary</span>.</h3>
                <p className="text-white/50 leading-relaxed mb-5">Every stat is forged from real on-chain racing history, so power is earned at the track, not pulled from a pack.</p>
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[12px]">
                  <span className="text-accent">OVR</span><span className="text-white/40">=</span>trait<span className="text-white/40">×</span><span className="text-primary">0.4</span><span className="text-white/40">+</span>perf<span className="text-white/40">×</span><span className="text-primary">0.6</span>
                </div>
              </div>
              {/* VS comparison */}
              <div className="flex items-stretch gap-4">
                {[
                  { tier: "COMMON", ovr: 88, note: "1,200 races · 71% WR", c: "#2dd4bf", win: true },
                  { tier: "LEGENDARY", ovr: 74, note: "40 races · 31% WR", c: "#f5c451", win: false },
                ].map((u, idx) => (
                  <div key={u.tier} className="relative flex-1 rounded-2xl border p-4" style={{ borderColor: u.win ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.08)", background: u.win ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.02)" }}>
                    {u.win && <span className="absolute -top-2.5 left-4 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent text-black">Winner</span>}
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: u.c }}>{u.tier}</div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-heading font-black leading-none" style={{ color: u.win ? "#fff" : "rgba(255,255,255,0.45)" }}>{u.ovr}</span>
                      <span className="text-[10px] text-white/40 uppercase mb-1">OVR</span>
                    </div>
                    <div className="text-[11px] text-white/50 mt-1">{u.note}</div>
                    {idx === 0 && <div className="absolute top-1/2 -right-5 -translate-y-1/2 z-10 text-[11px] font-heading font-black italic text-white/40">VS</div>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Even feature row */}
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Sparkles, title: "Deterministic", desc: "Same Gigling, same card. No RNG packs." },
              { icon: Flame, title: "Faction Synergy", desc: "Same-faction squads unlock team buffs." },
              { icon: Shield, title: "Class Roles", desc: "Tanks, assassins, mages & supports." },
              { icon: Trophy, title: "Ranked Arena", desc: "Climb an ELO ladder vs adaptive AI." },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-accent/30 hover:bg-accent/[0.03] transition-colors">
                <div className="w-11 h-11 rounded-xl bg-accent/12 border border-accent/30 flex items-center justify-center mb-3 text-accent group-hover:scale-110 transition-transform"><f.icon size={20} /></div>
                <h4 className="font-heading font-bold mb-1">{f.title}</h4>
                <p className="text-white/45 text-[13px] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ RARITY + MARQUEE ═══════════ */}
      <section className="py-24 relative border-y border-white/5 bg-white/[0.012]">
        <div className="text-center max-w-2xl mx-auto mb-12 px-4">
          <div className="flex justify-center mb-5"><Eyebrow>Pinnacle Rarity</Eyebrow></div>
          <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tight">Chase the <span className="text-holo">Legends</span></h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto mb-14 px-4">
          {(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "RELIC", "GIGA"] as const).map((r) => {
            const s = rarityStyle(r);
            return (
              <div key={r} className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: `${s.base}18`, border: `1px solid ${s.base}55` }}>
                <img src={s.icon} alt="" className="h-4 w-4 [image-rendering:pixelated]" />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: s.glow }}>{r}</span>
              </div>
            );
          })}
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <motion.div className="flex gap-6 w-max px-4" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
            {marquee.map((card, i) => (
              <div key={`${card.id}-${i}`} className="w-[200px] shrink-0 foil-sheen rounded-xl">
                <CardDisplay card={card as any} interactive={false} className="shadow-[0_20px_50px_rgba(0,0,0,0.55)]" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ ROADMAP (timeline) ═══════════ */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex justify-center mb-5"><Eyebrow>What's Next</Eyebrow></div>
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tight">The <span className="text-holo">Road Ahead</span></h2>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="relative max-w-3xl mx-auto">
            <div className="absolute left-[15px] sm:left-1/2 sm:-translate-x-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-white/10 to-transparent" />
            <div className="space-y-7">
              {[
                { icon: Swords, phase: "Phase 1", text: "PvP Battles", desc: "Real-time head-to-head duels over WebSockets.", live: true },
                { icon: Trophy, phase: "Phase 2", text: "Ranked Seasons", desc: "Competitive ladders with placements and rewards." },
                { icon: Shield, phase: "Phase 3", text: "Guild Wars", desc: "Form guilds and battle for territory and glory." },
                { icon: Gem, phase: "Phase 4", text: "Card Marketplace", desc: "Trade and sell Giglings with other players." },
                { icon: Layers, phase: "Phase 5", text: "Pack Opening", desc: "Cinematic reveals to grow your collection." },
                { icon: Crown, phase: "Phase 6", text: "Tournaments", desc: "Bracketed events with prize pools." },
              ].map((item, i) => (
                <motion.div key={item.text} variants={fadeUp} className={`relative flex items-start gap-5 sm:gap-8 ${i % 2 === 1 ? "sm:flex-row-reverse sm:text-right" : ""}`}>
                  <div className="relative z-10 shrink-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                    <div className="w-8 h-8 rounded-full bg-[#0c0a12] border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(226,59,214,0.35)]"><item.icon size={15} /></div>
                  </div>
                  <div className={`flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-primary/30 transition-colors sm:max-w-[44%] ${i % 2 === 1 ? "sm:mr-auto" : "sm:ml-auto"}`}>
                    <div className={`flex items-center gap-2 mb-1 ${i % 2 === 1 ? "sm:justify-end" : ""}`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{item.phase}</span>
                      {item.live && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Next Up</span>}
                    </div>
                    <h4 className="text-lg font-heading font-bold mb-1">{item.text}</h4>
                    <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-28 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="aurora absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[340px] blur-[140px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(226,59,214,0.18), transparent 70%)" }} />
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10 text-center">
          <motion.div variants={fadeUp} className="w-20 h-20 mx-auto bg-primary/12 border border-primary/30 rounded-2xl flex items-center justify-center mb-7 shadow-[0_0_50px_rgba(226,59,214,0.3)]"><Crown size={36} className="text-primary" /></motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-heading font-black mb-5 tracking-tighter">ENTER THE <span className="text-holo">ARENA</span></motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/45 max-w-xl mx-auto mb-9">Connect your wallet to claim your cards and start building your legacy.</motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/team-builder"><Button variant="primary" size="lg" className="h-14 px-10 text-lg font-black rounded-xl shadow-[0_0_40px_rgba(226,59,214,0.45)] hover:scale-[1.03] transition-transform">Play Now for Free</Button></Link>
            <Link href="/explorer"><Button variant="secondary" size="lg" className="h-14 px-8 text-lg font-bold rounded-xl border-white/15 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-200">Browse Cards <ArrowRight size={20} className="ml-2 inline-block" /></Button></Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
