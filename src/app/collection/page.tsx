"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { CardGrid } from "@/components/cards/CardGrid";
import type { FilterState } from "@/components/cards/CardFilters";
import { Button } from "@/components/ui/Button";

// Lazy load the filters to reduce initial bundle size and improve TTI
const CardFilters = dynamic(() => import("@/components/cards/CardFilters").then((mod) => mod.CardFilters), {
  ssr: false,
});
import { Download, Wallet } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/Toast";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useDecks } from "@/hooks/useDecks";
import type { CardDisplay } from "@/types/card";

const FACTIONS = ["CRUSADER", "OVERSEER", "ATHENA", "ARCHON", "FOXGLOVE", "SUMMONER", "CHOBO", "GIGUS"];
const RARITIES = ["UNCOMMON", "RARE", "EPIC", "LEGENDARY", "RELIC", "GIGA"];
const PAGE_SIZE = 24;

interface Stats {
  total: number;
  avgOvr: number;
  topOvr: number;
  rarityBreakdown: Record<string, number>;
}

export default function CollectionPage() {
  const { address, isConnected, isConnecting, connect } = useWallet();
  const { decks = [] } = useDecks(address);
  const toast = useToast();
  const [cards, setCards] = useState<CardDisplay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Wallets we've already auto-imported this session (prevents re-firing).
  const autoImportedRef = useRef<Set<string>>(new Set());

  const fetchPage = useCallback(
    async (f: FilterState | null, p: number, append: boolean, hasExisting = false) => {
      if (!address) return;
      // Append loads run alongside; non-append loads supersede prior requests.
      if (!append) abortRef.current?.abort();
      const controller = new AbortController();
      if (!append) abortRef.current = controller;
      if (append) setLoadingMore(true);
      else if (hasExisting) setIsRefetching(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ owner: address, page: String(p), limit: String(PAGE_SIZE) });
        if (f?.faction) params.set("faction", f.faction);
        if (f?.rarity) params.set("rarity", f.rarity);
        if (f?.search) params.set("search", f.search);
        if (f?.sort) params.set("sort", f.sort);
        if (p === 1) params.set("stats", "1"); // aggregate only on first page
        const res = await fetch(`/api/cards/explore?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (data.success) {
          setCards((prev) => (append ? [...prev, ...data.cards] : data.cards));
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
          if (p === 1 && data.stats) setStats(data.stats);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to load collection", err);
          toast.error("Failed to load your collection.");
        }
      } finally {
        if (append) setLoadingMore(false);
        else { setLoading(false); setIsRefetching(false); setInitialLoaded(true); }
      }
    },
    [address, toast],
  );

  // Reset per-wallet load state when the connected address changes.
  useEffect(() => { setInitialLoaded(false); }, [address]);

  useEffect(() => {
    if (address) fetchPage(filters, 1, false, cards.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, filters, fetchPage]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loadingMore && !loading) {
          fetchPage(filters, page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [observerTarget, page, totalPages, loadingMore, loading, filters, fetchPage]);

  const importGiglings = async (auto = false) => {
    if (!address) return;
    setImporting(true);
    const tid = toast.loading(auto ? "Importing your Giglings…" : "Reading your Giglings from the chain…");
    try {
      const res = await fetch("/api/giglings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();
      if (data.success) {
        const total = data.cardsAdded + data.cardsUpdated;
        if (data.petIds.length === 0) {
          toast.show("info", "No Gigling NFTs found on-chain for this wallet.", { id: tid });
        } else {
          toast.show("success", `Imported ${total} Gigling${total === 1 ? "" : "s"} (${data.cardsAdded} new).`, { id: tid });
        }
        fetchPage(filters, 1, false, cards.length > 0);
      } else {
        toast.show("error", `Import failed: ${data.error || "Unknown error"}`, { id: tid });
      }
    } catch {
      toast.show("error", "Network error during import.", { id: tid });
    } finally {
      setImporting(false);
    }
  };

  // ── Auto-import on first login ──
  // Once the (unfiltered) collection has loaded and it's empty, pull the wallet's
  // Giglings from chain automatically — one time per wallet, no extra click.
  useEffect(() => {
    if (!address || !initialLoaded || importing || filters) return;
    if (cards.length > 0) return;
    if (autoImportedRef.current.has(address)) return;
    autoImportedRef.current.add(address);
    importGiglings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, initialLoaded, importing, cards.length, filters]);

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-6 sm:px-8 py-24 text-center">
        <Wallet className="mx-auto text-white/40 mb-4" size={48} />
        <h1 className="text-3xl font-heading font-bold mb-4">My Collection</h1>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          Connect your Abstract Global Wallet to view and import your Gigling cards.
        </p>
        <Button variant="primary" onClick={connect} isLoading={isConnecting}>
          Connect Abstract Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 sm:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1">My Collection</h1>
          <p className="text-white/60 text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          <Button variant="primary" onClick={() => importGiglings(false)} isLoading={importing}>
            <Download size={16} className="mr-2" />
            {cards.length > 0 ? "Re-sync from chain" : "Import Giglings"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Cards" value={stats?.total ?? 0} />
        <StatCard label="Avg OVR" value={stats?.avgOvr ?? 0} />
        <StatCard label="Top OVR" value={stats?.topOvr ?? 0} />
        <StatCard
          label="Rarities"
          value={stats ? Object.keys(stats.rarityBreakdown).length : 0}
          sub={
            stats
              ? RARITIES.filter((r) => stats.rarityBreakdown[r])
                  .map((r) => `${r[0]}${stats.rarityBreakdown[r]}`)
                  .join(" ")
              : undefined
          }
        />
      </div>

      {/* First-time auto-import in progress: prominent status panel */}
      {importing && cards.length === 0 ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-12 text-center mb-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: "rgba(226,59,214,0.18)" }} />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-5">
              <Download size={26} className="text-primary animate-bounce" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-2">Importing your Giglings…</h3>
            <p className="text-white/50 max-w-sm mb-5">Reading your NFTs on-chain and generating their cards. This only takes a moment.</p>
            <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-accent animate-[shimmer_1.4s_linear_infinite]" style={{ backgroundSize: "200% 100%" }} />
            </div>
          </div>
        </div>
      ) : (
        !loading && cards.length === 0 && (
          <OnboardingChecklist
            connected={!!address}
            hasCards={cards.length > 0}
            hasTeam={decks.length > 0}
            className="mb-8 max-w-xl"
          />
        )
      )}

      <CardFilters factions={FACTIONS} rarities={RARITIES} onFilterChange={setFilters} />

      <div className={`transition-opacity duration-200 ${isRefetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        <CardGrid
          cards={cards}
          isLoading={loading}
          skeletonCount={PAGE_SIZE}
          emptyMessage="No cards yet. Click 'Import Giglings from chain' to pull your NFTs."
        />
      </div>

      {page < totalPages && (
        <div ref={observerTarget} className="flex justify-center mt-8 py-4">
          <Button variant="secondary" onClick={() => fetchPage(filters, page + 1, true)} isLoading={loadingMore}>
            {loadingMore ? "Loading more cards..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-4">
      <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-mono font-bold text-white">{value}</div>
      {sub && <div className="text-[10px] text-white/40 font-mono mt-1 truncate">{sub}</div>}
    </div>
  );
}
