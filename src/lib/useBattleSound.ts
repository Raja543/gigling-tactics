"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundKind = "hit" | "crit" | "special" | "heal" | "ko" | "victory" | "defeat";

const PREF_KEY = "battleSoundEnabled";

// Short synthesized cues via Web Audio — no audio files, tiny footprint.
const TONES: Record<SoundKind, { freq: number; type: OscillatorType; dur: number; gain: number; sweep?: number }> = {
  hit: { freq: 220, type: "square", dur: 0.08, gain: 0.18 },
  crit: { freq: 660, type: "sawtooth", dur: 0.18, gain: 0.25, sweep: -300 },
  special: { freq: 520, type: "triangle", dur: 0.22, gain: 0.22, sweep: 240 },
  heal: { freq: 880, type: "sine", dur: 0.16, gain: 0.16, sweep: 220 },
  ko: { freq: 140, type: "sawtooth", dur: 0.32, gain: 0.28, sweep: -90 },
  victory: { freq: 523, type: "triangle", dur: 0.5, gain: 0.25, sweep: 400 },
  defeat: { freq: 196, type: "sine", dur: 0.5, gain: 0.22, sweep: -120 },
};

export function useBattleSound() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setEnabled(typeof window !== "undefined" && localStorage.getItem(PREF_KEY) === "1");
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(PREF_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const play = useCallback((kind: SoundKind) => {
    if (!enabled) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = ctxRef.current ?? (ctxRef.current = new Ctx());
      if (ctx.state === "suspended") ctx.resume();
      const t = TONES[kind];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type;
      osc.frequency.setValueAtTime(t.freq, ctx.currentTime);
      if (t.sweep) osc.frequency.linearRampToValueAtTime(Math.max(40, t.freq + t.sweep), ctx.currentTime + t.dur);
      gain.gain.setValueAtTime(t.gain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + t.dur);
    } catch { /* audio not available — silent */ }
  }, [enabled]);

  return { enabled, toggle, play };
}
