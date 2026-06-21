"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClashCard, type FighterEvent } from "./ClashCard";
import { BATTLE_HEALTH_MULTIPLIER } from "@/engine/balance";
import { getAbilityName } from "@/engine/unitClass";
import type { CardDisplay as CardType } from "@/types/card";

interface BattlePreviewProps {
  player: CardType;
  enemy: CardType;
}

// A short, looping preview that uses the REAL arena card (ClashCard) and the
// arena floor, so the homepage shows exactly how a battle plays out: lunge ->
// ability -> impact -> floating damage -> recoil, with draining HP.
type Beat =
  | { kind: "idle" }
  | { kind: "player" | "enemy"; special?: boolean; dmg: number; crit?: boolean };

const BEATS: Beat[] = [
  { kind: "idle" },
  { kind: "player", dmg: 142 },
  { kind: "enemy", special: true, dmg: 318, crit: true },
  { kind: "player", dmg: 176 },
  { kind: "enemy", dmg: 121 },
  { kind: "idle" },
];

export function BattlePreview({ player, enemy }: BattlePreviewProps) {
  const pMax = Math.max(1, (player.health || 70) * BATTLE_HEALTH_MULTIPLIER);
  const eMax = Math.max(1, (enemy.health || 70) * BATTLE_HEALTH_MULTIPLIER);

  const [i, setI] = useState(0);
  const [pHp, setPHp] = useState(pMax);
  const [eHp, setEHp] = useState(eMax);
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => {
        const next = (prev + 1) % BEATS.length;
        const b = BEATS[next];
        setSeq((s) => s + 1);
        if (b.kind === "idle") {
          setPHp(pMax);
          setEHp(eMax);
        } else if (b.kind === "player") {
          setEHp((h) => Math.max(eMax * 0.08, h - b.dmg));
        } else if (b.kind === "enemy") {
          setPHp((h) => Math.max(pMax * 0.08, h - b.dmg));
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(id);
  }, [pMax, eMax]);

  const beat = BEATS[i];
  const acting = beat.kind === "player" ? "player" : beat.kind === "enemy" ? "enemy" : null;

  const playerEvent: FighterEvent | null =
    beat.kind === "player" ? { seq, kind: beat.special ? "special" : "attack", amount: beat.dmg, isCritical: !!beat.crit }
      : beat.kind === "enemy" ? { seq, kind: "hit", amount: beat.dmg, isCritical: !!beat.crit }
        : null;
  const enemyEvent: FighterEvent | null =
    beat.kind === "enemy" ? { seq, kind: beat.special ? "special" : "attack", amount: beat.dmg, isCritical: !!beat.crit }
      : beat.kind === "player" ? { seq, kind: "hit", amount: beat.dmg, isCritical: !!beat.crit }
        : null;

  const beatSpecial = beat.kind !== "idle" && !!beat.special;
  const beatCrit = beat.kind !== "idle" && !!beat.crit;
  const callout = acting
    ? {
        actor: acting === "player" ? player.name : enemy.name,
        verb: beatSpecial ? "unleashes" : beatCrit ? "crits" : "strikes",
        target: acting === "player" ? enemy.name : player.name,
        actorIsPlayer: acting === "player",
        ability: getAbilityName(acting === "player" ? player : enemy),
        crit: beatCrit,
      }
    : null;

  return (
    <div className="relative z-10 overflow-hidden">
      {/* arena floor grid (matches the real arena) */}
      <div className="absolute inset-0 [perspective:1000px] overflow-hidden pointer-events-none">
        <div
          className="absolute left-1/2 bottom-[-30%] h-[150%] w-[260%] -translate-x-1/2 origin-bottom [transform:rotateX(72deg)] opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(108,92,231,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,0.18) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at 50% 45%, black 10%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 10%, transparent 65%)",
          }}
        />
      </div>
      {/* team floor glows */}
      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-1/3 h-2/3 rounded-[50%] blur-[60px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.14), transparent 70%)" }} />
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-1/3 h-2/3 rounded-[50%] blur-[60px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(214,51,255,0.14), transparent 70%)" }} />
      {/* center clash divider */}
      <div className="absolute left-1/2 top-[14%] bottom-[14%] w-[2px] -translate-x-1/2 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent, rgba(0,200,255,0.5), rgba(214,51,255,0.5), transparent)", boxShadow: "0 0 12px rgba(108,92,231,0.5)" }} />

      {/* clash flash on a special/crit */}
      <AnimatePresence>
        {callout?.crit && (
          <motion.div key={`flash-${seq}`} className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,71,87,0.5), transparent 55%)" }} />
        )}
      </AnimatePresence>

      {/* action callout (mirrors the arena's "X strikes Y") */}
      <div className="relative z-20 flex justify-center pt-5 h-12">
        <AnimatePresence mode="wait">
          {callout && (
            <motion.div key={`co-${seq}`} initial={{ opacity: 0, y: -8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap"
              style={{ background: "rgba(5,5,18,0.85)", border: `1px solid ${callout.crit ? "#f7c948" : "rgba(108,92,231,0.5)"}`, backdropFilter: "blur(6px)" }}>
              <span className="text-sm font-black" style={{ color: callout.actorIsPlayer ? "#22d3ee" : "#d633ff" }}>{callout.actor}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: callout.crit ? "#f7c948" : "#fff" }}>{callout.verb}</span>
              <span className="text-sm font-black" style={{ color: callout.actorIsPlayer ? "#d633ff" : "#22d3ee" }}>{callout.target}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the duel: real arena cards facing center */}
      <div className="relative z-10 flex items-center justify-center gap-10 sm:gap-20 py-8 px-6">
        <ClashCard
          card={player} side="player" maxHealth={pMax} currentHealth={pHp} isDead={false}
          event={playerEvent} scale={1.15} isActor={acting === "player"} isTarget={acting === "enemy"}
        />
        <ClashCard
          card={enemy} side="ai" maxHealth={eMax} currentHealth={eHp} isDead={false}
          event={enemyEvent} scale={1.15} isActor={acting === "enemy"} isTarget={acting === "player"}
        />
      </div>
    </div>
  );
}
