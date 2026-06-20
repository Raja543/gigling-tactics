"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Upload, Swords, Star, Pencil, Check, X } from "lucide-react";
import { rarityStyle } from "@/lib/cosmetics";

interface SavedDecksProps {
  decks: any[];
  isLoading?: boolean;
  onLoad: (deck: any) => void;
  onDelete: (deckId: string) => void;
  onRename: (deckId: string, name: string) => void;
}

export function SavedDecks({ decks, isLoading, onLoad, onDelete, onRename }: SavedDecksProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (deck: any) => {
    setEditId(deck.id);
    setEditName(deck.name);
  };
  const commitEdit = () => {
    if (editId && editName.trim()) onRename(editId, editName.trim());
    setEditId(null);
  };

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface/50 border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!decks || decks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/50 text-sm">
        No saved teams yet. Build a squad above and hit <span className="text-white">Save Team</span>.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <AnimatePresence>
        {decks.map((deck) => {
          const cards = [...(deck.deckCards || [])].sort((a, b) => a.slotPosition - b.slotPosition);
          return (
            <motion.div
              key={deck.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-white/10 rounded-xl p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0 flex-1">
                  {editId === deck.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={editName}
                        maxLength={24}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditId(null);
                        }}
                        className="bg-background border border-primary/50 rounded px-2 py-0.5 text-sm font-bold text-white w-full focus:outline-none"
                      />
                      <button onClick={commitEdit} className="text-emerald-400 hover:text-emerald-300 p-1" aria-label="Save name"><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} className="text-white/40 hover:text-white p-1" aria-label="Cancel"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-bold text-white truncate">{deck.name}</h3>
                      <button onClick={() => startEdit(deck)} className="text-white/30 hover:text-primary transition-colors shrink-0" aria-label="Rename team">
                        <Pencil size={12} />
                      </button>
                      {deck.isActive && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-accent bg-accent/15 rounded px-1.5 py-0.5">
                          <Star size={9} /> Active
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 text-[11px] text-white/50 mt-0.5 font-mono">
                    <span>PWR {deck.teamPower}</span>
                    {deck.predictedWinRate != null && <span className="text-primary">WR {deck.predictedWinRate}%</span>}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(deck.id)}
                  className="text-white/30 hover:text-red-400 transition-colors p-1 shrink-0"
                  aria-label="Delete team"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Mini card thumbnails */}
              <div className="flex gap-2 mb-3">
                {cards.map((dc: any) => {
                  const r = rarityStyle(dc.card.rarity);
                  return (
                    <div
                      key={dc.id}
                      className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-background"
                      style={{ border: `1px solid ${r.base}66` }}
                    >
                      {dc.card.imageUrl ? (
                        <img src={dc.card.imageUrl} alt={dc.card.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-[9px] text-white/30">?</span>
                      )}
                      <span className="absolute bottom-0 right-0 bg-background/80 text-[8px] font-mono text-white px-1 rounded-tl">
                        {dc.card.ovr}
                      </span>
                    </div>
                  );
                })}
              </div>

              {deck.synergyType && (
                <div className="text-[10px] text-white/45 mb-3 truncate">Synergy: {deck.synergyType}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onLoad(deck)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg bg-white/5 hover:bg-white/10 text-white py-2 transition-colors"
                >
                  <Upload size={13} /> Load
                </button>
                <Link
                  href="/arena"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg bg-primary/20 hover:bg-primary/30 text-primary py-2 transition-colors"
                >
                  <Swords size={13} /> Battle
                </Link>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
