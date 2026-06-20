"use client";

import { motion, type TargetAndTransition, type Transition, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Skull } from "lucide-react";
import type { CardDisplay as CardType } from "@/types/card";
import { factionStyle, rarityStyle } from "@/lib/cosmetics";
import { getAbilityName } from "@/engine/unitClass";

export interface FighterEvent {
  seq: number;
  kind: "attack" | "special" | "hit" | "heal";
  amount: number;
  isCritical: boolean;
}

interface BattleFighterProps {
  card: CardType;
  side: "player" | "ai";
  maxHealth: number;
  currentHealth: number;
  isDead: boolean;
  event: FighterEvent | null;
}

export function BattleFighter({ card, side, maxHealth, currentHealth, isDead, event }: BattleFighterProps) {
  const faction = factionStyle(card.faction);
  const rarity = rarityStyle(card.rarity);
  const abilityName = getAbilityName(card);

  // Team tile color: player = cyan, opponent = magenta (matches the board halves).
  const tileColor = side === "player" ? "#22d3ee" : "#d633ff";
  const level = Math.max(1, Math.round((card.ovr || 40) / 14));

  const hpPct = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const hpColor = hpPct > 50 ? "#22c55e" : hpPct > 20 ? "#eab308" : "#ef4444";
  const hpColorDark = hpPct > 50 ? "#16a34a" : hpPct > 20 ? "#ca8a04" : "#dc2626";

  const thrust = side === "player" ? -1 : 1;

  const [pop, setPop] = useState<FighterEvent | null>(null);
  const [showAbility, setShowAbility] = useState(false);

  useEffect(() => {
    if (!event) return;
    setPop(event);
    if (event.kind === "attack" || event.kind === "special") {
      setShowAbility(true);
      const t2 = setTimeout(() => setShowAbility(false), 1200);
      return () => clearTimeout(t2);
    }
    const t = setTimeout(() => setPop(null), 950);
    return () => clearTimeout(t);
  }, [event]);

  const acting = event && (event.kind === "attack" || event.kind === "special");
  const special = event?.kind === "special";
  const hit = event?.kind === "hit";
  const healing = event?.kind === "heal";

  // Combat choreography for the mini.
  let animate: TargetAndTransition;
  let transition: Transition;
  if (acting) {
    animate = special
      ? { y: [0, thrust * 6, -thrust * 16, thrust * 95, thrust * 35, 0], scale: [1, 0.95, 1.2, 1.45, 1.2, 1] }
      : { y: [0, thrust * 4, -thrust * 10, thrust * 70, 0], scale: [1, 0.97, 1.08, 1.12, 1] };
    transition = { duration: special ? 0.7 : 0.5, ease: "easeInOut", times: special ? [0, 0.1, 0.25, 0.55, 0.75, 1] : [0, 0.1, 0.3, 0.6, 1] };
  } else if (hit) {
    animate = {
      x: [0, -12, 12, -8, 8, 0],
      scale: [1, 0.9, 1.02, 1],
      filter: ["brightness(1)", "brightness(2.4) hue-rotate(-50deg)", "brightness(1.4)", "brightness(1)"],
    };
    transition = { duration: 0.5, ease: "easeOut" };
  } else if (isDead) {
    animate = { y: 0, scale: 1 };
    transition = { duration: 0.2 };
  } else {
    animate = { y: [0, -5, 0] };
    transition = { duration: 2.8, repeat: Infinity, ease: "easeInOut" };
  }

  return (
    <motion.div
      className="relative flex flex-col items-center w-[92px] sm:w-[110px]"
      animate={isDead
        ? { opacity: 0.18, scale: 0.7, filter: "grayscale(100%) brightness(0.5)" }
        : { opacity: 1, scale: 1, filter: "grayscale(0%) brightness(1)" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* ── Floating HUD: name + level badge + HP pill ── */}
      <div className="flex flex-col items-center gap-0.5 mb-1 z-30 pointer-events-none">
        <span className="text-[10px] sm:text-[11px] font-bold text-white truncate max-w-[100px]"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}>
          {card.name}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
            style={{ background: "#0b0b1e", border: `1px solid ${tileColor}99`, boxShadow: `0 0 5px ${tileColor}66` }}>
            {level}
          </div>
          <div className="relative w-[58px] sm:w-[66px] h-3 rounded-full overflow-hidden"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <motion.div className="h-full rounded-full"
              initial={false}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ background: `linear-gradient(180deg, ${hpColor}, ${hpColorDark})`, boxShadow: `0 0 5px ${hpColor}88` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,1)" }}>
              {Math.ceil(Math.max(0, currentHealth))}/{maxHealth}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stage: tile + mini ── */}
      <div className="relative w-full h-[78px] sm:h-[92px] flex items-end justify-center">
        {/* Ability shout */}
        <AnimatePresence>
          {showAbility && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.8 }}
              animate={{ opacity: 1, y: -6, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.9 }}
              transition={{ duration: 0.35 }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
            >
              <div className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide"
                style={{
                  background: `linear-gradient(135deg, ${special ? rarity.base : faction.color}dd, ${special ? rarity.glow : faction.color}99)`,
                  color: "#fff",
                  border: `1px solid ${special ? rarity.glow : faction.color}`,
                  boxShadow: `0 0 12px ${special ? rarity.glow : faction.color}66`,
                }}>
                {special ? "⚡" : "⚔"} {abilityName}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Isometric floor tile */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 [perspective:200px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[10px] [transform:rotateX(58deg)]"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${tileColor}33, ${tileColor}10 60%, transparent)`,
              border: `1.5px solid ${tileColor}`,
              boxShadow: `0 0 16px ${tileColor}88, inset 0 0 14px ${tileColor}44`,
            }} />
        </div>
        {/* Soft shadow under the mini */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-[50%] blur-[3px]"
          style={{ background: "rgba(0,0,0,0.55)" }} />

        {/* The mini (animated) */}
        <motion.div key={event?.seq ?? "idle"} animate={animate} transition={transition}
          className="relative z-10 mb-2">
          {/* attack aura */}
          {acting && (
            <motion.div className="absolute inset-0 rounded-full"
              style={{ backgroundColor: special ? rarity.glow : faction.color, filter: "blur(18px)" }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, special ? 0.8 : 0.55, 0], scale: [0.5, 1.8, 1.2] }}
              transition={{ duration: 0.55 }} />
          )}

          <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex items-end justify-center">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name}
                className="w-full h-full object-contain"
                style={{ filter: `drop-shadow(0 5px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 5px ${faction.color}44)` }}
                onError={(e) => {
                  const img = e.currentTarget;
                  const cid = img.src.match(/\/ipfs\/(.+)$/)?.[1];
                  if (cid && !img.dataset.fb) { img.dataset.fb = "1"; img.src = `https://ipfs.io/ipfs/${cid}`; }
                  else if (!img.dataset.fb2) { img.dataset.fb2 = "1"; img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${card.giglingId}`; }
                }} />
            ) : (
              <span className="text-white/20 text-sm">?</span>
            )}

            {/* hit / heal flash on the mini */}
            {hit && (
              <motion.div className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 0.4 }}
                style={{ background: "radial-gradient(circle, rgba(255,40,40,0.7), transparent 70%)", mixBlendMode: "screen" }} />
            )}
            {healing && (
              <motion.div className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0] }} transition={{ duration: 0.5 }}
                style={{ background: "radial-gradient(circle, rgba(34,197,94,0.6), transparent 70%)", mixBlendMode: "screen" }} />
            )}
            {isDead && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skull size={22} className="text-red-400/80" />
              </div>
            )}
          </div>

          {/* impact ring */}
          {hit && (
            <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-30 pointer-events-none"
              initial={{ opacity: 0.9, scale: 0.1 }} animate={{ opacity: 0, scale: 3 }} transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ width: 18, height: 18, border: "3px solid #ff4757", boxShadow: "0 0 14px #ff475788" }} />
          )}

          {/* floating combat text */}
          <AnimatePresence>
            {pop && (pop.kind === "hit" || pop.kind === "heal") && (
              <motion.div key={pop.seq}
                initial={{ opacity: 0, y: 0, scale: pop.isCritical ? 0.4 : 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], y: -70, scale: pop.isCritical ? [0.4, 2, 1.5] : [0.8, 1.2, 1.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap">
                <span className={`font-mono font-black ${pop.kind === "heal" ? "text-emerald-400 text-lg" : pop.isCritical ? "text-yellow-300 text-3xl" : "text-red-400 text-2xl"}`}
                  style={{ textShadow: pop.isCritical ? "0 0 15px rgba(255,200,0,0.9), 0 2px 8px rgba(0,0,0,1)" : "0 0 10px rgba(255,71,87,0.7), 0 2px 8px rgba(0,0,0,1)" }}>
                  {pop.kind === "heal" ? "+" : "-"}{pop.amount}
                  {pop.isCritical && <span className="ml-1 text-[10px] uppercase tracking-wider text-yellow-200 font-black">CRIT!</span>}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
