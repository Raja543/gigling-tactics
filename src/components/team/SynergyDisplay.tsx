"use client";

import { useMemo } from "react";
import { Shield } from "lucide-react";
import { calculateSynergies } from "@/engine/synergy-calculator";
import { useDeckStore } from "@/stores/useDeckStore";

export function SynergyDisplay() {
  const slots = useDeckStore(state => state.slots);
  
  const activeSynergies = useMemo(() => {
    const factions = slots.filter(c => c !== null).map(c => c!.faction as any);
    return calculateSynergies(factions);
  }, [slots]);

  if (activeSynergies.length === 0) {
    return (
      <div className="bg-surface border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
        <Shield className="text-white/20 mb-2" size={24} />
        <p className="text-sm text-white/40">Add cards to your team to unlock Faction Synergies.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-primary/30 rounded-xl p-4 h-full">
      <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-3 flex items-center">
        <Shield className="text-primary mr-2" size={16} />
        Active Synergies
      </h3>
      <div className="space-y-3">
        {activeSynergies.map((syn, idx) => (
          <div key={idx} className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <h4 className="font-bold text-primary text-sm">{syn.name}</h4>
            <p className="text-xs text-white/60 mt-1">{syn.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
