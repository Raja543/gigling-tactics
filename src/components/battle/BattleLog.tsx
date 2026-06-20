"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Swords, Zap, Heart, Skull, Flame, LucideIcon } from "lucide-react";

interface BattleLogProps {
  logs: any[];
  visibleCount: number;
}

const ACTION_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; label?: string }
> = {
  ATTACK: { icon: Swords, color: "text-red-400" },
  SPECIAL: { icon: Zap, color: "text-purple-400" },
  HEAL: { icon: Heart, color: "text-emerald-400" },
  DEFEATED: { icon: Skull, color: "text-red-500" },
};

function formatLogMessage(log: {
  actionType: string;
  actorName: string;
  targetName: string;
  damage?: number;
  healing?: number;
  isCritical?: boolean;
}): string {
  const { actionType, actorName, targetName, damage, healing, isCritical } = log;

  if (isCritical && damage) {
    return `CRITICAL HIT! ${actorName} devastates ${targetName} for ${damage} damage`;
  }

  switch (actionType) {
    case "ATTACK":
      return `${actorName} strikes ${targetName} for ${damage ?? 0} damage`;
    case "SPECIAL":
      return `${actorName} uses their ability! ${damage ?? 0} damage`;
    case "HEAL":
      return `${actorName} heals for ${healing ?? 0} HP`;
    case "DEFEATED":
      return `${targetName} has been defeated!`;
    default:
      return `${actorName} acts against ${targetName}`;
  }
}

export function BattleLog({ logs, visibleCount }: BattleLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new entries appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const visibleLogs = logs.slice(0, visibleCount);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-y-auto bg-gray-950/80 p-4 backdrop-blur-sm",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
      )}
    >
      {visibleLogs.length === 0 && (
        <div className="flex h-full items-center justify-center gap-2">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Swords size={16} className="text-white/40" />
          </motion.div>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm italic text-white/40"
          >
            Preparing for battle…
          </motion.span>
        </div>
      )}

      <div className="space-y-1.5">
        {visibleLogs.map((log, index) => {
          const config = ACTION_CONFIG[log.actionType] ?? {
            icon: Swords,
            color: "text-white/70",
          };

          const isCritical = !!log.isCritical;
          const isDefeated = log.actionType === "DEFEATED";

          const IconComponent = isCritical ? Flame : config.icon;
          const message = formatLogMessage(log);

          return (
            <motion.div
              key={`${log.turnNumber}-${index}`}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.8,
              }}
              className={cn(
                "relative flex items-start gap-2 rounded-md px-3 py-1.5 text-sm",
                isDefeated && "animate-pulse bg-red-900/30"
              )}
            >
              {/* Turn indicator */}
              <span className="mt-px shrink-0 font-mono text-xs text-white/25">
                {String(log.turnNumber).padStart(2, "0")}
              </span>

              {/* Icon prefix */}
              <span className="shrink-0 mt-0.5">
                <IconComponent size={14} className={isCritical ? "text-yellow-400" : config.color.replace('text-', 'text-')} />
              </span>

              {/* Narration text */}
              <span
                className={cn(
                  "leading-5",
                  config.color,
                  isCritical && "font-bold text-yellow-400",
                  isDefeated && "font-semibold tracking-wide"
                )}
              >
                {message}
              </span>

              {/* Damage / healing badge */}
              {(log.damage != null || log.healing != null) &&
                log.actionType !== "DEFEATED" && (
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                      log.healing
                        ? "bg-emerald-900/50 text-emerald-300"
                        : isCritical
                          ? "bg-yellow-900/50 text-yellow-300"
                          : "bg-red-900/40 text-red-300"
                    )}
                  >
                    {log.healing ? `+${log.healing}` : `-${log.damage}`}
                  </span>
                )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
