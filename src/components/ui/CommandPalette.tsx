"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Swords, Shield, Trophy, User, Layers, Loader2, CornerDownLeft } from "lucide-react";

interface CardHit { id: string; name: string; giglingId: string; rarity: string; ovr: number; }

const PAGES = [
  { label: "Explorer", href: "/explorer", icon: Layers },
  { label: "Collection", href: "/collection", icon: Shield },
  { label: "Team Builder", href: "/team-builder", icon: Shield },
  { label: "Arena", href: "/arena", icon: Swords },
  { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CardHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Global ⌘K / Ctrl-K toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else { setQuery(""); setHits([]); }
  }, [open]);

  // Debounced card search.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (!q) { setHits([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/cards/explore?search=${encodeURIComponent(q)}&limit=6`, { signal: controller.signal });
        const data = await res.json();
        if (data.success) setHits(data.cards);
      } catch { /* aborted/ignored */ } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    }, 250);
  }, [query]);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);

  const filteredPages = PAGES.filter((p) => p.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c16] shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search size={18} className="text-white/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Giglings or jump to a page…"
                className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm"
              />
              {loading && <Loader2 size={15} className="animate-spin text-white/40" />}
              <kbd className="text-[10px] font-mono text-white/30 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filteredPages.length > 0 && (
                <div className="mb-1">
                  <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-white/30 font-bold">Pages</div>
                  {filteredPages.map((p) => (
                    <button key={p.href} onClick={() => go(p.href)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-left text-sm text-white/80">
                      <p.icon size={15} className="text-white/40" /> {p.label}
                    </button>
                  ))}
                </div>
              )}

              {hits.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-white/30 font-bold">Giglings</div>
                  {hits.map((c) => (
                    <button key={c.id} onClick={() => go(`/cards/${c.id}`)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 text-left">
                      <span className="text-sm text-white/90 flex-1 truncate">{c.name}</span>
                      <span className="text-[10px] font-mono text-white/30">#{c.giglingId}</span>
                      <span className="text-xs font-mono font-bold text-primary">OVR {c.ovr}</span>
                    </button>
                  ))}
                </div>
              )}

              {query.trim() && !loading && hits.length === 0 && filteredPages.length === 0 && (
                <div className="px-2 py-6 text-center text-sm text-white/40">No results for “{query}”.</div>
              )}
              {!query.trim() && (
                <div className="px-2 py-3 text-[11px] text-white/30 flex items-center gap-2">
                  <CornerDownLeft size={12} /> Type to search · ⌘K to toggle
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
