"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  colorHex: string;
  className?: string;
  icon?: React.ReactNode;
}

export function StatBar({ label, value, maxValue = 99, colorHex, className, icon }: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-white/70">
          {icon && <span style={{ color: colorHex }}>{icon}</span>}
          <span className="font-medium font-sans">{label}</span>
        </div>
        <span className="font-mono text-white/90">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: colorHex, boxShadow: `0 0 8px ${colorHex}80` }}
        />
      </div>
    </div>
  );
}
