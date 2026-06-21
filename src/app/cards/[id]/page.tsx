import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CardDisplay } from "@/components/cards/CardDisplay";
import { StatRadar } from "@/components/cards/StatRadar";
import { ArrowLeft, Swords } from "lucide-react";
import Link from "next/link";
import { rarityStyle, factionStyle } from "@/lib/cosmetics";
import { getUnitClassInfo } from "@/engine/unitClass";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const card = await db.card.findUnique({
    where: { id: p.id },
    include: {
      user: true,
      traits: true
    }
  });

  if (!card) {
    // Try by giglingId if uuid fails
    const cardByGiglingId = await db.card.findFirst({
      where: { giglingId: p.id },
      include: {
        user: true,
        traits: true
      }
    });

    if (!cardByGiglingId) return notFound();
    return renderCardDetail(cardByGiglingId);
  }

  return renderCardDetail(card);
}

function renderCardDetail(card: any) {
  const mappedCard = {
    ...card,
    owner: card.user,
    traits: card.traits.map((t: any) => ({
      traitType: t.traitType,
      traitValue: t.traitValue,
      tier: t.rarityTier
    }))
  };

  const rarity = rarityStyle(mappedCard.rarity);
  const faction = factionStyle(mappedCard.faction);
  const cls = getUnitClassInfo(mappedCard);
  const owner: string | undefined = mappedCard.owner?.walletAddress;
  const ownerShort = owner ? `${owner.slice(0, 6)}…${owner.slice(-4)}` : "Unknown";

  return (
    <div className="container mx-auto px-6 sm:px-8 py-12">
      <Link href="/explorer" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Explorer
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Card Display + actions */}
        <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start gap-5">
          <div className="w-full max-w-sm">
            <CardDisplay card={mappedCard} interactive={false} />
          </div>
          <Link href="/team-builder" className="w-full max-w-sm">
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: `linear-gradient(135deg, ${faction.color}, #a855f7)` }}>
              <Swords size={18} /> Use in Team Builder
            </div>
          </Link>
        </div>

        {/* Card Details */}
        <div className="w-full lg:w-2/3">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide"
              style={{ color: rarity.glow, background: `${rarity.base}22`, border: `1px solid ${rarity.base}66` }}>
              <img src={rarity.icon} alt="" aria-hidden className="h-3 w-3 [image-rendering:pixelated]" /> {mappedCard.rarity}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide text-white/80"
              style={{ background: `${faction.color}22`, border: `1px solid ${faction.color}66` }}>
              {faction.logo && <img src={faction.logo} alt="" aria-hidden className="h-3 w-3 [image-rendering:pixelated]" />} {mappedCard.faction}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide"
              style={{ color: cls.color, background: `${cls.color}22`, border: `1px solid ${cls.color}66` }}>
              {cls.label}
            </span>
            <span className="ml-auto px-3 py-1 rounded-lg font-mono font-bold text-white"
              style={{ background: "rgba(0,0,0,0.4)", border: `1.5px solid ${rarity.base}` }}>OVR {mappedCard.ovr}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-white">{mappedCard.name}</h1>
          <p className="text-white/60 text-sm font-mono mb-8">
            #{mappedCard.giglingId} · Owned by{" "}
            {owner ? <Link href={`/profile?wallet=${owner}`} className="text-primary hover:underline">{ownerShort}</Link> : <span>{ownerShort}</span>}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-surface/50 border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Racing History</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-mono text-white">{mappedCard.totalRaces}</div>
                  <div className="text-xs text-white/40 uppercase">Total Races</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-accent">{mappedCard.totalWins}</div>
                  <div className="text-xs text-white/40 uppercase">Wins</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-primary">{Math.round(mappedCard.winRatePct)}%</div>
                  <div className="text-xs text-white/40 uppercase">Win Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-white">{mappedCard.elo}</div>
                  <div className="text-xs text-white/40 uppercase">ELO Rating</div>
                </div>
              </div>
            </div>

            <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2 self-start">Combat Profile</h2>
              <StatRadar card={mappedCard} color={faction.color} />
            </div>
          </div>

          {/* Traits */}
          {mappedCard.traits?.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-heading font-bold mb-4">Traits</h2>
              <div className="flex flex-wrap gap-2">
                {mappedCard.traits.map((t: any, i: number) => (
                  <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-sm">
                    <span className="text-white/40 text-xs uppercase tracking-wide">{t.traitType}</span>
                    <span className="font-bold text-white">{t.traitValue}</span>
                    {t.tier && <span className="text-[10px] font-mono text-primary uppercase">{t.tier}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold mb-4">Abilities</h2>

            <div className="bg-surface border border-white/10 rounded-xl p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Passive Ability</div>
                <div className="text-lg font-bold text-primary mb-1">{mappedCard.passiveAbility || "None"}</div>
                <p className="text-white/60 text-sm">Active at all times during combat.</p>
              </div>
              <div className="w-px bg-white/10 hidden md:block" />
              <div className="flex-1">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Special Ability</div>
                <div className="text-lg font-bold text-accent mb-1">{mappedCard.specialAbility || "None"}</div>
                <p className="text-white/60 text-sm">Triggered ability during combat.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
