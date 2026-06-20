"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from "lucide-react";

type ToastKind = "success" | "error" | "info" | "loading";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  show: (kind: ToastKind, message: string, opts?: { duration?: number; id?: number }) => number;
  success: (message: string, duration?: number) => number;
  error: (message: string, duration?: number) => number;
  info: (message: string, duration?: number) => number;
  loading: (message: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastKind, { color: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
  success: { color: "#6ee7b7", bg: "rgba(16,185,129,0.14)", border: "rgba(16,185,129,0.4)", Icon: CheckCircle2 },
  error: { color: "#fca5a5", bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.4)", Icon: AlertCircle },
  info: { color: "#93c5fd", bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.4)", Icon: Info },
  loading: { color: "#c4b5fd", bg: "rgba(139,92,246,0.14)", border: "rgba(139,92,246,0.4)", Icon: Loader2 },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const show = useCallback<ToastApi["show"]>((kind, message, opts) => {
    const id = opts?.id ?? ++idRef.current;
    setToasts((t) => {
      const existing = t.find((x) => x.id === id);
      if (existing) return t.map((x) => (x.id === id ? { ...x, kind, message } : x));
      return [...t, { id, kind, message }];
    });
    // Clear any prior timer for this id (e.g. loading -> success reuse).
    const prev = timers.current.get(id);
    if (prev) clearTimeout(prev);
    // Loading toasts persist until updated/dismissed.
    const duration = opts?.duration ?? (kind === "loading" ? 0 : 4000);
    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [dismiss]);

  const api: ToastApi = {
    show,
    success: (m, d) => show("success", m, { duration: d }),
    error: (m, d) => show("error", m, { duration: d }),
    info: (m, d) => show("info", m, { duration: d }),
    loading: (m) => show("loading", m),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-[min(360px,calc(100vw-2rem))]">
        <AnimatePresence>
          {toasts.map((t) => {
            const s = STYLES[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
                style={{ background: s.bg, border: `1px solid ${s.border}`, backdropFilter: "blur(10px)", color: s.color }}
              >
                <s.Icon size={17} className={t.kind === "loading" ? "animate-spin shrink-0" : "shrink-0"} />
                <span className="flex-1 leading-snug">{t.message}</span>
                <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-white transition-colors shrink-0">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
