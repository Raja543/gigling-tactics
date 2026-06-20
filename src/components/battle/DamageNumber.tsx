"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface DamageNumberProps {
  amount: number;
  isCritical: boolean;
  type: 'damage' | 'heal';
  onComplete: () => void;
}

export function DamageNumber({ amount, isCritical, type, onComplete }: DamageNumberProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const color = type === 'heal' ? 'text-green-400' : isCritical ? 'text-yellow-400' : 'text-red-500';
  const size = isCritical ? 'text-3xl font-black' : 'text-xl font-bold';
  const prefix = type === 'heal' ? '+' : '-';

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: -50, scale: isCritical ? [0.5, 1.5, 1] : 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`absolute z-50 pointer-events-none drop-shadow-md ${color} ${size} font-mono`}
      style={{
        textShadow: "0px 2px 4px rgba(0,0,0,0.8), 0px 0px 10px rgba(0,0,0,0.5)"
      }}
    >
      {prefix}{amount}
      {isCritical && <span className="block text-xs text-center text-yellow-200 uppercase tracking-widest mt-1">Critical</span>}
    </motion.div>
  );
}
