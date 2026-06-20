"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, FastForward, Swords, Shield, Zap, Timer, Settings, Crosshair, Wand, Heart } from "lucide-react";
import { BattleFighter, type FighterEvent } from "./BattleFighter";

const ICON_MAP: Record<string, any> = { Shield, Crosshair, Wand, Heart, Swords };
import { BattleLog } from "./BattleLog";
import { BattleResult } from "./BattleResult";
import { BATTLE_HEALTH_MULTIPLIER } from "@/engine/balance";
import { deriveUnitClass, getClassRow, getUnitClassInfo } from "@/engine/unitClass";
import { factionStyle } from "@/lib/cosmetics";
import type { CardDisplay as CardType } from "@/types/card";

interface BattleArenaProps {
  battleData: any;
  onExit: () => void;
}

interface Fighter {
  id: string;
  name: string;
  card: CardType;
  maxHp: number;
  row: number; // 0=front, 1=mid, 2=back
}

const SPEEDS = [
  { label: "0.5x", ms: 1500 },
  { label: "1x", ms: 900 },
  { label: "2x", ms: 450 },
  { label: "4x", ms: 220 },
];


function buildTeam(cards: CardType[], prefix: string, nameMap: Map<string, string>): Fighter[] {
  return cards.map((c) => {
    let finalName = c.name;
    if (!finalName || finalName.startsWith("#")) {
      const ci = getUnitClassInfo(c);
      const factionTitle = c.faction !== "NONE" ? c.faction : "VOID";
      // Title case e.g., "Athena Tank"
      finalName = `${factionTitle} ${ci.label}`.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    nameMap.set(c.name, finalName);
    return {
      id: `${prefix}-${c.id}`,
      name: finalName,
      card: { ...c, name: finalName },
      maxHp: c.health * BATTLE_HEALTH_MULTIPLIER,
      row: getClassRow(deriveUnitClass(c)),
    };
  });
}

export function BattleArena({ battleData, onExit }: BattleArenaProps) {
  const rawLogs: any[] = battleData.logs || [];

  const { playerTeam, aiTeam, nameMap } = useMemo(() => {
    const map = new Map<string, string>();
    const p = buildTeam(battleData.playerTeam || battleData.deck?.deckCards?.map((d: any) => d.card) || [], "P", map);
    const a = buildTeam(battleData.aiTeam || [], "A", map);
    return { playerTeam: p, aiTeam: a, nameMap: map };
  }, [battleData]);

  const logs = useMemo(() => {
    return rawLogs.map(l => ({
      ...l,
      actorName: l.actorName ? (nameMap.get(l.actorName) || l.actorName) : l.actorName,
      targetName: l.targetName ? (nameMap.get(l.targetName) || l.targetName) : l.targetName,
    }));
  }, [rawLogs, nameMap]);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(900);
  const [shake, setShake] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const finished = step >= logs.length;

  useEffect(() => {
    if (!playing || finished) return;
    const t = setTimeout(() => setStep((s) => s + 1), speedMs);
    return () => clearTimeout(t);
  }, [playing, finished, speedMs, step]);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  useEffect(() => {
    const log = logs[step - 1];
    if (log && (log.isCritical || log.actionType === "SPECIAL")) setShake((n) => n + 1);
  }, [step, logs]);

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

  const eventFor = (name: string): FighterEvent | null => {
    const l = logs[step - 1];
    if (!l) return null;
    if (l.actorName === name) {
      if (l.actionType === "SPECIAL") return { seq: step, kind: "special", amount: l.damage || 0, isCritical: !!l.isCritical };
      if (l.actionType === "ATTACK" && l.damage) return { seq: step, kind: "attack", amount: l.damage, isCritical: !!l.isCritical };
      if (l.actionType === "HEAL") return { seq: step, kind: "heal", amount: l.healing || 0, isCritical: false };
    }
    if (l.targetName === name && l.damage) return { seq: step, kind: "hit", amount: l.damage, isCritical: !!l.isCritical };
    return null;
  };

  const turn = logs[step - 1]?.turnNumber ?? 0;
  const curLog = logs[step - 1];
  const flashColor = curLog?.isCritical ? "#FF4757" : curLog?.actionType === "SPECIAL" ? "#8B5CF6" : null;

  const playerAlive = playerTeam.filter(f => !deadByName[f.name]).length;
  const aiAlive = aiTeam.filter(f => !deadByName[f.name]).length;
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Detect dominant faction for each team
  const dominantFaction = (team: Fighter[]) => {
    const counts: Record<string, number> = {};
    team.forEach(f => { counts[f.card.faction] = (counts[f.card.faction] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "NONE";
  };
  const playerFaction = factionStyle(dominantFaction(playerTeam));
  const aiFaction = factionStyle(dominantFaction(aiTeam));


  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden rounded-2xl"
      style={{
        background: "#050510",
        boxShadow: "0 0 80px rgba(108,92,231,0.12), 0 0 2px rgba(0,200,255,0.2)",
        border: "1px solid rgba(0,200,255,0.12)",
      }}>

      {/* ═══ TOP HUD ═══ */}
      <div className="relative z-30 shrink-0" style={{
        background: "linear-gradient(180deg, #1a1a3e 0%, #0d0d25 60%, #080818 100%)",
        borderBottom: "1px solid rgba(0,200,255,0.15)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 30px rgba(0,0,0,0.5)",
      }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.2), rgba(108,92,231,0.3), rgba(0,200,255,0.2), transparent)" }} />

        <div className="flex items-center justify-between px-5 py-2.5">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6C5CE7, #a855f7)", boxShadow: "0 0 15px rgba(108,92,231,0.5)" }}>
              <Swords size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-heading font-black uppercase tracking-[0.2em]"
                style={{ background: "linear-gradient(90deg, #c084fc, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                GALACTIC GIGLINGS
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.3em]" style={{ color: "rgba(0,200,255,0.5)" }}>
                {battleData.arenaTier} ARENA
              </div>
            </div>
          </div>

          {/* Center: Score + Turn */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: `${playerFaction.color}15`, border: `1px solid ${playerFaction.color}33` }}>
              <Shield size={13} style={{ color: playerFaction.color }} />
              <span className="text-sm font-black text-white tabular-nums">{playerAlive}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="px-4 py-0.5 rounded-lg" style={{ background: "rgba(20,20,50,0.8)", border: "1px solid rgba(108,92,231,0.25)" }}>
                <span className="text-lg font-heading font-black text-white tracking-wider">TURN {turn}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-mono" style={{ color: "rgba(0,200,255,0.4)" }}>
                <Timer size={9} /><span className="tabular-nums">{formatTime(elapsed)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: `${aiFaction.color}15`, border: `1px solid ${aiFaction.color}33` }}>
              <Zap size={13} style={{ color: aiFaction.color }} />
              <span className="text-sm font-black text-white tabular-nums">{aiAlive}</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(108,92,231,0.2)", background: "rgba(0,0,0,0.35)" }}>
              {SPEEDS.map((s) => (
                <button key={s.label} onClick={() => setSpeedMs(s.ms)}
                  className="px-2.5 py-1 text-[10px] font-bold transition-all"
                  style={{
                    background: speedMs === s.ms ? "linear-gradient(135deg, #6C5CE7, #a855f7)" : "transparent",
                    color: speedMs === s.ms ? "#fff" : "rgba(255,255,255,0.3)",
                    boxShadow: speedMs === s.ms ? "0 0 10px rgba(108,92,231,0.5)" : "none",
                  }}>{s.label}</button>
              ))}
            </div>
            {!finished && (
              <>
                <button onClick={() => setPlaying((p) => !p)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.2)" }}>
                  {playing ? <Pause size={13} className="text-cyan-300" /> : <Play size={13} className="text-cyan-300" />}
                </button>
                <button onClick={() => setStep(logs.length)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <FastForward size={13} className="text-white/30" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BATTLEFIELD ═══ */}
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -8, 8, -5, 5, 0], y: [0, 4, -4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative flex-1 overflow-hidden flex flex-col"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(8,8,35,1), #050510)" }}
      >
        {/* Neon edge strips */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] z-20" style={{ background: "linear-gradient(180deg, rgba(0,200,255,0.5), rgba(108,92,231,0.2), rgba(0,200,255,0.5))", boxShadow: "0 0 8px rgba(0,200,255,0.3), 0 0 20px rgba(0,200,255,0.1)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-[2px] z-20" style={{ background: "linear-gradient(180deg, rgba(0,200,255,0.5), rgba(108,92,231,0.2), rgba(0,200,255,0.5))", boxShadow: "0 0 8px rgba(0,200,255,0.3), 0 0 20px rgba(0,200,255,0.1)" }} />

        {/* Hexagonal grid floor */}
        <div className="absolute inset-0 [perspective:1600px] overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 bottom-[-30%] h-[180%] w-[350%] -translate-x-1/2 origin-bottom [transform:rotateX(74deg)]"
            style={{
              backgroundImage: "linear-gradient(rgba(108,92,231,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,0.2) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at 50% 42%, black 10%, transparent 65%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 42%, black 10%, transparent 65%)",
            }} />
          {/* Brighter lane lines */}
          <div className="absolute left-1/2 bottom-[-30%] h-[180%] w-[350%] -translate-x-1/2 origin-bottom [transform:rotateX(74deg)]"
            style={{
              backgroundImage: "linear-gradient(rgba(0,200,255,0.2) 2px, transparent 2px)",
              backgroundSize: "48px 144px",
              backgroundPosition: "0 72px",
              maskImage: "radial-gradient(ellipse at 50% 42%, black 5%, transparent 40%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 42%, black 5%, transparent 40%)",
            }} />
        </div>

        {/* Neon playfield frame (cyan player glow bottom, magenta enemy glow top) */}
        <div className="absolute inset-x-4 inset-y-3 rounded-[20px] pointer-events-none z-0"
          style={{
            border: "2px solid rgba(214,51,255,0.45)",
            boxShadow:
              "0 0 34px rgba(214,51,255,0.22), inset 0 -90px 120px rgba(34,211,238,0.10), inset 0 90px 120px rgba(214,51,255,0.12)",
          }} />
        {/* Bright top edge (enemy / magenta) */}
        <div className="absolute left-4 right-4 top-3 h-[2px] rounded-full z-0"
          style={{ background: "linear-gradient(90deg, transparent, #d633ff, transparent)", boxShadow: "0 0 12px #d633ff" }} />
        {/* Bright bottom edge (player / cyan) */}
        <div className="absolute left-4 right-4 bottom-3 h-[2px] rounded-full z-0"
          style={{ background: "linear-gradient(90deg, transparent, #22d3ee, transparent)", boxShadow: "0 0 12px #22d3ee" }} />
        {/* Team floor glows */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[4%] w-2/3 h-1/3 rounded-[50%] blur-[40px] pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.18), transparent 70%)" }} />
        <div className="absolute left-1/2 -translate-x-1/2 top-[4%] w-2/3 h-1/3 rounded-[50%] blur-[40px] pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(214,51,255,0.18), transparent 70%)" }} />

        {/* Center battle line with glow */}
        <div className="absolute left-0 right-0 top-[49%] pointer-events-none z-0">
          <div className="h-[2px] mx-6" style={{ background: "linear-gradient(90deg, transparent, rgba(108,92,231,0.4), rgba(0,200,255,0.3), rgba(108,92,231,0.4), transparent)" }} />
          <div className="h-6 -mt-3 mx-6" style={{ background: "linear-gradient(90deg, transparent, rgba(108,92,231,0.04), rgba(0,200,255,0.03), rgba(108,92,231,0.04), transparent)", filter: "blur(6px)" }} />
        </div>


        {/* Flash */}
        <AnimatePresence>
          {flashColor && (
            <motion.div key={`flash-${step}`} className="absolute inset-0 pointer-events-none z-0"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0] }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              style={{ background: `radial-gradient(ellipse at 50% 50%, ${flashColor}88, transparent 50%)` }} />
          )}
        </AnimatePresence>

        {/* Team labels */}
        <div className="absolute top-3 left-4 z-20">
          <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5"
            style={{ background: `${aiFaction.color}12`, border: `1px solid ${aiFaction.color}25`, color: `${aiFaction.color}cc` }}>
            <Zap size={10} /> OPPONENT
          </div>
        </div>
        <div className="absolute bottom-3 left-4 z-20">
          <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5"
            style={{ background: `${playerFaction.color}12`, border: `1px solid ${playerFaction.color}25`, color: `${playerFaction.color}cc` }}>
            <Shield size={10} /> YOUR SQUAD
          </div>
        </div>

        {/* Ghost VS */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 select-none">
          <span className="text-[10rem] font-heading font-black italic" style={{ color: "rgba(255,255,255,0.012)" }}>VS</span>
        </div>

        {/* ═══ AI HALF (top) — single row ═══ */}
        <div className="flex-1 flex items-center justify-center gap-6 sm:gap-12 lg:gap-16 relative z-10 px-4 pb-2">
          {aiTeam.map(f => (
            <BattleFighter key={f.id} card={f.card} side="ai" maxHealth={f.maxHp}
              currentHealth={hpByName[f.name] ?? f.maxHp} isDead={!!deadByName[f.name]} event={eventFor(f.name)} />
          ))}
        </div>

        {/* ═══ PLAYER HALF (bottom) — single row ═══ */}
        <div className="flex-1 flex items-center justify-center gap-6 sm:gap-12 lg:gap-16 relative z-10 px-4 pt-2">
          {playerTeam.map(f => (
            <BattleFighter key={f.id} card={f.card} side="player" maxHealth={f.maxHp}
              currentHealth={hpByName[f.name] ?? f.maxHp} isDead={!!deadByName[f.name]} event={eventFor(f.name)} />
          ))}
        </div>
      </motion.div>

      {/* ═══ BOTTOM PANEL ═══ */}
      <div className="relative z-30 shrink-0 flex" style={{
        background: "linear-gradient(0deg, #0a0a1e, #0d0d28)",
        borderTop: "1px solid rgba(0,200,255,0.12)",
        minHeight: "110px",
      }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.15), rgba(108,92,231,0.2), rgba(0,200,255,0.15), transparent)" }} />

        {/* Left: Player team */}
        <div className="flex-1 p-3 flex flex-col gap-1.5">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5" style={{ color: `${playerFaction.color}88` }}>
            <Shield size={10} /> YOUR SQUAD
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {playerTeam.map((f) => {
              const hp = hpByName[f.name] ?? f.maxHp;
              const dead = !!deadByName[f.name];
              const ci = getUnitClassInfo(f.card);
              const hpP = Math.max(0, (hp / f.maxHp) * 100);
              const ClassIcon = ICON_MAP[ci.icon] || Swords;
              return (
                <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg min-w-[130px] shrink-0 transition-opacity"
                  style={{
                    background: dead ? "rgba(255,255,255,0.02)" : `linear-gradient(135deg, ${playerFaction.color}08, ${playerFaction.color}03)`,
                    border: dead ? "1px solid rgba(255,255,255,0.03)" : `1px solid ${playerFaction.color}15`,
                    opacity: dead ? 0.3 : 1,
                  }}>
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {f.card.imageUrl ? <img src={f.card.imageUrl} alt="" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} /> : <span className="text-[8px] text-white/15">?</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 text-white/60"><ClassIcon size={10} /></span>
                      <span className="text-[9px] font-bold text-white/85 truncate">{f.card.name}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mt-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{
                        width: `${hpP}%`,
                        background: hpP > 50 ? "#22c55e" : hpP > 20 ? "#eab308" : "#ef4444",
                      }} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7px] font-mono text-white/30">⚔{f.card.attack}</span>
                      <span className="text-[7px] font-mono text-white/30">🛡{f.card.defense}</span>
                      <span className="text-[7px] font-mono text-white/30">♥{Math.ceil(Math.max(0, hp))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Battle Log */}
        <div className="w-[300px] shrink-0 border-l border-r border-white/[0.03]">
          <BattleLog logs={logs} visibleCount={step} />
        </div>

        {/* Right: AI team */}
        <div className="flex-1 p-3 flex flex-col gap-1.5">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5" style={{ color: `${aiFaction.color}88` }}>
            <Zap size={10} /> OPPONENT
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {aiTeam.map((f) => {
              const hp = hpByName[f.name] ?? f.maxHp;
              const dead = !!deadByName[f.name];
              const ci = getUnitClassInfo(f.card);
              const hpP = Math.max(0, (hp / f.maxHp) * 100);
              const ClassIcon = ICON_MAP[ci.icon] || Swords;
              return (
                <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg min-w-[130px] shrink-0 transition-opacity"
                  style={{
                    background: dead ? "rgba(255,255,255,0.02)" : `linear-gradient(135deg, ${aiFaction.color}08, ${aiFaction.color}03)`,
                    border: dead ? "1px solid rgba(255,255,255,0.03)" : `1px solid ${aiFaction.color}15`,
                    opacity: dead ? 0.3 : 1,
                  }}>
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {f.card.imageUrl ? <img src={f.card.imageUrl} alt="" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} /> : <span className="text-[8px] text-white/15">?</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 text-white/60"><ClassIcon size={10} /></span>
                      <span className="text-[9px] font-bold text-white/85 truncate">{f.card.name}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mt-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{
                        width: `${hpP}%`,
                        background: hpP > 50 ? "#22c55e" : hpP > 20 ? "#eab308" : "#ef4444",
                      }} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7px] font-mono text-white/30">⚔{f.card.attack}</span>
                      <span className="text-[7px] font-mono text-white/30">🛡{f.card.defense}</span>
                      <span className="text-[7px] font-mono text-white/30">♥{Math.ceil(Math.max(0, hp))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {finished && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <BattleResult result={battleData.result} eloChange={battleData.eloChange ?? 0}
            turns={battleData.turns ?? turn} playerDamageDealt={battleData.playerDamageDealt ?? 0}
            playerDamageTaken={battleData.playerDamageTaken ?? 0} mvpName={battleData.mvp?.name} 
            eloRating={battleData.eloRating ?? 1000} totalBattles={battleData.totalBattles ?? 0}
            onBack={onExit} />
        </div>
      )}
    </div>
  );
}
