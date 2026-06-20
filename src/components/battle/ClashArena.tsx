"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, FastForward, SkipForward, ScrollText, Shield, Zap, Timer, Sparkles, Crown, Skull } from "lucide-react";
import { ClashCard, type FighterEvent } from "./ClashCard";
import { BattleLog } from "./BattleLog";
import { BattleResult } from "./BattleResult";
import { RankBadge } from "@/components/ui/RankBadge";
import { BATTLE_HEALTH_MULTIPLIER } from "@/engine/balance";
import { deriveUnitClass, getClassRow, getUnitClassInfo, getAbilityName, type UnitClass } from "@/engine/unitClass";
import { calculateRank } from "@/engine/ranking";
import { calculateSynergies } from "@/engine/synergy-calculator";
import { factionStyle } from "@/lib/cosmetics";
import type { CardDisplay as CardType } from "@/types/card";
import type { Faction } from "@prisma/client";

interface ClashArenaProps {
  battleData: any;
  onExit: () => void;
}

interface Fighter {
  id: string;
  name: string;
  card: CardType;
  maxHp: number;
  row: number;
  unitClass: UnitClass;
}

const SPEEDS = [
  { label: "Slow", ms: 2600 },
  { label: "Normal", ms: 1800 },
  { label: "Fast", ms: 1100 },
];

const CLASS_COLOR: Record<UnitClass, string> = {
  TANK: "#3b82f6",
  ASSASSIN: "#ef4444",
  MAGE: "#a855f7",
  SUPPORT: "#22c55e",
  BRUISER: "#f59e0b",
};

// Arena identity per competitive tier.
interface ArenaTheme { name: string; sub: string; accent: string; grid: string; glow: string; }
const ARENA_THEMES: Record<string, ArenaTheme> = {
  UNRANKED: { name: "Trial Arena", sub: "Placement Grounds", accent: "#94a3b8", grid: "rgba(148,163,184,0.16)", glow: "rgba(148,163,184,0.14)" },
  IRON: { name: "Iron Arena", sub: "The Pit", accent: "#a8a29e", grid: "rgba(168,162,158,0.16)", glow: "rgba(168,162,158,0.14)" },
  BRONZE: { name: "Bronze Arena", sub: "Training Grounds", accent: "#cd7f32", grid: "rgba(205,127,50,0.18)", glow: "rgba(205,127,50,0.16)" },
  SILVER: { name: "Silver Arena", sub: "Moon Base", accent: "#cbd5e1", grid: "rgba(203,213,225,0.16)", glow: "rgba(203,213,225,0.14)" },
  GOLD: { name: "Gold Arena", sub: "Gigaverse Stadium", accent: "#f7c948", grid: "rgba(247,201,72,0.18)", glow: "rgba(247,201,72,0.16)" },
  PLATINUM: { name: "Platinum Arena", sub: "Sky Citadel", accent: "#5eead4", grid: "rgba(94,234,212,0.16)", glow: "rgba(94,234,212,0.14)" },
  DIAMOND: { name: "Diamond Arena", sub: "Crystal Spire", accent: "#7dd3fc", grid: "rgba(125,211,252,0.18)", glow: "rgba(125,211,252,0.16)" },
  ASCENDANT: { name: "Ascendant Arena", sub: "Astral Coliseum", accent: "#34d399", grid: "rgba(52,211,153,0.18)", glow: "rgba(52,211,153,0.16)" },
  IMMORTAL: { name: "Immortal Arena", sub: "Bloodspire", accent: "#fb7185", grid: "rgba(251,113,133,0.18)", glow: "rgba(251,113,133,0.16)" },
  RADIANT: { name: "Radiant Arena", sub: "Faction Temple", accent: "#fde047", grid: "rgba(253,224,71,0.2)", glow: "rgba(253,224,71,0.18)" },
};
function arenaTheme(tier: string): ArenaTheme {
  return ARENA_THEMES[(tier || "BRONZE").toUpperCase()] ?? ARENA_THEMES.BRONZE;
}

function buildTeam(cards: CardType[], prefix: string, nameMap: Map<string, string>, usedNames: Set<string>): Fighter[] {
  return cards.map((c) => {
    let baseName = c.name;
    if (!baseName || baseName.startsWith("#")) {
      const ci = getUnitClassInfo(c);
      const title = c.faction !== "NONE" ? c.faction : "VOID";
      baseName = `${title} ${ci.label}`.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
    }

    let finalName = baseName;
    let counter = 2;
    while (usedNames.has(finalName)) {
      const roman = counter === 2 ? "II" : counter === 3 ? "III" : counter === 4 ? "IV" : counter.toString();
      finalName = `${baseName} ${roman}`;
      counter++;
    }
    usedNames.add(finalName);
    nameMap.set(c.name, finalName);

    return {
      id: `${prefix}-${c.id}`,
      name: finalName,
      card: { ...c, name: finalName },
      maxHp: c.health * BATTLE_HEALTH_MULTIPLIER,
      row: getClassRow(deriveUnitClass(c)),
      unitClass: deriveUnitClass(c),
    };
  });
}

