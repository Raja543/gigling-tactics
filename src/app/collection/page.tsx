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
  const [cards, setCards] = useState<CardDisplay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (f: FilterState | null, p: number, append: boolean) => {
      if (!address) return;
      append ? setLoadingMore(true) : setLoading(true);
      try {
        const params = new URLSearchParams({ owner: address, page: String(p), limit: String(PAGE_SIZE) });
        if (f?.faction) params.set("faction", f.faction);
        if (f?.rarity) params.set("rarity", f.rarity);
        if (f?.search) params.set("search", f.search);
        if (f?.sort) params.set("sort", f.sort);
        if (p === 1) params.set("stats", "1"); // aggregate only on first page
        const res = await fetch(`/api/cards/explore?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setCards((prev) => (append ? [...prev, ...data.cards] : data.cards));
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
          if (p === 1 && data.stats) setStats(data.stats);
        }
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [address],
  );

  useEffect(() => {
    if (address) fetchPage(filters, 1, false);
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

  const importGiglings = async () => {
    if (!address) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/giglings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();
      if (data.success) {
        const total = data.cardsAdded + data.cardsUpdated;
        setImportMsg(
          data.petIds.length === 0
            ? "No Gigling NFTs found on-chain for this wallet."
            : `Imported ${total} Gigling${total === 1 ? "" : "s"} (${data.cardsAdded} new).`,
        );
        fetchPage(filters, 1, false);
      } else {
        setImportMsg(`Import failed: ${data.error}`);
      }
    } catch {
      setImportMsg("Network error during import.");
    } finally {
      setImporting(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1">My Collection</h1>
          <p className="text-white/60 text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          <Button variant="primary" onClick={importGiglings} isLoading={importing}>
            <Download size={16} className="mr-2" />
            Import Giglings from chain
          </Button>
          {importMsg && <p className="text-sm text-white/60">{importMsg}</p>}
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

      <CardFilters factions={FACTIONS} rarities={RARITIES} onFilterChange={setFilters} />

      <CardGrid
        cards={cards}
        isLoading={loading}
        emptyMessage="No cards yet. Click 'Import Giglings from chain' to pull your NFTs."
      />

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
