"use client";

import { motion } from "framer-motion";
import { CardDisplay } from "./CardDisplay";
import type { CardDisplay as CardType } from "@/types/card";

interface CardGridProps {
  cards: CardType[];
  isLoading?: boolean;
  emptyMessage?: string;
  onCardClick?: (card: CardType) => void;
  selectedIds?: Set<string>;
  skeletonCount?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      // Quick, capped stagger so a full page (48) finishes appearing in <0.5s.
      staggerChildren: 0.025,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function CardGrid({ cards, isLoading, emptyMessage = "No cards found.", onCardClick, selectedIds, skeletonCount = 12 }: CardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="rounded-xl bg-surface/50 border border-white/5 aspect-[3/4] animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 border border-white/5">
          <span className="text-2xl opacity-50">🎴</span>
        </div>
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6"
    >
      {cards.map((card) => (
        <motion.div key={card.id || card.giglingId} variants={item}>
          <CardDisplay
            card={card}
            onClick={onCardClick ? () => onCardClick(card) : undefined}
            selected={selectedIds?.has(card.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
