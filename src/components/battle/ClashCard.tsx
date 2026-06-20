"use client";

import { motion, type TargetAndTransition, type Transition, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sword, Shield, Zap, Skull, Crosshair, Wand2, Heart, Swords, type LucideIcon } from "lucide-react";
import type { CardDisplay as CardType } from "@/types/card";
import { factionStyle, rarityStyle } from "@/lib/cosmetics";
import { getUnitClassInfo, getAbilityName, type UnitClass } from "@/engine/unitClass";

export interface FighterEvent {
  seq: number;
  kind: "attack" | "special" | "hit" | "heal" | "dodge";
  amount: number;
  isCritical: boolean;
}

const CLASS_ICON: Record<UnitClass, LucideIcon> = {
  TANK: Shield,
  ASSASSIN: Crosshair,
  MAGE: Wand2,
  SUPPORT: Heart,
  BRUISER: Swords,
};

// Rarities that get a living, animated aura border.
const ANIMATED_RARITY = new Set(["LEGENDARY", "RELIC", "GIGA"]);
const GLOW_RARITY = new Set(["RARE", "EPIC"]);

interface ClashCardProps {
  card: CardType;
  side: "player" | "ai";
  maxHealth: number;
  currentHealth: number;
  isDead: boolean;
  event: FighterEvent | null;
  scale?: number; // depth scaling: front 1.0, mid 0.92, back 0.85
  rowLabel?: string;
  isActor?: boolean; // currently taking an action -> zoom + blue ring
  isTarget?: boolean; // currently being targeted -> red ring
}

