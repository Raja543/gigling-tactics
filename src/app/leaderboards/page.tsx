"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, Star, Layers, Swords } from "lucide-react";
import { rarityStyle } from "@/lib/cosmetics";
import { calculateRank } from "@/engine/ranking";

function rankBadge(rank: number) {
  if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={18} className="text-gray-300" />;
  if (rank === 3) return <Medal size={18} className="text-amber-700" />;
  return <span className="font-mono text-white/40 text-sm">{rank}</span>;
}

const shortAddr = (a: string) => a.slice(0, 6) + "..." + a.slice(-4);

export default function LeaderboardsPage() {
  const [tab, setTab] = useState<"arena" | "players" | "cards">("arena");
  const [data, setData] = useState<{ cards: any[]; players: any[]; arenaPlayers: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboards")
      .then((r) => r.json())
      .then((d) => setData({ cards: d.cards || [], players: d.players || [], arenaPlayers: d.arenaPlayers || [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <Trophy className="mx-auto text-accent mb-4" size={48} />
        <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-widest mb-3">Leaderboards</h1>
        <p className="text-white/60 max-w-xl mx-auto">Top collectors and the most powerful Giglings in the Gigaverse.</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-surface border border-white/10 rounded-xl p-1">
          {([["arena", "Arena", <Swords key="a" size={15} />], ["players", "Collectors", <Layers key="l" size={15} />], ["cards", "Cards", <Star key="s" size={15} />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-bold transition-colors ${tab === id ? "bg-primary text-white" : "text-white/55 hover:text-white"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center text-white/40 py-20">Loading rankings...</div>
        ) : tab === "arena" ? (
          <ArenaTable players={data?.arenaPlayers || []} />
        ) : tab === "players" ? (
          <PlayersTable players={data?.players || []} />
        ) : (
          <CardsTable cards={data?.cards || []} />
        )}
      </div>
    </div>
  );
}

function ArenaTable({ players }: { players: any[] }) {
  if (players.length === 0) return <Empty msg="No ranked battles yet. Enter the Arena to claim a rank!" />;
  return (
    <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider bg-black/20">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4 sm:col-span-4">Player</div>
        <div className="col-span-3 sm:col-span-3">Rank</div>
        <div className="hidden sm:block col-span-2 text-right">W / L</div>
        <div className="col-span-4 sm:col-span-2 text-right">ELO</div>
      </div>
      <div className="divide-y divide-white/5">
        {players.map((p, i) => {
          const rank = calculateRank(p.eloRating, p.totalBattles);
          return (
            <div key={p.walletAddress} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-1 flex justify-center">{rankBadge(i + 1)}</div>
              <div className="col-span-4 sm:col-span-4 font-medium text-white truncate">{p.username || shortAddr(p.walletAddress)}</div>
              <div className="col-span-3 sm:col-span-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ color: rank.color, background: `${rank.color}1f`, border: `1px solid ${rank.color}55` }}>
                  {rank.label}
                </span>
              </div>
              <div className="hidden sm:block col-span-2 text-right font-mono text-xs text-white/50">{p.battlesWon}/{p.battlesLost}</div>
              <div className="col-span-4 sm:col-span-2 text-right font-mono text-lg font-bold text-accent">{p.eloRating}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayersTable({ players }: { players: any[] }) {
  if (players.length === 0) return <Empty msg="No players yet." />;
  return (
    <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider bg-black/20">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5 sm:col-span-4">Player</div>
        <div className="col-span-2 text-right">Cards</div>
        <div className="hidden sm:block col-span-2 text-right">W / L</div>
        <div className="col-span-4 sm:col-span-3 text-right">Score</div>
      </div>
      <div className="divide-y divide-white/5">
        {players.map((p, i) => (
          <div key={p.walletAddress} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors">
            <div className="col-span-1 flex justify-center">{rankBadge(i + 1)}</div>
            <div className="col-span-5 sm:col-span-4 font-medium text-white truncate">{p.username || shortAddr(p.walletAddress)}</div>
            <div className="col-span-2 text-right font-mono text-white/70">{p.cardCount}</div>
            <div className="hidden sm:block col-span-2 text-right font-mono text-xs text-white/50">{p.battlesWon}/{p.battlesLost}</div>
            <div className="col-span-4 sm:col-span-3 text-right font-mono text-lg font-bold text-primary flex items-center justify-end gap-1">
              <Layers size={13} className="text-primary/60" />{p.collectionScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardsTable({ cards }: { cards: any[] }) {
  if (cards.length === 0) return <Empty msg="No cards yet." />;
  return (
    <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider bg-black/20">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-6 sm:col-span-5">Gigling</div>
        <div className="hidden sm:block col-span-3">Owner</div>
        <div className="col-span-2 text-right">Win%</div>
        <div className="col-span-3 sm:col-span-1 text-right">ELO</div>
      </div>
      <div className="divide-y divide-white/5">
        {cards.map((card, i) => {
          const r = rarityStyle(card.rarity);
          return (
            <div key={card.id} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-1 flex justify-center">{rankBadge(i + 1)}</div>
              <div className="col-span-6 sm:col-span-5">
                <Link href={`/cards/${card.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <div className="w-10 h-10 rounded-lg bg-black overflow-hidden flex items-center justify-center shrink-0" style={{ border: `1px solid ${r.base}66` }}>
                    {card.imageUrl ? <img src={card.imageUrl} alt={card.name} loading="lazy" className="w-full h-full object-contain p-0.5" /> : <Star className="text-white/20" size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">{card.name}</div>
                    <div className="text-[10px]" style={{ color: r.glow }}>{card.rarity} • {card.faction}</div>
                  </div>
                </Link>
              </div>
              <div className="hidden sm:block col-span-3 text-sm font-mono text-white/50 truncate">{card.user.username || shortAddr(card.user.walletAddress)}</div>
              <div className="col-span-2 text-right font-mono text-white/80">{Math.round((card.totalWins / Math.max(1, card.totalRaces)) * 100)}%</div>
              <div className="col-span-3 sm:col-span-1 text-right font-mono font-bold text-accent">{card.elo}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center text-white/40 italic">{msg}</div>;
}
