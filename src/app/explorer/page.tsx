"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { FilterState } from "@/components/cards/CardFilters";

// Lazy load the filters
const CardFilters = dynamic(() => import("@/components/cards/CardFilters").then((mod) => mod.CardFilters), {
  ssr: false,
});
import { CardGrid } from "@/components/cards/CardGrid";
import { Button } from "@/components/ui/Button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import type { CardDisplay } from "@/types/card";

const PAGE_SIZE = 48;

export default function ExplorerPage() {
  const [cards, setCards] = useState<CardDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState<FilterState | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCards = useCallback(
    async (f: FilterState | undefined, p: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (f?.faction) params.append("faction", f.faction);
        if (f?.rarity) params.append("rarity", f.rarity);
        if (f?.search) params.append("search", f.search);
        if (f?.sort) params.append("sort", f.sort);
        params.append("page", String(p));
        params.append("limit", String(PAGE_SIZE));

        const res = await fetch(`/api/cards/explore?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setCards(data.cards);
          setTotal(data.total ?? data.cards.length);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch (err) {
        console.error("Failed to fetch cards", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCards(filters, page);
  }, [filters, page, fetchCards]);

  const handleFilterChange = (f: FilterState) => {
    setPage(1);
    setFilters(f);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cards/sync");
      const data = await res.json();
      if (data.success) {
        alert(`Synced! Added: ${data.cardsAdded}, Updated: ${data.cardsUpdated}`);
        fetchCards(filters, page);
      } else {
        alert("Failed to sync: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Failed to sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const FACTIONS = ["CRUSADER", "OVERSEER", "ATHENA", "ARCHON", "FOXGLOVE", "SUMMONER", "CHOBO", "GIGUS"];
  const RARITIES = ["UNCOMMON", "RARE", "EPIC", "LEGENDARY", "RELIC", "GIGA"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Card Explorer</h1>
          <p className="text-white/60">
            Browse all {total.toLocaleString()} racing Giglings in the system.
          </p>
        </div>
        <Button onClick={handleSync} isLoading={isSyncing} variant="primary">
          <RefreshCw size={16} className={`mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          Sync Leaderboard
        </Button>
      </div>

      <CardFilters factions={FACTIONS} rarities={RARITIES} onFilterChange={handleFilterChange} />

      <CardGrid
        cards={cards}
        isLoading={isLoading}
        emptyMessage="No cards found. Try adjusting your filters or syncing the leaderboard."
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft size={16} className="mr-1" /> Prev
          </Button>
          <span className="text-sm text-white/60 font-mono">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