export function ClashCard({
  card, side, maxHealth, currentHealth, isDead, event,
  scale = 1, rowLabel, isActor = false, isTarget = false,
}: ClashCardProps) {
  const faction = factionStyle(card.faction);
  const rarity = rarityStyle(card.rarity);
  const cls = getUnitClassInfo(card);
  const ClassIcon = CLASS_ICON[cls.key];
  const abilityName = getAbilityName(card);
  const level = Math.max(1, Math.round((card.ovr || 40) / 14));
  const rarityKey = (card.rarity || "COMMON").toUpperCase();
  const animatedRarity = ANIMATED_RARITY.has(rarityKey);
  const glowRarity = GLOW_RARITY.has(rarityKey);
  const topTrait = card.traits?.[0];

  const hpPct = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const hpColor = hpPct > 50 ? "#22c55e" : hpPct > 20 ? "#eab308" : "#ef4444";
  const hpColorDark = hpPct > 50 ? "#16a34a" : hpPct > 20 ? "#ca8a04" : "#dc2626";

  // Side-view lunge: player charges right (+x), opponent charges left (-x).
  const dir = side === "player" ? 1 : -1;

  const [pop, setPop] = useState<FighterEvent | null>(null);
  const [shout, setShout] = useState(false);
  const [hover, setHover] = useState(false);
  
  useEffect(() => {
    if (!event) return;
    setPop(event);
    if (event.kind === "attack" || event.kind === "special") {
      setShout(true);
      const t = setTimeout(() => setShout(false), 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPop(null), 950);
    return () => clearTimeout(t);
  }, [event?.seq, event?.kind, event?.amount, event?.isCritical]);

  const acting = event && (event.kind === "attack" || event.kind === "special");
  const special = event?.kind === "special";
  const hit = event?.kind === "hit";
  const healing = event?.kind === "heal";
  const dodge = event?.kind === "dodge";

  // One-shot death burst on the transition alive -> dead.
  const [justKilled, setJustKilled] = useState(false);
  const wasDead = useRef(isDead);
  useEffect(() => {
    if (isDead && !wasDead.current) {
      setJustKilled(true);
      const t = setTimeout(() => setJustKilled(false), 900);
      wasDead.current = isDead;
      return () => clearTimeout(t);
    }
    wasDead.current = isDead;
  }, [isDead]);

  let animate: TargetAndTransition;
  let transition: Transition;
  if (acting) {
    animate = special
      ? { x: [0, -dir * 18, dir * 150, dir * 60, 0], scale: [1, 0.95, 1.2, 1.1, 1], rotate: [0, -dir * 4, dir * 2, 0] }
      : { x: [0, -dir * 12, dir * 120, 0], scale: [1, 0.97, 1.1, 1] };
    transition = { duration: special ? 0.7 : 0.5, ease: "easeInOut", times: special ? [0, 0.12, 0.5, 0.72, 1] : [0, 0.12, 0.55, 1] };
  } else if (hit) {
    // Stagger-back: knocked away from the attacker, then return to formation.
    animate = {
      x: [0, -dir * 34, -dir * 22, -dir * 8, 0],
      rotate: [0, -dir * 8, -dir * 4, 0, 0],
      filter: ["brightness(1)", "brightness(2.4) hue-rotate(-50deg)", "brightness(1.3)", "brightness(1)"],
    };
    transition = { duration: 0.55, ease: "easeOut", times: [0, 0.18, 0.42, 0.72, 1] };
  } else if (dodge) {
    animate = { x: [0, -dir * 20, -dir * 26, 0], y: [0, -6, -2, 0] };
    transition = { duration: 0.5, ease: "easeOut" };
  } else if (isDead) {
    animate = { x: 0, scale: 1 };
    transition = { duration: 0.2 };
  } else {
    // Idle "breathing": gentle bob + subtle scale pulse for character presence.
    animate = { y: [0, -5, 0], scale: [1, 1.015, 1] };
    transition = { duration: 2.6, repeat: Infinity, ease: "easeInOut" };
  }

  const accent = special ? rarity.glow : faction.color;
  // Active-state ring: blue if this card is acting, red if it's the target.
  const ringColor = isActor ? "#38bdf8" : isTarget ? "#ff4757" : null;
  const zoom = isActor ? 1.16 : 1;

  return (
    <motion.div
      className="relative flex flex-col items-center shrink-0"
      style={{ width: 100 * scale, zIndex: isActor || isTarget ? 40 : Math.round(scale * 10) }}
      animate={isDead
        ? { opacity: 0.1, scale: scale * 0.55, y: 26, rotate: dir * 14, filter: "grayscale(100%) brightness(0.35)" }
        : { opacity: 1, scale: scale * zoom, y: 0, rotate: 0, filter: "grayscale(0%) brightness(1)" }}
      transition={{ duration: isDead ? 0.7 : 0.4, ease: isDead ? "easeIn" : "easeOut" }}
    >
      {/* idle presence glow */}
      {!isDead && !acting && (
        <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-2 rounded-full pointer-events-none -z-10"
          style={{ width: 70 * scale, height: 70 * scale, background: `radial-gradient(circle, ${faction.color}33, transparent 70%)`, filter: "blur(8px)" }}
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.9, 1.05, 0.9] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      )}

      {/* death burst (one-shot) */}
      <AnimatePresence>
        {justKilled && (
          <motion.div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <motion.div className="absolute rounded-full"
              initial={{ width: 8, height: 8, opacity: 0.95 }} animate={{ width: 160, height: 160, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ border: "3px solid #ff4757", boxShadow: "0 0 30px #ff4757" }} />
            <motion.div className="absolute rounded-full"
              initial={{ width: 4, height: 4, opacity: 0.7 }} animate={{ width: 200, height: 200, opacity: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              style={{ border: "2px solid #ff6b6b", boxShadow: "0 0 20px #ff4757" }} />
            {[...Array(12)].map((_, i) => {
              const ang = (i / 12) * Math.PI * 2;
              const dist = 55 + (i % 3) * 15;
              return (
                <motion.div key={i} className="absolute rounded-full" style={{ width: 2 + (i % 3), height: 2 + (i % 3), background: i % 2 ? "#ff6b6b" : "#ff4757", boxShadow: "0 0 8px #ff4757" }}
                  initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, opacity: 0 }}
                  transition={{ duration: 0.6 + (i % 3) * 0.1, ease: "easeOut" }} />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ability shout (bigger, with class icon) */}
      <AnimatePresence>
        {shout && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
          >
            <div className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1"
              style={{ background: `linear-gradient(135deg, ${accent}ee, ${accent}aa)`, color: "#fff", border: `1px solid ${accent}`, boxShadow: `0 0 16px ${accent}88` }}>
              {special ? <Zap size={10} /> : <Sword size={10} />} {abilityName}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* hover stat tooltip */}
      <AnimatePresence>
        {hover && !isDead && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-[60] w-40 rounded-lg p-2 pointer-events-none"
            style={{ background: "rgba(8,8,20,0.97)", border: `1px solid ${rarity.base}88`, boxShadow: `0 0 16px rgba(0,0,0,0.8)` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-white truncate">{card.name}</span>
              <span className="text-[8px] font-black uppercase px-1 rounded" style={{ background: `${cls.color}33`, color: cls.color }}>{cls.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-mono">
              <span className="flex justify-between text-red-300/80"><span>ATK</span><span>{card.attack}</span></span>
              <span className="flex justify-between text-blue-300/80"><span>DEF</span><span>{card.defense}</span></span>
              <span className="flex justify-between text-yellow-300/80"><span>SPD</span><span>{card.speed}</span></span>
              <span className="flex justify-between text-emerald-300/80"><span>HP</span><span>{card.health}</span></span>
              <span className="flex justify-between text-fuchsia-300/80"><span>LCK</span><span>{card.luck}</span></span>
              <span className="flex justify-between text-white/60"><span>OVR</span><span>{card.ovr}</span></span>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[8px]">
              <div className="flex items-center gap-1 text-purple-300"><Zap size={8} /> {abilityName}</div>
              {card.passiveAbility && card.passiveAbility !== "NONE" && (
                <div className="flex items-center gap-1 text-cyan-300/80 mt-0.5"><Shield size={8} /> {card.passiveAbility}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key={event?.seq ?? "idle"} animate={animate} transition={transition} className="relative"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        {/* active-state highlight ring */}
        <AnimatePresence>
          {ringColor && !isDead && (
            <motion.div
              className="absolute -inset-1.5 rounded-2xl z-0 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ border: `2px solid ${ringColor}`, boxShadow: `0 0 18px ${ringColor}aa, inset 0 0 10px ${ringColor}55` }} />
          )}
        </AnimatePresence>

        {/* attack aura */}
        {acting && (
          <motion.div className="absolute inset-0 rounded-xl z-0"
            style={{ backgroundColor: accent, filter: "blur(22px)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, special ? 0.8 : 0.55, 0], scale: [0.5, 1.8, 1.2] }}
            transition={{ duration: 0.6 }} />
        )}

        {/* ability fantasy: rising energy particles on a special */}
        {special && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
            {[...Array(7)].map((_, i) => (
              <motion.div key={i} className="absolute bottom-0 rounded-full"
                style={{ left: `${15 + i * 11}%`, width: 4, height: 4, background: accent, boxShadow: `0 0 8px ${accent}` }}
                initial={{ y: 10, opacity: 0, scale: 0.5 }}
                animate={{ y: -70 - (i % 3) * 14, opacity: [0, 1, 0], scale: [0.5, 1.2, 0.4] }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }} />
            ))}
          </div>
        )}

        {/* animated rarity aura for legendary+ */}
        {animatedRarity && !isDead && (
          <div className="absolute -inset-[2px] rounded-xl z-0 overflow-hidden">
            <div className="absolute inset-[-40%] clash-rarity-spin"
              style={{ background: `conic-gradient(from 0deg, ${rarity.base}, ${rarity.glow}, ${rarity.base}, ${rarity.glow}, ${rarity.base})` }} />
          </div>
        )}

        {/* ── Vertical card ── */}
        <div className="relative w-full rounded-xl overflow-hidden z-10"
          style={{
            background: animatedRarity ? "transparent" : `linear-gradient(135deg, ${rarity.base}, ${rarity.glow})`,
            padding: 2,
            boxShadow: glowRarity
              ? `0 0 18px ${rarity.base}99, 0 6px 16px rgba(0,0,0,0.6)`
              : `0 0 14px ${rarity.base}66, 0 6px 16px rgba(0,0,0,0.6)`,
          }}>
          <div className="relative rounded-[10px] overflow-hidden" style={{ background: "linear-gradient(180deg, #14142a, #0b0b18)" }}>
            {/* HP bar in the top border */}
            <div className="relative h-3 overflow-hidden" style={{ background: "rgba(0,0,0,0.6)" }}>
              <motion.div className="h-full" initial={false} animate={{ width: `${hpPct}%` }} transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ background: `linear-gradient(180deg, ${hpColor}, ${hpColorDark})`, boxShadow: `0 0 6px ${hpColor}88` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,1)" }}>
                {Math.ceil(Math.max(0, currentHealth))}/{maxHealth}
              </div>
            </div>

            {/* Name row + rarity gem */}
            <div className="flex items-center justify-between px-1.5 py-1" style={{ background: `linear-gradient(90deg, ${faction.color}22, transparent)` }}>
              <span className="text-[9px] font-bold text-white/90 truncate">{card.name}</span>
              <span className="shrink-0 w-3 h-3 rotate-45 rounded-[2px]"
                title={rarityKey}
                style={{ background: `linear-gradient(135deg, ${rarity.base}, ${rarity.glow})`, boxShadow: `0 0 5px ${rarity.glow}`, border: "1px solid rgba(255,255,255,0.4)" }} />
            </div>

            {/* Portrait */}
            <div className="relative aspect-square bg-black/30 flex items-center justify-center overflow-hidden">
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain"
                  style={{ transform: side === "ai" ? "scaleX(-1)" : "none", filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 5px ${faction.color}44)` }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    const cid = img.src.match(/\/ipfs\/(.+)$/)?.[1];
                    if (cid && !img.dataset.fb) { img.dataset.fb = "1"; img.src = `https://ipfs.io/ipfs/${cid}`; }
                    else if (!img.dataset.fb2) { img.dataset.fb2 = "1"; img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${card.giglingId}`; }
                  }} />
              ) : <span className="text-white/20 text-sm">?</span>}

              {/* class badge (top-left) */}
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-md flex items-center justify-center"
                title={cls.label}
                style={{ background: `${cls.color}dd`, boxShadow: `0 0 6px ${cls.color}88`, border: "1px solid rgba(255,255,255,0.3)" }}>
                <ClassIcon size={9} className="text-white" />
              </div>

              {/* faction crest (top-right) */}
              {faction.logo && (
                <img src={faction.logo} alt="" className="absolute top-0.5 right-0.5 w-4 h-4 [image-rendering:pixelated] opacity-85"
                  style={{ filter: `drop-shadow(0 0 3px ${faction.color})` }} />
              )}

              {/* level (bottom-left) */}
              <span className="absolute bottom-0.5 left-0.5 px-1 h-3.5 rounded flex items-center text-[7px] font-black text-white"
                style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${rarity.base}88` }}>L{level}</span>
              {/* card number (bottom-right) */}
              <span className="absolute bottom-0.5 right-0.5 text-[6px] font-mono text-white/40">#{card.giglingId}</span>

              {hit && (
                <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 0.4 }}
                  style={{ background: "radial-gradient(circle, rgba(255,40,40,0.7), transparent 70%)", mixBlendMode: "screen" }} />
              )}
              {healing && (
                <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0] }} transition={{ duration: 0.5 }}
                  style={{ background: "radial-gradient(circle, rgba(34,197,94,0.6), transparent 70%)", mixBlendMode: "screen" }} />
              )}
              {isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Skull size={20} className="text-red-400/80" />
                </div>
              )}
            </div>

            {/* Trait / ability tag */}
            <div className="px-1.5 py-0.5 flex items-center gap-1 border-t border-white/5" style={{ background: "rgba(0,0,0,0.25)" }}>
              <ClassIcon size={7} style={{ color: cls.color }} className="shrink-0" />
              <span className="text-[7px] font-semibold uppercase tracking-wide text-white/55 truncate">
                {topTrait ? topTrait.traitValue : abilityName}
              </span>
            </div>

            {/* Stat footer with icons */}
            <div className="flex items-center justify-between px-1.5 py-1" style={{ background: `linear-gradient(0deg, ${faction.color}14, transparent)` }}>
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-red-300/80"><Sword size={8} />{card.attack}</span>
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-blue-300/80"><Shield size={8} />{card.defense}</span>
              <span className="flex items-center gap-0.5 text-[8px] font-mono text-yellow-300/80"><Zap size={8} />{card.speed}</span>
            </div>
          </div>
        </div>

        {/* impact ring + spark burst */}
        {hit && (
          <>
            <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-30 pointer-events-none"
              initial={{ opacity: 0.9, scale: 0.1 }} animate={{ opacity: 0, scale: 3 }} transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ width: 18, height: 18, border: `3px solid ${event?.isCritical ? "#f7c948" : "#ff4757"}`, boxShadow: `0 0 14px ${event?.isCritical ? "#f7c948" : "#ff4757"}88` }} />
            {/* white impact flash */}
            <motion.div className="absolute inset-0 z-20 pointer-events-none rounded-xl"
              initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ background: "rgba(255,255,255,0.85)", mixBlendMode: "screen" }} />
            {/* spark shards */}
            {[...Array(event?.isCritical ? 8 : 5)].map((_, i) => {
              const ang = (i / (event?.isCritical ? 8 : 5)) * Math.PI * 2 + 0.3;
              const dist = event?.isCritical ? 40 : 28;
              return (
                <motion.div key={i} className="absolute top-1/2 left-1/2 z-30 pointer-events-none rounded-full"
                  style={{ width: 3, height: 3, background: event?.isCritical ? "#f7c948" : "#ff6b6b", boxShadow: `0 0 5px ${event?.isCritical ? "#f7c948" : "#ff4757"}` }}
                  initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }} />
              );
            })}
          </>
        )}

        {/* floating combat text */}
        <AnimatePresence>
          {pop && (pop.kind === "hit" || pop.kind === "heal") && (
            <motion.div key={pop.seq}
              initial={{ opacity: 0, y: 0, scale: pop.isCritical ? 0.5 : 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -50, scale: pop.isCritical ? [0.5, 1.5, 1.3] : [0.8, 1.2, 1.0] }}
              exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap text-center"
              style={{ zIndex: 999 }}>
              {pop.isCritical && (
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-0.5"
                  style={{ textShadow: "0 0 12px rgba(255,200,0,0.9)" }}>CRITICAL</div>
              )}
              <span className={`font-mono font-black ${pop.kind === "heal" ? "text-emerald-400 text-2xl" : pop.isCritical ? "text-yellow-300 text-5xl" : "text-red-400 text-3xl"}`}
                style={{ textShadow: pop.isCritical ? "0 0 20px rgba(255,200,0,0.9), 0 0 40px rgba(255,150,0,0.5), 0 4px 12px rgba(0,0,0,1)" : "0 0 14px rgba(255,71,87,0.8), 0 4px 12px rgba(0,0,0,1)" }}>
                {pop.kind === "heal" ? "+" : "-"}{pop.amount}
              </span>
            </motion.div>
          )}
          {pop && pop.kind === "dodge" && (
            <motion.div key={pop.seq}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.6, 1.3, 1.1] }}
              exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap">
              <span className="font-mono font-black text-cyan-300 text-lg uppercase tracking-[0.2em]"
                style={{ textShadow: "0 0 14px rgba(56,189,248,0.9), 0 2px 8px rgba(0,0,0,1)" }}>DODGE</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* row label under card */}
      {rowLabel && !isDead && (
        <span className="mt-1 text-[7px] font-bold uppercase tracking-widest text-white/25">{rowLabel}</span>
      )}
    </motion.div>
  );
}