// ─── Class-based impact VFX component ───
function ImpactVFX({ unitClass, side, step }: { unitClass: UnitClass; side: "player" | "ai"; step: number }) {
  const dir = side === "player" ? 1 : -1;
  const color = {
    TANK: "#3b82f6",
    ASSASSIN: "#ef4444",
    MAGE: "#a855f7",
    SUPPORT: "#22c55e",
    BRUISER: "#f59e0b",
  }[unitClass];

  if (unitClass === "ASSASSIN") {
    // Slash marks
    return (
      <motion.div key={`impact-${step}`} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        {[0, 1].map(i => (
          <motion.div key={i} className="absolute" style={{ width: 80, height: 4, background: color, borderRadius: 4, rotate: i === 0 ? 45 : -45 }}
            initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0, 1.2, 0.8], opacity: [0, 1, 0] }}
            transition={{ duration: 0.35, delay: i * 0.06 }} />
        ))}
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <motion.div key={`s${i}`} className="absolute w-1.5 h-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * 50, y: Math.sin(a) * 50, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }} />;
        })}
      </motion.div>
    );
  }

  if (unitClass === "MAGE") {
    // Explosion burst
    return (
      <motion.div key={`impact-${step}`} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        <motion.div className="absolute rounded-full"
          style={{ background: `radial-gradient(circle, ${color}cc, transparent)`, width: 100, height: 100 }}
          initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 1.5, 0.8], opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.5 }} />
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <motion.div key={`p${i}`} className="absolute w-2 h-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 12px ${color}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 70, y: Math.sin(a) * 70, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.02 }} />;
        })}
      </motion.div>
    );
  }

  if (unitClass === "SUPPORT") {
    // Healing particles rising
    return (
      <motion.div key={`impact-${step}`} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute w-2 h-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 10px ${color}`, left: `${40 + (i - 4) * 8}%` }}
            initial={{ y: 20, opacity: 0, scale: 0.5 }} animate={{ y: -60 - i * 10, opacity: [0, 1, 0], scale: [0.5, 1, 0.3] }}
            transition={{ duration: 0.7, delay: i * 0.05 }} />
        ))}
      </motion.div>
    );
  }

  // TANK: shield bash ring, BRUISER: fist impact crack
  return (
    <motion.div key={`impact-${step}`} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <motion.div className="absolute rounded-full"
        style={{ border: `3px solid ${color}`, width: 60, height: 60, boxShadow: `0 0 20px ${color}88` }}
        initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: [0.3, 2.5], opacity: [1, 0] }}
        transition={{ duration: 0.4 }} />
      <motion.div className="absolute rounded-full"
        style={{ border: `2px solid ${color}aa`, width: 30, height: 30 }}
        initial={{ scale: 0.5, opacity: 0.8 }} animate={{ scale: [0.5, 3], opacity: [0.8, 0] }}
        transition={{ duration: 0.5, delay: 0.08 }} />
    </motion.div>
  );
}

export function ClashArena({ battleData, onExit }: ClashArenaProps) {
  const rawLogs: any[] = battleData.logs || [];

  const { playerTeam, aiTeam, nameMap } = useMemo(() => {
    const map = new Map<string, string>();
    const usedNames = new Set<string>();
    const p = buildTeam(battleData.playerTeam || battleData.deck?.deckCards?.map((d: any) => d.card) || [], "P", map, usedNames);
    const a = buildTeam(battleData.aiTeam || [], "A", map, usedNames);
    return { playerTeam: p, aiTeam: a, nameMap: map };
  }, [battleData]);

  const logs = useMemo(
    () =>
      rawLogs.map((l) => ({
        ...l,
        actorName: l.actorName ? nameMap.get(l.actorName) || l.actorName : l.actorName,
        targetName: l.targetName ? nameMap.get(l.targetName) || l.targetName : l.targetName,
      })),
    [rawLogs, nameMap],
  );

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(1800); // Normal: each attack fully resolves before the next
  const [shake, setShake] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [ko, setKo] = useState<{ seq: number; name: string } | null>(null);
  const [showImpact, setShowImpact] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [roundMvp, setRoundMvp] = useState<{ seq: number; name: string; dmg: number; round: number } | null>(null);
  const prevTurnRef = useRef(0);

  // Screen shake + KO detection
  useEffect(() => {
    const l = logs[step - 1];
    if (!l) return;
    if (l.actionType === "DEFEATED") {
      setShakeIntensity(1.8);
      setShake((n) => n + 1);
      if (l.actorName) setKo({ seq: step, name: l.actorName });
    } else if (l.isCritical || l.actionType === "SPECIAL") {
      setShakeIntensity(1.2);
      setShake((n) => n + 1);
      setShowImpact(true);
      setTimeout(() => setShowImpact(false), 500);
    } else if (l.damage) {
      setShakeIntensity(0.4);
      setShake((n) => n + 1);
      setShowImpact(true);
      setTimeout(() => setShowImpact(false), 400);
    }
  }, [step, logs]);

  useEffect(() => {
    if (!ko) return;
    const t = setTimeout(() => setKo(null), 1800);
    return () => clearTimeout(t);
  }, [ko]);

  // ── HP + death tracking ──
  const { hpByName, deadByName } = useMemo(() => {
    const hp: Record<string, number> = {};
    const dead: Record<string, boolean> = {};
    [...playerTeam, ...aiTeam].forEach((f) => (hp[f.name] = f.maxHp));
    for (let i = 0; i < step; i++) {
      const l = logs[i];
      if (!l) continue;
      if (l.damage && l.targetName) hp[l.targetName] = Math.max(0, (hp[l.targetName] ?? 0) - l.damage);
      if (l.healing && l.actorName) hp[l.actorName] = (hp[l.actorName] ?? 0) + l.healing;
      if (l.actionType === "DEFEATED" && l.actorName) dead[l.actorName] = true;
    }
    return { hpByName: hp, deadByName: dead };
  }, [step, logs, playerTeam, aiTeam]);

  // Check if either team is fully eliminated
  const playerWiped = playerTeam.length > 0 && playerTeam.every(f => deadByName[f.name]);
  const aiWiped = aiTeam.length > 0 && aiTeam.every(f => deadByName[f.name]);
  const teamWiped = playerWiped || aiWiped;
  const finished = step >= logs.length || teamWiped;

  // Victory sequence: final KO settles -> VICTORY/DEFEAT splash -> result screen.
  useEffect(() => {
    if (!started || !finished) return;
    const t1 = setTimeout(() => setShowSplash(true), 900);
    const t2 = setTimeout(() => { setShowSplash(false); setShowResult(true); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [started, finished]);

  // Auto-advance step (stops when finished)
  useEffect(() => {
    if (!started || !playing || finished) return;
    const t = setTimeout(() => setStep((s) => s + 1), speedMs);
    return () => clearTimeout(t);
  }, [started, playing, finished, speedMs, step]);

  useEffect(() => {
    if (!started || finished) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, finished]);

  const curLog = logs[step - 1];
  const activeActor: string | null = curLog?.actorName ?? null;
  const activeTarget: string | null =
    curLog && curLog.targetName && (curLog.damage || curLog.actionType === "SPECIAL") ? curLog.targetName : null;

  // Find the unit class of the current actor (for impact VFX)
  const actorFighter = useMemo(() => {
    if (!activeActor) return null;
    return [...playerTeam, ...aiTeam].find(f => f.name === activeActor) ?? null;
  }, [activeActor, playerTeam, aiTeam]);

  const actorSide: "player" | "ai" = actorFighter ? (playerTeam.includes(actorFighter) ? "player" : "ai") : "player";

  // Ability banner (on SPECIAL) + crit overlay (on critical hit), trait/class-coloured.
  const showAbilityBanner = curLog?.actionType === "SPECIAL" && !!actorFighter;
  const abilityColor = actorFighter ? CLASS_COLOR[actorFighter.unitClass] : "#a855f7";
  const abilityName = actorFighter ? getAbilityName(actorFighter.card) : "";
  const showCrit = !!curLog?.isCritical && !!curLog?.damage;

  // Always-visible action callout: who is acting on whom this step.
  const actionCallout = useMemo(() => {
    if (!curLog || !curLog.actorName) return null;
    const actorIsPlayer = playerTeam.some((p) => p.name === curLog.actorName);
    if (curLog.actionType === "HEAL") return { actor: curLog.actorName, verb: "heals", target: curLog.actorName, actorIsPlayer, tone: "heal" as const };
    if (curLog.actionType === "DEFEATED") return null;
    if (!curLog.targetName) return null;
    if (curLog.damage) return { actor: curLog.actorName, verb: curLog.actionType === "SPECIAL" ? "unleashes on" : curLog.isCritical ? "crits" : "strikes", target: curLog.targetName, actorIsPlayer, tone: curLog.isCritical ? "crit" as const : "hit" as const };
    if (curLog.actionType === "ATTACK") return { actor: curLog.actorName, verb: "misses", target: curLog.targetName, actorIsPlayer, tone: "miss" as const };
    return null;
  }, [curLog, playerTeam]);

  // Real upcoming attacker (the next log entry's actor).
  const nextActor = useMemo(() => {
    const nl = logs[step];
    if (!nl?.actorName) return null;
    const f = [...playerTeam, ...aiTeam].find((x) => x.name === nl.actorName);
    if (!f) return null;
    return { name: nl.actorName, isPlayer: playerTeam.some((p) => p.name === nl.actorName) };
  }, [logs, step, playerTeam, aiTeam]);

  // Combo: streak of consecutive landed hits (a miss/dodge breaks it).
  const combo = useMemo(() => {
    let c = 0;
    for (let i = 0; i < step; i++) {
      const l = logs[i];
      if (!l) continue;
      if (l.actionType === "ATTACK" || l.actionType === "SPECIAL") c = l.damage ? c + 1 : 0;
    }
    return c;
  }, [step, logs]);
  const showCombo = combo >= 3 && (curLog?.actionType === "ATTACK" || curLog?.actionType === "SPECIAL") && !!curLog?.damage;

  // Per-round MVP: when the round advances, surface the top damage dealer of the round that just ended.
  useEffect(() => {
    const t = curLog?.turnNumber ?? 0;
    if (t > prevTurnRef.current && prevTurnRef.current >= 1) {
      const r = prevTurnRef.current;
      const dmg: Record<string, number> = {};
      logs.forEach((l) => { if (l.turnNumber === r && l.damage && l.actorName) dmg[l.actorName] = (dmg[l.actorName] || 0) + l.damage; });
      const top = Object.entries(dmg).sort((a, b) => b[1] - a[1])[0];
      if (top) setRoundMvp({ seq: step, name: top[0], dmg: top[1], round: r });
    }
    prevTurnRef.current = t;
  }, [step, curLog, logs]);

  useEffect(() => {
    if (!roundMvp) return;
    const t = setTimeout(() => setRoundMvp(null), 1900);
    return () => clearTimeout(t);
  }, [roundMvp]);

  const eventFor = (name: string): FighterEvent | null => {
    const l = logs[step - 1];
    if (!l) return null;
    if (l.actorName === name) {
      if (l.actionType === "SPECIAL") return { seq: step, kind: "special", amount: l.damage || 0, isCritical: !!l.isCritical };
      if (l.actionType === "ATTACK" && l.damage) return { seq: step, kind: "attack", amount: l.damage, isCritical: !!l.isCritical };
      if (l.actionType === "HEAL") return { seq: step, kind: "heal", amount: l.healing || 0, isCritical: false };
    }
    if (l.targetName === name) {
      if (l.damage) return { seq: step, kind: "hit", amount: l.damage, isCritical: !!l.isCritical };
      if (l.actionType === "ATTACK") return { seq: step, kind: "dodge", amount: 0, isCritical: false };
    }
    return null;
  };

  const turn = logs[step - 1]?.turnNumber ?? 0;
  const flashColor = curLog?.isCritical ? "#FF4757" : curLog?.actionType === "SPECIAL" ? "#8B5CF6" : null;
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Player rank + opponent rating.
  const playerRank = calculateRank(battleData.eloRating ?? 1000, battleData.totalBattles ?? 0);
  const theme = arenaTheme(playerRank.tier);
  const teamPower = (t: Fighter[]) => t.reduce((s, f) => s + (f.card.ovr || 0), 0);
  const playerPower = teamPower(playerTeam);
  const aiPower = teamPower(aiTeam);
  const aiAvgOvr = aiTeam.length ? Math.round(aiPower / aiTeam.length) : 0;
  const aiElo = Math.round(800 + Math.max(0, aiAvgOvr - 40) * 26);
  const aiRank = calculateRank(aiElo, 99);

  const playerSynergies = useMemo(() => calculateSynergies(playerTeam.map((f) => f.card.faction as Faction)), [playerTeam]);
  const aiSynergies = useMemo(() => calculateSynergies(aiTeam.map((f) => f.card.faction as Faction)), [aiTeam]);

  const dominant = (team: Fighter[]) => {
    const c: Record<string, number> = {};
    team.forEach((f) => (c[f.card.faction] = (c[f.card.faction] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || "NONE";
  };
  const playerFaction = factionStyle(dominant(playerTeam));
  const aiFaction = factionStyle(dominant(aiTeam));

  const winChance = useMemo(() => {
    const score = (t: Fighter[], syn: ReturnType<typeof calculateSynergies>) => {
      const avg = t.length ? teamPower(t) / t.length : 0;
      const synBonus = syn.reduce((s, x) => s + Object.values(x.statBoosts).reduce((a, b) => a + b, 0), 0) * 0.15;
      return Math.max(1, avg + synBonus);
    };
    const p = score(playerTeam, playerSynergies);
    const a = score(aiTeam, aiSynergies);
    return Math.round((p / (p + a)) * 100);
  }, [playerTeam, aiTeam, playerSynergies, aiSynergies]);

  // Team HP for momentum bars.
  const teamHp = (t: Fighter[]) => {
    let cur = 0, max = 0;
    t.forEach((f) => { max += f.maxHp; cur += Math.max(0, hpByName[f.name] ?? f.maxHp); });
    return { cur, max, pct: max > 0 ? (cur / max) * 100 : 0 };
  };
  const playerHp = teamHp(playerTeam);
  const aiHp = teamHp(aiTeam);

  // ── Center stage shows the ACTUAL participants of the current action ──
  // (the engine lets every unit act each round, so we must spotlight whoever
  // is attacking and whoever is being hit — not just the front of the queue).
  const alivePlayer = playerTeam.filter(f => !deadByName[f.name]);
  const aliveAI = aiTeam.filter(f => !deadByName[f.name]);

  const stepActorF = (activeActor && [...playerTeam, ...aiTeam].find(f => f.name === activeActor)) || null;
  const stepTargetF = (activeTarget && [...playerTeam, ...aiTeam].find(f => f.name === activeTarget)) || null;
  const onPlayer = (f: Fighter | null) => !!f && playerTeam.some(p => p.name === f.name);

  // Player-side slot = the player unit involved this step; AI-side slot likewise.
  const activePlayerFighter =
    (onPlayer(stepActorF) ? stepActorF : onPlayer(stepTargetF) ? stepTargetF : null) ?? alivePlayer[0] ?? null;
  const activeAIFighter =
    (!onPlayer(stepActorF) && stepActorF ? stepActorF : !onPlayer(stepTargetF) && stepTargetF ? stepTargetF : null) ?? aliveAI[0] ?? null;

  // Bench = remaining alive units that aren't on center stage.
  const playerBench = alivePlayer.filter(f => f.name !== activePlayerFighter?.name);
  const aiBench = aliveAI.filter(f => f.name !== activeAIFighter?.name);

  // ── Turn order (next attackers based on speed) ──
  const turnOrder = useMemo(() => {
    const alive = [...playerTeam, ...aiTeam].filter(f => !deadByName[f.name]);
    return alive.sort((a, b) => b.card.speed - a.card.speed).slice(0, 4);
  }, [playerTeam, aiTeam, deadByName]);

  const fmtBoosts = (boosts: Record<string, number>) =>
    Object.entries(boosts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `+${v}% ${k.slice(0, 3).toUpperCase()}`)
      .join(" ");

  const SynergyChips = ({ list, color, align }: { list: ReturnType<typeof calculateSynergies>; color: string; align: "left" | "right" }) => (
    <div className={`flex flex-wrap gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {list.length === 0 && <span className="text-[8px] text-white/20 uppercase tracking-widest">No Synergy</span>}
      {list.map((s) => {
        const boosts = fmtBoosts(s.statBoosts);
        return (
          <span key={s.name} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide"
            style={{ background: `${color}22`, border: `1px solid ${color}66`, color }}>
            <Sparkles size={8} /> {s.name}
            {boosts && <span className="text-white/80 normal-case">· {boosts}</span>}
          </span>
        );
      })}
    </div>
  );

  // ── Bench card (small, dimmed, gently breathing) ──
  const renderBenchCard = (f: Fighter, side: "player" | "ai", idx: number) => {
    const col = side === "player" ? "rgba(34,211,238," : "rgba(214,51,255,";
    return (
      <motion.div
        key={f.id}
        layout
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 0.78, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.4, y: -30 }}
        transition={{ type: "spring", stiffness: 250, damping: 22 }}
        className="relative"
      >
        {/* soft idle glow pulse */}
        <motion.div className="absolute -inset-2 rounded-2xl pointer-events-none -z-10"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
          style={{ background: `radial-gradient(ellipse, ${col}0.18), transparent 70%)`, filter: "blur(8px)" }} />
        {/* breathing + hover drift */}
        <motion.div
          animate={{ y: [0, -4, 0], scale: [1, 1.012, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 }}
        >
          <ClashCard card={f.card} side={side} maxHealth={f.maxHp}
            currentHealth={hpByName[f.name] ?? f.maxHp} isDead={false}
            event={null} scale={0.62}
            isActor={false} isTarget={false} />
        </motion.div>
      </motion.div>
    );
  };

  // ── Formation slot: a fixed bay per team member. Holds the bench card, or an
  //    empty slot when the unit is fighting at center / has been eliminated. ──
  const renderFormationSlot = (f: Fighter, side: "player" | "ai", idx: number) => {
    const dead = !!deadByName[f.name];
    const onStage = (side === "player" ? activePlayerFighter : activeAIFighter)?.name === f.name;
    const col = side === "player" ? "#22d3ee" : "#d633ff";
    return (
      <div key={f.id} className="relative flex items-center justify-center" style={{ width: 84, height: 132 }}>
        {/* slot base */}
        <div className="absolute inset-0 rounded-xl"
          style={{
            border: `1px dashed ${dead ? "rgba(255,71,87,0.3)" : `${col}55`}`,
            background: dead ? "rgba(255,71,87,0.04)" : `${col}0a`,
            boxShadow: dead ? "none" : `inset 0 0 12px ${col}14`,
          }} />
        {/* slot index tab */}
        <span className="absolute -top-1.5 left-1.5 z-10 text-[7px] font-black uppercase tracking-widest px-1 rounded"
          style={{ background: "#0a0a1c", color: dead ? "rgba(255,71,87,0.6)" : `${col}aa` }}>
          {dead ? "KO" : `S${idx + 1}`}
        </span>
        {dead && <Skull size={20} className="text-red-500/40" />}
        {!dead && !onStage && (
          <AnimatePresence mode="popLayout">
            {renderBenchCard(f, side, idx)}
          </AnimatePresence>
        )}
        {/* on-stage marker: this unit is at center */}
        {!dead && onStage && (
          <motion.div className="text-[7px] font-bold uppercase tracking-widest"
            style={{ color: `${col}99` }} animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}>
            In Combat
          </motion.div>
        )}
      </div>
    );
  };

  // ── Active fighter (large, center stage) ──
  const renderActiveCard = (f: Fighter | null, side: "player" | "ai") => {
    if (!f) return null;
    const isActing = activeActor === f.name;
    const isBeingHit = activeTarget === f.name;
    // Lunge direction: player lunges right (+x), AI lunges left (-x)
    const lungeDir = side === "player" ? 1 : -1;
    const ev = eventFor(f.name);
    const isAttacking = ev && (ev.kind === "attack" || ev.kind === "special");
    const isHit = ev && ev.kind === "hit";

    return (
      <motion.div
        key={f.id}
        layout
        initial={{ opacity: 0, scale: 0.8, x: lungeDir * -100 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: isAttacking ? lungeDir * 60 : isHit ? lungeDir * -20 : 0,
        }}
        exit={{ opacity: 0, scale: 0.3, y: 40, rotate: lungeDir * 15, filter: "grayscale(100%) brightness(0.2)" }}
        transition={{
          layout: { type: "spring", stiffness: 300, damping: 25 },
          x: { type: "spring", stiffness: 400, damping: 18 },
          default: { type: "spring", stiffness: 300, damping: 25 },
        }}
        className="relative z-20"
      >
        {/* Active spotlight glow */}
        <motion.div
          className="absolute -inset-4 rounded-3xl pointer-events-none -z-10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: `radial-gradient(ellipse, ${side === "player" ? "rgba(34,211,238,0.15)" : "rgba(214,51,255,0.15)"}, transparent 70%)`,
            filter: "blur(12px)",
          }}
        />
        {/* Dynamic Floor Shadow */}
        <motion.div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-4 w-24 rounded-[100%] pointer-events-none -z-20 bg-black/60 blur-[4px]"
          animate={{ scale: isAttacking ? 1.3 : isHit ? 0.9 : 1, opacity: isAttacking ? 0.3 : 0.8 }}
          transition={{ duration: 0.3 }} />
          
        <ClashCard card={f.card} side={side} maxHealth={f.maxHp}
          currentHealth={hpByName[f.name] ?? f.maxHp} isDead={!!deadByName[f.name]}
          event={ev} scale={1.2}
          isActor={isActing} isTarget={isBeingHit} />
      </motion.div>
    );
  };

  // Compact roster row for the bottom panel.
  const renderRoster = (team: Fighter[], side: "player" | "ai") => {
    const col = side === "player" ? "#22d3ee" : "#d633ff";
    return (
      <div className="flex flex-col gap-1.5 h-full overflow-y-auto pr-0.5">
        {team.map((f) => {
          const cur = Math.max(0, hpByName[f.name] ?? f.maxHp);
          const pct = Math.max(0, Math.min(100, (cur / f.maxHp) * 100));
          const dead = !!deadByName[f.name];
          const isCur = activeActor === f.name;
          const isTgt = activeTarget === f.name;
          const cls = getUnitClassInfo(f.card);
          const fac = factionStyle(f.card.faction);
          const hpC = pct > 50 ? "#22c55e" : pct > 20 ? "#eab308" : "#ef4444";
          return (
            <div key={f.id} className={`flex items-center gap-2 rounded-lg p-1.5 transition-all ${dead ? "opacity-35 grayscale" : ""}`}
              style={{
                background: isCur ? `${col}22` : isTgt ? "rgba(255,71,87,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isCur ? col : isTgt ? "#ff4757" : "rgba(255,255,255,0.06)"}`,
                flexDirection: side === "ai" ? "row-reverse" : "row",
              }}>
              <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0" style={{ border: `1px solid ${fac.color}66` }}>
                {f.card.imageUrl
                  ? <img src={f.card.imageUrl} alt="" className="w-full h-full object-cover" style={{ transform: side === "ai" ? "scaleX(-1)" : "none" }} />
                  : <div className="w-full h-full flex items-center justify-center text-[9px] text-white/40">{f.name[0]}</div>}
                <span className="absolute bottom-0 right-0 px-0.5 text-[6px] font-black bg-black/70" style={{ color: cls.color }}>{cls.label[0]}</span>
              </div>
              <div className={`flex-1 min-w-0 ${side === "ai" ? "text-right" : ""}`}>
                <div className={`flex items-center gap-1 ${side === "ai" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] font-bold text-white/90 truncate">{f.name}</span>
                  <span className="text-[8px] font-mono shrink-0" style={{ color: col }}>{f.card.ovr}</span>
                </div>
                <div className="relative h-1.5 rounded-full overflow-hidden bg-black/50 my-0.5">
                  <motion.div className="h-full" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
                    style={{ background: hpC, marginLeft: side === "ai" ? "auto" : 0 }} />
                </div>
                <div className={`flex gap-1.5 text-[7px] font-mono text-white/40 ${side === "ai" ? "justify-end" : ""}`}>
                  <span className="text-red-300/70">A{f.card.attack}</span>
                  <span className="text-blue-300/70">D{f.card.defense}</span>
                  <span className="text-yellow-300/70">S{f.card.speed}</span>
                  <span>{Math.ceil(cur)}/{f.maxHp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden rounded-2xl"
      style={{ background: "#050510", border: `1px solid ${theme.accent}33`, boxShadow: `0 0 80px ${theme.glow}` }}>

      {/* keyframes for animated rarity borders */}
      <style jsx global>{`
        @keyframes clash-rarity-spin { to { transform: rotate(360deg); } }
        .clash-rarity-spin { animation: clash-rarity-spin 4s linear infinite; }
      `}</style>

      {/* ═══ TOP RANK BAR ═══ */}
      <div className="relative z-30 shrink-0 px-4 py-2.5"
        style={{ background: "linear-gradient(180deg, #1a1a36, #0b0b1c)", borderBottom: `1px solid ${theme.accent}44`, boxShadow: `0 4px 16px rgba(0,0,0,0.4)` }}>
        <div className="flex items-stretch justify-between gap-3">
          {/* Player rank card */}
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12), transparent)", border: "1px solid rgba(34,211,238,0.25)" }}>
            <RankBadge tier={playerRank.tier} subTier={playerRank.subTier} size={36} />
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-widest text-white/40">You</div>
              <div className="text-sm font-bold" style={{ color: playerRank.color }}>{playerRank.label}</div>
            </div>
            <span className="ml-1 flex items-center gap-1 text-sm font-black text-white tabular-nums px-2 py-0.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.4)" }}>
              <Shield size={13} style={{ color: playerFaction.color }} /> {alivePlayer.length}
            </span>
          </div>

          {/* Center: arena name only (HP + synergy now live inside the arena) */}
          <div className="flex-1 max-w-sm mx-auto text-center flex items-center justify-center gap-2">
            <span className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}88)` }} />
            <div className="text-[13px] font-black uppercase tracking-[0.25em]" style={{ color: theme.accent, textShadow: `0 0 12px ${theme.accent}66` }}>{theme.name}</div>
            <span className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(90deg, ${theme.accent}88, transparent)` }} />
          </div>

          {/* Opponent rank card */}
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
            style={{ background: "linear-gradient(225deg, rgba(214,51,255,0.12), transparent)", border: "1px solid rgba(214,51,255,0.25)" }}>
            <span className="mr-0.5 flex items-center gap-1 text-sm font-black text-white tabular-nums px-2 py-0.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.4)" }}>
              {aliveAI.length} <Zap size={13} style={{ color: aiFaction.color }} />
            </span>
            <div className="leading-tight text-right">
              <div className="text-[9px] uppercase tracking-widest text-white/40">Opponent · OVR {aiAvgOvr}</div>
              <div className="text-sm font-bold" style={{ color: aiRank.color }}>{aiRank.label}</div>
            </div>
            <RankBadge tier={aiRank.tier} subTier={aiRank.subTier} size={36} />
          </div>
        </div>
      </div>

      {/* ═══ BATTLEFIELD — Center Stage Duel ═══ */}
      <motion.div key={shake}
        animate={shake ? { x: [0, -8 * shakeIntensity, 8 * shakeIntensity, -5 * shakeIntensity, 5 * shakeIntensity, 0], y: [0, 3 * shakeIntensity, -3 * shakeIntensity, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative flex-[82] overflow-hidden flex items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/arena_background.png')" }}>

        {/* ─── IN-ARENA HUD: team HP momentum + timer + synergies ─── */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[min(620px,80%)] pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative h-3.5 rounded-l-full overflow-hidden bg-black/70" style={{ border: "1px solid rgba(34,211,238,0.4)" }}>
              <motion.div className="absolute inset-y-0 right-0" initial={false} animate={{ width: `${playerHp.pct}%` }} transition={{ duration: 0.4 }}
                style={{ background: "linear-gradient(90deg,#0ea5e9,#22d3ee)", boxShadow: "0 0 10px #22d3eeaa" }} />
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-white tabular-nums" style={{ textShadow: "0 1px 2px #000" }}>{Math.round(playerHp.pct)}%</span>
            </div>
            <div className="shrink-0 px-2 py-0.5 rounded-md font-mono text-[10px] text-white/80 flex items-center gap-1"
              style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Timer size={9} /> {formatTime(elapsed)}
            </div>
            <div className="flex-1 relative h-3.5 rounded-r-full overflow-hidden bg-black/70" style={{ border: "1px solid rgba(214,51,255,0.4)" }}>
              <motion.div className="absolute inset-y-0 left-0" initial={false} animate={{ width: `${aiHp.pct}%` }} transition={{ duration: 0.4 }}
                style={{ background: "linear-gradient(90deg,#d633ff,#a21caf)", boxShadow: "0 0 10px #d633ffaa" }} />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-white tabular-nums" style={{ textShadow: "0 1px 2px #000" }}>{Math.round(aiHp.pct)}%</span>
            </div>
          </div>
          <div className="flex items-start justify-between mt-1.5 gap-4">
            <SynergyChips list={playerSynergies} color="#22d3ee" align="left" />
            <SynergyChips list={aiSynergies} color="#d633ff" align="right" />
          </div>
        </div>

        {/* ─── TACTICAL HEX GRID (very low opacity) ─── */}
        <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none" style={{ opacity: 0.07 }}>
          <defs>
            <pattern id="clash-hex" width="56" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
              <path d="M14 0 L42 0 L56 24 L42 48 L14 48 L0 24 Z" fill="none" stroke={theme.accent} strokeWidth="1" />
            </pattern>
            <radialGradient id="clash-hex-fade" cx="50%" cy="48%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="clash-hex-mask"><rect width="100%" height="100%" fill="url(#clash-hex-fade)" /></mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#clash-hex)" mask="url(#clash-hex-mask)" />
        </svg>

        {/* ─── DECORATIVE ARENA FRAME ─── */}
        <div className="absolute inset-2 sm:inset-3 z-[25] pointer-events-none rounded-xl"
          style={{ border: `1.5px solid ${theme.accent}55`, boxShadow: `inset 0 0 40px ${theme.accent}1a, inset 0 0 4px ${theme.accent}33` }}>
          {/* paneled tick marks along top & bottom edges */}
          <div className="absolute -top-px left-6 right-6 h-[3px] flex justify-between opacity-70">
            {[...Array(20)].map((_, i) => (
              <span key={`t${i}`} style={{ width: 8, height: 3, background: i % 2 ? `${theme.accent}88` : `${theme.accent}22` }} />
            ))}
          </div>
          <div className="absolute -bottom-px left-6 right-6 h-[3px] flex justify-between opacity-70">
            {[...Array(20)].map((_, i) => (
              <span key={`b${i}`} style={{ width: 8, height: 3, background: i % 2 ? `${theme.accent}88` : `${theme.accent}22` }} />
            ))}
          </div>
          {/* glowing corner brackets */}
          {[
            "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
          ].map((pos, i) => (
            <div key={i} className={`absolute w-7 h-7 ${pos}`}
              style={{ borderColor: theme.accent, filter: `drop-shadow(0 0 5px ${theme.accent})` }} />
          ))}
        </div>

        {/* ─── RICH ARENA BACKGROUND ─── */}

        {/* Deep layered background gradient (Overlay to darken) */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 120%, ${theme.accent}22 0%, rgba(5,5,16,0.6) 80%), radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.1) 0%, transparent 40%), radial-gradient(ellipse at 80% 20%, rgba(214,51,255,0.1) 0%, transparent 40%)` }} />

        {/* perspective grid floor overlay */}
        <div className="absolute inset-0 [perspective:1200px] overflow-hidden pointer-events-none z-0">
          <div className="absolute left-1/2 bottom-[-25%] h-[150%] w-[260%] -translate-x-1/2 origin-bottom [transform:rotateX(75deg)] opacity-70"
            style={{
              backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
              backgroundSize: "46px 46px",
              maskImage: "radial-gradient(ellipse at 50% 45%, black 10%, transparent 60%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 10%, transparent 60%)",
            }} />
        </div>

        {/* Arena floor ring — glowing circle at the center "impact zone" */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <motion.div className="rounded-full"
            style={{ width: 280, height: 280, border: `1px solid ${theme.accent}22`, boxShadow: `inset 0 0 60px ${theme.accent}11, 0 0 40px ${theme.accent}0d` }}
            animate={{ scale: [1, 1.03, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <motion.div className="rounded-full"
            style={{ width: 200, height: 200, border: `1px solid ${theme.accent}18` }}
            animate={{ scale: [1, 0.97, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
        </div>

        {/* Player side energy pillar */}
        <div className="absolute left-[6%] top-[10%] bottom-[10%] w-[3px] pointer-events-none overflow-hidden rounded-full">
          <motion.div className="absolute inset-0" 
            style={{ background: `linear-gradient(180deg, transparent 0%, #22d3ee44 30%, #22d3ee88 50%, #22d3ee44 70%, transparent 100%)` }}
            animate={{ y: ["-20%", "20%", "-20%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <motion.div className="absolute left-[6%] top-[8%] w-5 h-5 rounded-full pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8], boxShadow: ["0 0 10px #22d3ee44", "0 0 24px #22d3ee88", "0 0 10px #22d3ee44"] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)", filter: "blur(3px)" }} />

        {/* AI side energy pillar */}
        <div className="absolute right-[6%] top-[10%] bottom-[10%] w-[3px] pointer-events-none overflow-hidden rounded-full">
          <motion.div className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 0%, #d633ff44 30%, #d633ff88 50%, #d633ff44 70%, transparent 100%)` }}
            animate={{ y: ["20%", "-20%", "20%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <motion.div className="absolute right-[6%] top-[8%] w-5 h-5 rounded-full pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8], boxShadow: ["0 0 10px #d633ff44", "0 0 24px #d633ff88", "0 0 10px #d633ff44"] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          style={{ background: "radial-gradient(circle, #d633ff, transparent)", filter: "blur(3px)" }} />

        {/* team floor glows (larger, more atmospheric) */}
        <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-2/5 h-3/4 rounded-[50%] blur-[70px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.12), transparent 70%)" }} />
        <div className="absolute right-[0%] top-1/2 -translate-y-1/2 w-2/5 h-3/4 rounded-[50%] blur-[70px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(214,51,255,0.12), transparent 70%)" }} />

        {/* Atmospheric fog layers */}
        <motion.div className="absolute inset-0 pointer-events-none z-0"
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: `radial-gradient(ellipse at 30% 70%, ${theme.accent}15, transparent 50%)` }} />
        <motion.div className="absolute inset-0 pointer-events-none z-0"
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          style={{ background: `radial-gradient(ellipse at 70% 30%, ${theme.accent}12, transparent 50%)` }} />

        {/* center divider — the "Impact Zone" line */}
        <div className="absolute left-1/2 top-[8%] bottom-[8%] w-[2px] -translate-x-1/2 z-0"
          style={{ background: `linear-gradient(180deg, transparent, ${theme.accent}55, ${theme.accent}55, transparent)`, boxShadow: `0 0 16px ${theme.accent}44` }} />

        {/* VS badge at center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none">
          <motion.div className="w-14 h-14 rounded-full flex items-center justify-center"
            animate={{ boxShadow: [`0 0 20px ${theme.accent}33`, `0 0 40px ${theme.accent}55`, `0 0 20px ${theme.accent}33`] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${theme.accent}44`, backdropFilter: "blur(8px)" }}>
            <span className="text-sm font-black italic" style={{ color: `${theme.accent}66` }}>VS</span>
          </motion.div>
        </div>

        {/* Floating embers / particles (varied sizes, more of them) */}
        {[...Array(14)].map((_, i) => {
          const size = 1 + (i % 3);
          const isPlayer = i < 7;
          const color = isPlayer ? "#22d3ee" : "#d633ff";
          return (
            <motion.div key={i} className="absolute rounded-full pointer-events-none"
              style={{ width: size, height: size, left: `${8 + i * 6}%`, bottom: `${5 + (i % 5) * 8}%`, background: color, boxShadow: `0 0 ${size * 3}px ${color}88` }}
              animate={{ y: [0, -80 - (i % 4) * 25, 0], x: [0, (i % 2 ? 12 : -12), 0], opacity: [0, 0.6, 0] }}
              transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
          );
        })}

        {/* Dark vignette edges for depth */}
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,5,16,0.7) 100%)" }} />

        {/* clash flash on attack */}
        <AnimatePresence>
          {flashColor && (
            <motion.div key={`flash-${step}`} className="absolute inset-0 pointer-events-none z-[1]"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{ background: `radial-gradient(ellipse at 50% 50%, ${flashColor}88, transparent 55%)` }} />
          )}
        </AnimatePresence>

        {/* ── Impact VFX at center (class-based) ── */}
        <AnimatePresence>
          {showImpact && actorFighter && curLog?.damage && (
            <ImpactVFX unitClass={actorFighter.unitClass} side={actorSide} step={step} />
          )}
        </AnimatePresence>

        {/* ── Ability banner (center overlay on SPECIAL) ── */}
        <AnimatePresence>
          {showAbilityBanner && (
            <motion.div key={`ability-${step}`} className="absolute left-1/2 top-[22%] -translate-x-1/2 z-40 pointer-events-none text-center"
              initial={{ opacity: 0, scale: 0.6, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.25, y: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}>
              <div className="flex items-center gap-2 px-6 py-2.5 rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${abilityColor}ee, ${abilityColor}88)`, border: `1px solid ${abilityColor}`, boxShadow: `0 0 36px ${abilityColor}aa` }}>
                <Sparkles size={22} className="text-white" />
                <span className="text-2xl font-heading font-black uppercase tracking-[0.15em] text-white"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{abilityName}</span>
                <Sparkles size={22} className="text-white" />
              </div>
              <motion.div className="mt-1.5 text-sm font-bold uppercase tracking-widest"
                style={{ color: abilityColor }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {actorFighter?.unitClass} · {actorFighter?.card.name}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CRITICAL overlay ── */}
        <AnimatePresence>
          {showCrit && (
            <motion.div key={`crit-${step}`} className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <motion.span className="text-6xl sm:text-7xl font-heading font-black uppercase italic text-yellow-300"
                initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
                animate={{ scale: [0.3, 1.35, 1.1], opacity: [0, 1, 1, 0], rotate: [-12, 5, 0] }}
                transition={{ duration: 0.85, times: [0, 0.3, 0.65, 1], ease: "easeOut" }}
                style={{ textShadow: "0 0 34px rgba(255,200,0,0.95), 0 4px 16px rgba(0,0,0,1)", WebkitTextStroke: "2px rgba(255,80,80,0.55)" }}>
                CRITICAL
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTION CALLOUT (who hits whom) ── */}
        <AnimatePresence mode="wait">
          {actionCallout && (
            <motion.div key={`callout-${step}`} className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap"
                style={{
                  background: "rgba(5,5,18,0.85)",
                  border: `1px solid ${actionCallout.tone === "crit" ? "#f7c948" : actionCallout.tone === "miss" ? "#64748b" : actionCallout.tone === "heal" ? "#22c55e" : `${theme.accent}66`}`,
                  boxShadow: `0 0 18px ${actionCallout.tone === "crit" ? "#f7c94855" : "rgba(0,0,0,0.6)"}`,
                  backdropFilter: "blur(6px)",
                }}>
                <span className="text-sm font-black" style={{ color: actionCallout.actorIsPlayer ? "#22d3ee" : "#d633ff" }}>{actionCallout.actor}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: actionCallout.tone === "crit" ? "#f7c948" : actionCallout.tone === "miss" ? "#94a3b8" : actionCallout.tone === "heal" ? "#4ade80" : "#fff" }}>
                  {actionCallout.verb}
                </span>
                <span className="text-sm font-black" style={{ color: actionCallout.target === actionCallout.actor ? (actionCallout.actorIsPlayer ? "#22d3ee" : "#d633ff") : actionCallout.actorIsPlayer ? "#d633ff" : "#22d3ee" }}>{actionCallout.target}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMBO counter (top-right) ── */}
        <AnimatePresence>
          {showCombo && (
            <motion.div key={`combo-${combo}`} className="absolute top-3 right-4 z-40 pointer-events-none text-right"
              initial={{ opacity: 0, scale: 0.5, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400, damping: 16 }}>
              <div className="text-3xl sm:text-4xl font-heading font-black italic"
                style={{ color: combo >= 6 ? "#fb7185" : combo >= 4 ? "#f59e0b" : "#22d3ee", textShadow: "0 0 18px currentColor, 0 3px 8px rgba(0,0,0,1)" }}>
                {combo}<span className="text-base ml-0.5">COMBO</span>
              </div>
              {combo >= 5 && <div className="text-[10px] font-black uppercase tracking-widest text-yellow-300">Unstoppable!</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ROUND MVP ticker (top-left) ── */}
        <AnimatePresence>
          {roundMvp && (
            <motion.div key={`rmvp-${roundMvp.seq}`} className="absolute top-3 left-4 z-40 pointer-events-none"
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${theme.accent}66`, boxShadow: `0 0 16px ${theme.accent}44` }}>
                <Crown size={14} style={{ color: theme.accent }} />
                <div className="leading-tight">
                  <div className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Round {roundMvp.round} MVP</div>
                  <div className="text-xs font-bold text-white">{roundMvp.name} <span className="font-mono" style={{ color: theme.accent }}>· {roundMvp.dmg}</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── KO / ELIMINATED banner ── */}
        <AnimatePresence>
          {ko && (
            <motion.div key={`ko-${ko.seq}`} className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              {/* red flash overlay */}
              <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 0.7 }}
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,40,40,0.6), transparent 60%)" }} />
              {/* KO text */}
              <motion.div initial={{ scale: 0.3, rotate: -10, opacity: 0 }} animate={{ scale: [0.3, 1.2, 1], rotate: [-10, 3, 0], opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="text-center">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <Skull size={32} className="text-red-500" />
                  <div className="text-5xl sm:text-6xl font-heading font-black uppercase tracking-[0.2em] text-red-500"
                    style={{ textShadow: "0 0 30px rgba(255,40,40,0.9), 0 4px 16px rgba(0,0,0,1)", WebkitTextStroke: "1px rgba(255,255,255,0.25)" }}>
                    ELIMINATED
                  </div>
                  <Skull size={32} className="text-red-500" />
                </div>
                <motion.div className="text-lg font-bold text-white/90 uppercase tracking-[0.3em]"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  {ko.name}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 3-ZONE LAYOUT (formation slots · center stage · formation slots) ═══ */}

        {/* Player FORMATION (far left) */}
        <div className="relative z-10 w-[20%] flex flex-col items-center justify-center gap-3 px-1">
          {playerTeam.map((f, i) => renderFormationSlot(f, "player", i))}
        </div>

        {/* CENTER STAGE (60% — the duel zone) */}
        <div className="relative z-10 flex-1 flex items-center justify-center gap-6 sm:gap-12 px-2">
          {/* Active Player Fighter */}
          <div className="flex-1 flex items-center justify-end">
            <AnimatePresence mode="wait">
              {activePlayerFighter && renderActiveCard(activePlayerFighter, "player")}
            </AnimatePresence>
          </div>

          {/* Active AI Fighter */}
          <div className="flex-1 flex items-center justify-start">
            <AnimatePresence mode="wait">
              {activeAIFighter && renderActiveCard(activeAIFighter, "ai")}
            </AnimatePresence>
          </div>
        </div>

        {/* AI FORMATION (far right) */}
        <div className="relative z-10 w-[20%] flex flex-col items-center justify-center gap-3 px-1">
          {aiTeam.map((f, i) => renderFormationSlot(f, "ai", i))}
        </div>
      </motion.div>

      {/* ═══ CONTROL STRIP ═══ */}
      <div className="relative z-30 shrink-0 flex items-center justify-between px-4 py-2"
        style={{ background: "linear-gradient(0deg, #0a0a1e, #0d0d28)", borderTop: `1px solid ${theme.accent}33` }}>
        
        {/* Round counter */}
        <div className="px-3 py-1 rounded-lg" style={{ background: "rgba(20,20,50,0.8)", border: "1px solid rgba(108,92,231,0.25)" }}>
          <span className="text-sm font-heading font-black text-white tracking-wider">
            Round {turn}
          </span>
        </div>

        {/* Turn preview: the actual next attacker + speed-order queue */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: "rgba(20,20,50,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {nextActor ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: `${nextActor.isPlayer ? "#22d3ee" : "#d633ff"}22`, border: `1px solid ${nextActor.isPlayer ? "#22d3ee" : "#d633ff"}66`, color: nextActor.isPlayer ? "#22d3ee" : "#d633ff" }}>
              <span className="text-[8px] uppercase tracking-widest opacity-60">Next</span> {nextActor.name}
            </span>
          ) : (
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Initiative</span>
          )}
          <span className="text-white/15">|</span>
          {turnOrder.slice(0, 3).map((f) => {
            const isPlayer = playerTeam.some(p => p.name === f.name);
            const col = isPlayer ? "#22d3ee" : "#d633ff";
            return (
              <span key={f.id} className="flex items-center gap-1 text-[8px] font-bold" style={{ color: `${col}aa` }}>
                {f.name.split(" ").pop()}<span className="text-white/25 text-[7px]">S{f.card.speed}</span>
              </span>
            );
          })}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {!finished && (
            <button onClick={() => setPlaying((p) => !p)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #6C5CE7, #a855f7)", boxShadow: "0 0 14px rgba(108,92,231,0.5)" }}>
              {playing ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
            </button>
          )}
          {!finished && (
            <button onClick={() => setStep((s) => Math.min(logs.length, s + 1))} title="Next action"
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <SkipForward size={15} className="text-white/60" />
            </button>
          )}
          {!finished && (
            <button onClick={() => setStep(logs.length)} title="Skip to end"
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <FastForward size={15} className="text-white/50" />
            </button>
          )}

          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(108,92,231,0.25)", background: "rgba(0,0,0,0.35)" }}>
            {SPEEDS.map((s) => (
              <button key={s.label} onClick={() => setSpeedMs(s.ms)} className="px-2.5 py-1.5 text-[11px] font-bold transition-all"
                style={{
                  background: speedMs === s.ms ? "linear-gradient(135deg, #6C5CE7, #a855f7)" : "transparent",
                  color: speedMs === s.ms ? "#fff" : "rgba(255,255,255,0.35)",
                }}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM PANEL: squad · log · enemy ═══ */}
      <div className="relative z-30 shrink-0 flex-[20] min-h-0 grid grid-cols-[1fr_1.1fr_1fr] gap-px"
        style={{ background: "rgba(255,255,255,0.06)", borderTop: `1px solid ${theme.accent}33` }}>
        {/* My squad */}
        <div className="flex flex-col min-h-0 p-2 pt-0" style={{ background: "#0a0a1c" }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1.5 shrink-0 rounded-b-lg"
            style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.15), transparent)", borderBottom: "1px solid rgba(34,211,238,0.3)" }}>
            <Shield size={12} className="text-cyan-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">My Squad</span>
          </div>
          <div className="flex-1 min-h-0">{renderRoster(playerTeam, "player")}</div>
        </div>

        {/* Battle log */}
        <div className="flex flex-col min-h-0" style={{ background: "#080814" }}>
          <div className="flex items-center justify-center gap-1.5 py-1.5 shrink-0"
            style={{ background: `linear-gradient(180deg, ${theme.accent}1a, transparent)`, borderBottom: `1px solid ${theme.accent}33` }}>
            <ScrollText size={12} style={{ color: theme.accent }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.accent }}>Battle Log</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <BattleLog logs={logs} visibleCount={step} />
          </div>
        </div>

        {/* Enemy squad */}
        <div className="flex flex-col min-h-0 p-2 pt-0" style={{ background: "#0a0a1c" }}>
          <div className="flex items-center justify-end gap-1.5 px-2 py-1.5 mb-1.5 shrink-0 rounded-b-lg"
            style={{ background: "linear-gradient(180deg, rgba(214,51,255,0.15), transparent)", borderBottom: "1px solid rgba(214,51,255,0.3)" }}>
            <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">Enemy (AI)</span>
            <Zap size={12} className="text-fuchsia-300" />
          </div>
          <div className="flex-1 min-h-0">{renderRoster(aiTeam, "ai")}</div>
        </div>
      </div>

      {/* ═══ PRE-BATTLE SCREEN ═══ */}
      <AnimatePresence>
        {!started && !finished && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xl rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(180deg,#12122a,#0a0a1c)", border: `1px solid ${theme.accent}55`, boxShadow: `0 0 60px ${theme.glow}` }}>
              {/* header */}
              <div className="text-center px-6 pt-6 pb-4" style={{ background: `linear-gradient(180deg, ${theme.accent}22, transparent)` }}>
                <div className="text-2xl font-heading font-black uppercase tracking-widest" style={{ color: theme.accent }}>{theme.name}</div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/40 mt-1">{theme.sub}</div>
              </div>

              {/* power vs */}
              <div className="grid grid-cols-3 items-center px-6 py-4">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Your Power</div>
                  <div className="text-3xl font-black text-cyan-300 tabular-nums">{playerPower}</div>
                  <div className="text-[10px] text-white/40 mt-1">{playerTeam.length} Units</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-heading font-black text-white/60">VS</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Enemy Power</div>
                  <div className="text-3xl font-black text-fuchsia-300 tabular-nums">{aiPower}</div>
                  <div className="text-[10px] text-white/40 mt-1">{aiTeam.length} Units</div>
                </div>
              </div>

              {/* win chance */}
              <div className="px-6 pb-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest mb-1">
                  <span className="text-cyan-300 font-bold">Win Chance {winChance}%</span>
                  <span className="text-fuchsia-300 font-bold">{100 - winChance}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-black/50 flex">
                  <div style={{ width: `${winChance}%`, background: "linear-gradient(90deg,#22d3ee,#0ea5e9)" }} />
                  <div style={{ width: `${100 - winChance}%`, background: "linear-gradient(90deg,#a21caf,#d633ff)" }} />
                </div>
              </div>

              {/* synergies */}
              <div className="grid grid-cols-2 gap-3 px-6 py-3">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Your Synergies</div>
                  <SynergyChips list={playerSynergies} color="#22d3ee" align="left" />
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5 text-right">Enemy Synergies</div>
                  <SynergyChips list={aiSynergies} color="#d633ff" align="right" />
                </div>
              </div>

              {/* start */}
              <div className="px-6 pb-6 pt-2 flex gap-3">
                <button onClick={onExit}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Retreat
                </button>
                <button onClick={() => setStarted(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${theme.accent}, #a855f7)`, boxShadow: `0 0 24px ${theme.glow}` }}>
                  <Crown size={18} /> Start Battle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ VICTORY / DEFEAT SPLASH ═══ */}
      <AnimatePresence>
        {showSplash && (() => {
          const win = battleData.result === "WIN";
          const draw = battleData.result === "DRAW";
          const col = win ? "#34d399" : draw ? "#fbbf24" : "#ef4444";
          const label = win ? "VICTORY" : draw ? "DRAW" : "DEFEAT";
          return (
            <motion.div className="absolute inset-0 z-[55] flex items-center justify-center pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
              {/* sweep beam */}
              <motion.div className="absolute h-full w-1/3 -skew-x-12"
                style={{ background: `linear-gradient(90deg, transparent, ${col}33, transparent)` }}
                initial={{ x: "-150%" }} animate={{ x: "350%" }} transition={{ duration: 0.9, ease: "easeOut" }} />
              <motion.div className="relative text-center"
                initial={{ scale: 0.4, opacity: 0, y: 20 }} animate={{ scale: [0.4, 1.15, 1], opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}>
                <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: `${col}55` }} />
                <div className="relative text-7xl sm:text-8xl font-heading font-black uppercase tracking-[0.18em]"
                  style={{ color: col, textShadow: `0 0 50px ${col}, 0 6px 20px rgba(0,0,0,1)`, WebkitTextStroke: "2px rgba(255,255,255,0.15)" }}>
                  {label}
                </div>
                {win && battleData.mvp?.name && (
                  <motion.div className="mt-3 flex items-center justify-center gap-2 text-white/80"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Crown size={18} style={{ color: col }} />
                    <span className="text-sm font-bold uppercase tracking-widest">MVP · {battleData.mvp.name}</span>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Result */}
      {finished && showResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <BattleResult result={battleData.result} eloChange={battleData.eloChange ?? 0}
            turns={turn} playerDamageDealt={battleData.playerDamageDealt ?? 0}
            playerDamageTaken={battleData.playerDamageTaken ?? 0} mvpName={battleData.mvp?.name}
            criticals={logs.filter((l) => l.isCritical).length}
            eloRating={battleData.eloRating ?? 1000} totalBattles={battleData.totalBattles ?? 0}
            onBack={onExit} />
        </div>
      )}
    </div>
  );
}
