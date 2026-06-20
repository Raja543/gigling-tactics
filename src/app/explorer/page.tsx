"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { FilterState } from "@/components/cards/CardFilters";

// Lazy load the filters
const CardFilters = dynamic(() => import("@/components/cards/CardFilters").then((mod) => mod.CardFilters), {
  ssr: false,
});
import { CardGrid } from "@/components/cards/CardGrid";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import type { CardDisplay } from "@/types/card";

const PAGE_SIZE = 48;

// Serialize only the filter fields (sort/search/faction/rarity) so we can tell
// a filter change (reset total) apart from a page change (reuse total).
function filterKey(f: FilterState | undefined) {
  return `${f?.faction ?? ""}|${f?.rarity ?? ""}|${f?.search ?? ""}|${f?.sort ?? ""}`;
}

export default function ExplorerPage() {
  const toast = useToast();
  const [cards, setCards] = useState<CardDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState<FilterState | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Cached total per filter set, so paging doesn't re-run COUNT(*).
  const totalByFilter = useRef<Map<string, number>>(new Map());
  // Abort in-flight requests when a newer one supersedes them.
  const abortRef = useRef<AbortController | null>(null);

  const fetchCards = useCallback(
    async (f: FilterState | undefined, p: number, hasExisting: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      // First load shows skeletons; later loads dim the existing grid instead.
      if (hasExisting) setIsRefetching(true);
      else setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (f?.faction) params.append("faction", f.faction);
        if (f?.rarity) params.append("rarity", f.rarity);
        if (f?.search) params.append("search", f.search);
        if (f?.sort) params.append("sort", f.sort);
        params.append("page", String(p));
        params.append("limit", String(PAGE_SIZE));
        // Reuse a known total for this filter set to skip the COUNT(*).
        const known = totalByFilter.current.get(filterKey(f));
        if (known !== undefined) params.append("count", String(known));

        const res = await fetch(`/api/cards/explore?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (data.success) {
          setCards(data.cards);
          setTotal(data.total ?? data.cards.length);
          setTotalPages(data.totalPages ?? 1);
          totalByFilter.current.set(filterKey(f), data.total ?? data.cards.length);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to fetch cards", err);
          toast.error("Failed to load cards.");
        }
        return;
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
          setIsRefetching(false);
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchCards(filters, page, cards.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, fetchCards]);

  // Scroll back to the top of the grid when the page changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleFilterChange = (f: FilterState) => {
    setPage(1);
    setFilters(f);
  };

  const handleSync = async () => {
    // The sync endpoint is admin-gated. The token is never in the bundle: the
    // operator pastes it once and we keep it in sessionStorage for the session.
    let token = sessionStorage.getItem("adminSyncToken");
    if (!token) {
      token = window.prompt("Enter admin sync token") ?? "";
      if (!token) return;
      sessionStorage.setItem("adminSyncToken", token);
    }

    setIsSyncing(true);
    const tid = toast.loading("Syncing leaderboard… this can take a minute.");
    try {
      const res = await fetch("/api/cards/sync", {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("adminSyncToken"); // bad/expired token
        toast.show("error", "Unauthorized — invalid admin token.", { id: tid });
        return;
      }
      const data = await res.json();
      if (data.success) {
        totalByFilter.current.clear(); // population changed
        toast.show("success", `Synced! Added ${data.cardsAdded}, updated ${data.cardsUpdated}.`, { id: tid });
        fetchCards(filters, page, cards.length > 0);
      } else {
        toast.show("error", "Failed to sync: " + (data.error || "Unknown error"), { id: tid });
      }
    } catch {
      toast.show("error", "Failed to sync.", { id: tid });
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

      <div className={`transition-opacity duration-200 ${isRefetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        <CardGrid
          cards={cards}
          isLoading={isLoading}
          skeletonCount={cards.length || PAGE_SIZE}
          emptyMessage="No cards found. Try adjusting your filters or syncing the leaderboard."
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading || isRefetching}
          >
            <ChevronLeft size={16} className="mr-1" /> Prev
          </Button>
          <span className="text-sm text-white/60 font-mono">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading || isRefetching}
          >
            Next <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
