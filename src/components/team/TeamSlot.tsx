"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CardDisplay } from "@/components/cards/CardDisplay";
import { CardDisplay as CardType } from "@/types/card";
import { X, Plus } from "lucide-react";

interface TeamSlotProps {
  label: string;
  card: CardType | null;
  onRemove: () => void;
  onClickSlot: () => void;
}

export function TeamSlot({ label, card, onRemove, onClickSlot }: TeamSlotProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-center text-xs font-bold text-white/40 uppercase tracking-widest">
        {label}
      </div>

      <AnimatePresence mode="wait">
        {card ? (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="relative group"
          >
            <CardDisplay card={card} interactive={false} />
            <button
              onClick={onRemove}
              className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-lg z-40 cursor-pointer"
              aria-label="Remove card"
            >
              <X size={15} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClickSlot}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/15 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-white/40 hover:text-primary"
          >
            <Plus size={28} className="mb-2" />
            <span className="text-xs font-medium">Pick a card</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
