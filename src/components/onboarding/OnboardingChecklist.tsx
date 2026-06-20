"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Wallet, Download, Shield, Swords, ArrowRight } from "lucide-react";

interface OnboardingChecklistProps {
  connected: boolean;
  hasCards: boolean;
  hasTeam: boolean;
  className?: string;
}

/**
 * Guided first-run path: Connect -> Import -> Build -> Battle. Each step shows
 * done / current / upcoming based on real state, with a CTA for the current one.
 */
export function OnboardingChecklist({ connected, hasCards, hasTeam, className = "" }: OnboardingChecklistProps) {
  const steps = [
    { key: "connect", label: "Connect your wallet", icon: Wallet, done: connected, href: undefined as string | undefined, cta: "Connect" },
    { key: "import", label: "Import your Giglings from chain", icon: Download, done: hasCards, href: "/collection", cta: "Go to Collection" },
    { key: "build", label: "Build a 3-unit team", icon: Shield, done: hasTeam, href: "/team-builder", cta: "Open Team Builder" },
    { key: "battle", label: "Enter the Arena", icon: Swords, done: false, href: "/arena", cta: "Battle now" },
  ];

  const currentIndex = steps.findIndex((s) => !s.done);
  if (currentIndex === -1) return null; // fully onboarded

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/10 bg-surface/60 p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Get Started</h3>
        <span className="text-xs font-mono text-white/40">
          {steps.filter((s) => s.done).length}/{steps.length}
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isCurrent ? "bg-primary/10 border border-primary/30" : "border border-transparent"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? "bg-emerald-500/20 text-emerald-400" : isCurrent ? "bg-primary/20 text-primary" : "bg-white/5 text-white/30"
                }`}
              >
                {step.done ? <Check size={15} strokeWidth={3} /> : <Icon size={14} />}
              </div>
              <span className={`flex-1 text-sm font-medium ${step.done ? "text-white/40 line-through" : isCurrent ? "text-white" : "text-white/50"}`}>
                {step.label}
              </span>
              {isCurrent && step.href && (
                <Link href={step.href}>
                  <span className="flex items-center gap-1 text-xs font-bold text-primary hover:underline whitespace-nowrap">
                    {step.cta} <ArrowRight size={13} />
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
