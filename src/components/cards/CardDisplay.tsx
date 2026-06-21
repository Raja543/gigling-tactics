"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sword, Shield, Zap, Heart, Check } from "lucide-react";
import { StatBar } from "@/components/ui/StatBar";
import { cn } from "@/lib/utils";
import { factionStyle, rarityStyle } from "@/lib/cosmetics";
import type { CardDisplay as CardType } from "@/types/card";
import { useRouter } from "next/navigation";

interface CardDisplayProps {
  card: CardType;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  selected?: boolean;
}

function CardDisplayBase({ card, className, onClick, interactive = true, selected = false }: CardDisplayProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (onClick) onClick();
    else if (interactive) router.push(`/cards/${card.id || card.giglingId}`);
  };

  const rarityStyles = getRarityStyles(card.rarity);
  const faction = factionStyle(card.faction);
  const rarity = rarityStyle(card.rarity);

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.03, y: -4 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={handleCardClick}
      className={cn(
        "group relative rounded-xl overflow-hidden bg-surface flex flex-col border",
        interactive ? "cursor-pointer" : "",
        rarityStyles.borderClass,
        interactive && rarityStyles.hoverClass,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {/* Selected overlay */}
      {selected && (
        <div className="absolute inset-0 z-30 bg-primary/15 pointer-events-none flex items-start justify-end p-1.5">
          <span className="bg-primary text-white rounded-full p-1 shadow-lg">
            <Check size={12} strokeWidth={3} />
          </span>
        </div>
      )}

      {/* Artwork with overlaid chips */}
      <div className="relative aspect-square w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 30%, ${faction.color}33, var(--background) 70%)` }}
        />
        {/* premium foil sheen on hover */}
        {interactive && (
          <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none foil-sheen rounded-xl" />
        )}
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
            className="relative z-10 w-full h-full object-contain p-2 drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const img = e.currentTarget;
              const cidPath = img.src.match(/\/ipfs\/(.+)$/)?.[1];
              if (cidPath && !img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = `https://ipfs.io/ipfs/${cidPath}`;
              } else if (!img.dataset.fallback2) {
                // Final guard: stop retrying broken CIDs after one IPFS attempt.
                img.dataset.fallback2 = "1";
                img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${card.giglingId}`;
              }
            }}
          />
        ) : (
          <div className="relative z-10 w-full h-full flex items-center justify-center text-white/20 text-xs">
            No Image
          </div>
        )}

        {/* Rarity chip (top-left) */}
        <div
          className="absolute top-1.5 left-1.5 z-20 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm"
          style={{ color: rarity.glow, background: `${rarity.base}26`, border: `1px solid ${rarity.base}66` }}
        >
          <img src={rarity.icon} alt="" aria-hidden className="h-2.5 w-2.5 [image-rendering:pixelated]" />
          {card.rarity}
        </div>

        {/* OVR chip (top-right) */}
        <div
          className="absolute top-1.5 right-1.5 z-20 w-8 h-8 rounded-lg flex items-center justify-center bg-background/80 backdrop-blur-sm shadow"
          style={{ border: `1.5px solid ${rarity.base}` }}
        >
          <span className="font-mono font-bold text-xs text-white">{card.ovr}</span>
        </div>

        {/* Faction chip (bottom-left) */}
        <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-1 rounded-md bg-background/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-semibold text-white/90">
          {faction.logo ? (
            <img src={faction.logo} alt={card.faction} className="h-3 w-3 [image-rendering:pixelated]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: faction.color }} />
          )}
          {card.faction}
        </div>
      </div>

      {/* Details */}
      <div className="relative z-10 p-2.5 flex flex-col gap-2 bg-surface/90 border-t border-white/5">
        <h3 className="font-heading font-bold text-sm leading-tight truncate">{card.name}</h3>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <StatBar label="ATK" value={card.attack} colorHex="#FF4757" icon={<Sword size={11} />} />
          <StatBar label="DEF" value={card.defense} colorHex="#3B82F6" icon={<Shield size={11} />} />
          <StatBar label="SPD" value={card.speed} colorHex="#FFD700" icon={<Zap size={11} />} />
          <StatBar label="HP" value={card.health} colorHex="#00D9A6" icon={<Heart size={11} />} />
        </div>

        {(card.specialAbility || card.passiveAbility) && (
          <div className="pt-1.5 border-t border-white/5 space-y-0.5">
            {card.specialAbility && (
              <div className="text-[10px] flex items-start gap-1">
                <span className="text-accent font-bold">S</span>
                <span className="text-white/70 leading-tight truncate">{card.specialAbility}</span>
              </div>
            )}
            {card.passiveAbility && (
              <div className="text-[10px] flex items-start gap-1">
                <span className="text-primary font-bold">P</span>
                <span className="text-white/70 leading-tight truncate">{card.passiveAbility}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Memoized: card grids render dozens of these; props are stable per card.
export const CardDisplay = memo(CardDisplayBase);

// Rarity treatments: colored BORDER + hover glow only (no whole-card tint, no
// color-changing animations). Colors are sampled from the rarity icons. Giga
// uses a static multi-color gradient border to mark the apex tier.
function getRarityStyles(rarity: string) {
  switch (rarity.toUpperCase()) {
    case 'COMMON':
      return { borderClass: 'border-[#9BABB2]/40', hoverClass: 'hover:shadow-[0_0_16px_rgba(155,171,178,0.3)]' };
    case 'UNCOMMON':
      return { borderClass: 'border-[#1EBC73]/60', hoverClass: 'hover:shadow-[0_0_18px_rgba(30,188,115,0.4)]' };
    case 'RARE':
      return { borderClass: 'border-[#02C6D7]/70', hoverClass: 'hover:shadow-[0_0_20px_rgba(2,198,215,0.45)]' };
    case 'EPIC':
      return { borderClass: 'border-[#DE38E1]/80', hoverClass: 'hover:shadow-[0_0_24px_rgba(222,56,225,0.5)]' };
    case 'LEGENDARY':
      return { borderClass: 'border-[#F79617]', hoverClass: 'hover:shadow-[0_0_28px_rgba(247,150,23,0.55)]' };
    case 'RELIC':
      return { borderClass: 'border-[#F04F78]', hoverClass: 'hover:shadow-[0_0_30px_rgba(240,79,120,0.55)]' };
    case 'GIGA':
      return { borderClass: 'border-transparent [background:linear-gradient(var(--surface),var(--surface))_padding-box,linear-gradient(120deg,#F04F78,#F79617,#DE38E1,#02C6D7)_border-box]', hoverClass: 'hover:shadow-[0_0_36px_rgba(247,150,23,0.5)]' };
    default:
      return { borderClass: 'border-white/10', hoverClass: 'hover:border-white/30' };
  }
}
