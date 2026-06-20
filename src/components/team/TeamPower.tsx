"use client";

import { useDeckStore } from "@/stores/useDeckStore";
import { predictWinRate } from "@/engine/win-predictor";

export function TeamPower() {
  // Subscribe to slots directly so this re-renders whenever the team changes.
  const slots = useDeckStore((state) => state.slots);
  const cards = slots.filter((c) => c !== null);
  const teamPower = cards.reduce((sum, c) => sum + (c!.ovr || 0), 0);
  const prediction =
    cards.length === 3
      ? predictWinRate(cards.map((c) => ({ ovr: c!.ovr, faction: c!.faction })))
      : null;

  return (
    <div className="flex gap-6 text-right">
      <div>
        <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">
          Team Power
        </div>
        <div className="text-3xl font-mono font-bold text-accent">{teamPower}</div>
      </div>
      {prediction && (
        <div>
          <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">
            Win Rate
          </div>
          <div className="text-3xl font-mono font-bold text-primary">
            {prediction.winRate}%
          </div>
        </div>
      )}
    </div>
  );
}
