import { Shield, Sword, Heart, Zap } from "lucide-react";
import { StatBar } from "@/components/ui/StatBar";
import type { CardDisplay as CardType } from "@/types/card";

export function CardStats({ card }: { card: CardType }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatBar 
        label="Attack" 
        value={card.attack} 
        icon={<Sword size={14} />}
        colorHex="#ef4444"
      />
      <StatBar 
        label="Defense" 
        value={card.defense} 
        icon={<Shield size={14} />}
        colorHex="#3b82f6"
      />
      <StatBar 
        label="Speed" 
        value={card.speed} 
        icon={<Zap size={14} />}
        colorHex="#eab308"
      />
      <StatBar 
        label="Health" 
        value={card.health} 
        icon={<Heart size={14} />}
        colorHex="#22c55e"
      />
    </div>
  );
}
