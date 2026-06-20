import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CardDisplay } from "@/components/cards/CardDisplay";
import { CardStats } from "@/components/cards/CardStats";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/explorer" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Explorer
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Card Display */}
        <div className="w-full lg:w-1/3 flex justify-center lg:justify-start items-start">
          <div className="w-full max-w-sm">
            <CardDisplay card={mappedCard} interactive={false} />
          </div>
        </div>

        {/* Card Details */}
        <div className="w-full lg:w-2/3">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-white">
            {mappedCard.name}
          </h1>
          <p className="text-white/60 text-lg mb-8">
            Owned by <span className="text-primary">{mappedCard.owner?.walletAddress || 'Unknown'}</span>
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

            <div className="bg-surface/50 border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Battle Stats</h2>
              <CardStats card={mappedCard} />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold mb-4">Abilities</h2>
            
            <div className="bg-surface border border-white/10 rounded-xl p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Passive Ability</div>
                <div className="text-lg font-bold text-primary mb-1">
                  {mappedCard.passiveAbility || "None"}
                </div>
                <p className="text-white/60 text-sm">Active at all times during combat.</p>
              </div>
              <div className="w-px bg-white/10 hidden md:block" />
              <div className="flex-1">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Special Ability</div>
                <div className="text-lg font-bold text-accent mb-1">
                  {mappedCard.specialAbility || "None"}
                </div>
                <p className="text-white/60 text-sm">Triggered ability during combat.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
