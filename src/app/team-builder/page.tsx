"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDeckStore } from "@/stores/useDeckStore";
import { useWallet } from "@/components/wallet/WalletProvider";
import { TeamSlot } from "@/components/team/TeamSlot";
import { SynergyDisplay } from "@/components/team/SynergyDisplay";
import dynamic from "next/dynamic";

const SavedDecks = dynamic(() => import("@/components/team/SavedDecks").then((mod) => mod.SavedDecks), {
  ssr: false,
});
import { CardGrid } from "@/components/cards/CardGrid";
import { Button } from "@/components/ui/Button";
import { Save, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import type { CardDisplay as CardType } from "@/types/card";

import { useCollection } from "@/hooks/useCards";
import { useDecks } from "@/hooks/useDecks";
import { TeamPower } from "@/components/team/TeamPower";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

export default function TeamBuilderPage() {
  const { address } = useWallet();
  const { slots, setSlot, removeCard, setTeam, clearDeck, isDeckFull } = useDeckStore();

  const { data: collection = [], isLoading: isLoadingCollection } = useCollection(address);
  const { decks = [], isLoading: decksLoading, createDeck, isCreating, renameDeck, deleteDeck } = useDecks(address);

  const [deckName, setDeckName] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const atMaxTeams = (decks?.length ?? 0) >= 3;
  const nextTeamName = `Team ${(decks?.length ?? 0) + 1}`;

  const selectedIds = useMemo(
    () => new Set(slots.filter((c): c is CardType => !!c).map((c) => c.id)),
    [slots],
  );

  const flash = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2600);
  };

  const handleCardClick = (card: CardType) => {
    if (slots.some((c) => c?.id === card.id)) {
      removeCard(card.id);
      return;
    }
    const emptyIndex = slots.findIndex((c) => c === null);
    if (emptyIndex !== -1) setSlot(emptyIndex, card);
    else flash(false, "Team is full. Remove a card first.");
  };

  const saveDeck = async () => {
    if (!isDeckFull() || !address) return;
    if (atMaxTeams) {
      flash(false, "You can only save up to 3 teams. Delete one first.");
      return;
    }
    try {
      await createDeck({ walletAddress: address, name: deckName.trim() || nextTeamName, cardIds: slots.map((c) => c!.id) });
      flash(true, "Team saved.");
      setDeckName(""); // reset so the next default becomes Team N+1
    } catch (err: any) {
      flash(false, err.message || "Error saving team");
    }
  };

  const loadDeck = (deck: any) => {
    const cards = [...(deck.deckCards || [])].sort((a, b) => a.slotPosition - b.slotPosition).map((d) => d.card);
    setTeam(cards);
    setDeckName(deck.name);
    flash(true, `Loaded "${deck.name}".`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeDeck = async (id: string) => {
    try {
      await deleteDeck(id);
      flash(true, "Team deleted.");
    } catch (err: any) {
      flash(false, "Error deleting team: " + err.message);
    }
  };

  const renameTeam = async (id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      await renameDeck({ deckId: id, name: clean.slice(0, 24) });
      flash(true, "Team renamed.");
    } catch (err: any) {
      flash(false, err.message || "Error renaming team");
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto px-6 sm:px-8 py-24 text-center">
        <AlertCircle className="mx-auto text-white/40 mb-4" size={48} />
        <h1 className="text-3xl font-heading font-bold mb-4">Connect Wallet to Build Team</h1>
        <p className="text-white/60 max-w-md mx-auto">
          Connect your Abstract wallet to access your collection and build decks for the arena.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 sm:px-8 py-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur text-sm font-medium shadow-xl ${
              toast.ok ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-red-500/15 border-red-500/40 text-red-300"
            }`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Builder */}
        <div className="lg:w-2/3 space-y-6">
          <div className="flex justify-between items-end gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-heading font-bold mb-1">Team Builder</h1>
              <input
                type="text"
                value={deckName}
                placeholder={nextTeamName}
                maxLength={24}
                onChange={(e) => setDeckName(e.target.value)}
                className="bg-transparent text-white/60 hover:text-white focus:text-white focus:outline-none border-b border-transparent hover:border-white/20 focus:border-primary px-1 py-0.5 transition-colors font-medium text-lg w-full max-w-xs placeholder:text-white/30"
              />
            </div>
            <TeamPower />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-surface/30 p-4 sm:p-6 rounded-2xl border border-white/5">
            <TeamSlot label="Frontline" card={slots[0]} onRemove={() => setSlot(0, null)} onClickSlot={() => {}} />
            <TeamSlot label="DPS" card={slots[1]} onRemove={() => setSlot(1, null)} onClickSlot={() => {}} />
            <TeamSlot label="Support" card={slots[2]} onRemove={() => setSlot(2, null)} onClickSlot={() => {}} />
          </div>

          <div className="flex justify-end items-center gap-3">
            {atMaxTeams && (
              <span className="text-xs text-amber-400/80 mr-auto">Max 3 teams. Delete one to save a new team.</span>
            )}
            <Button variant="secondary" onClick={clearDeck} disabled={selectedIds.size === 0}>
              <Trash2 size={16} className="mr-2" /> Clear
            </Button>
            <Button variant="primary" size="lg" disabled={!isDeckFull() || atMaxTeams} onClick={saveDeck} isLoading={isCreating}>
              <Save size={18} className="mr-2" /> Save Team
            </Button>
          </div>
        </div>

        {/* Synergy */}
        <div className="lg:w-1/3">
          <SynergyDisplay />
        </div>
      </div>

      {/* Onboarding hint when the player has cards but no saved teams yet */}
      {!decksLoading && decks.length === 0 && collection.length > 0 && (
        <OnboardingChecklist connected={!!address} hasCards={collection.length > 0} hasTeam={false} className="mt-12 max-w-xl" />
      )}

      {/* Saved decks */}
      <div className="mt-12">
        <h2 className="text-2xl font-heading font-bold mb-5">Your Saved Teams <span className="text-base font-normal text-white/40">({decks.length}/3)</span></h2>
        <SavedDecks decks={decks} isLoading={decksLoading} onLoad={loadDeck} onDelete={removeDeck} onRename={renameTeam} />
      </div>

      <hr className="border-white/10 my-10" />

      {/* Collection */}
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-heading font-bold">Your Collection</h2>
          <span className="text-sm text-white/40">{collection.length} cards • tap to add</span>
        </div>
        <CardGrid
          cards={collection}
          isLoading={isLoadingCollection}
          selectedIds={selectedIds}
          emptyMessage="No cards yet. Import your Giglings from the Collection page."
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  );
}
