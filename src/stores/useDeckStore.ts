import { create } from 'zustand';
import { CardDisplay } from '@/types/card';

interface DeckState {
  slots: (CardDisplay | null)[];
  setSlot: (index: number, card: CardDisplay | null) => void;
  removeCard: (cardId: string) => void;
  setTeam: (cards: (CardDisplay | null)[]) => void;
  clearDeck: () => void;
  isDeckFull: () => boolean;
  getTeamPower: () => number;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  slots: [null, null, null], // Frontline, DPS, Support
  
  setSlot: (index, card) => set((state) => {
    const newSlots = [...state.slots];
    // If card is already in another slot, remove it from there
    if (card) {
      const existingIndex = newSlots.findIndex(c => c?.id === card.id);
      if (existingIndex !== -1 && existingIndex !== index) {
        newSlots[existingIndex] = null;
      }
    }
    newSlots[index] = card;
    return { slots: newSlots };
  }),

  removeCard: (cardId) => set((state) => {
    const newSlots = state.slots.map(c => c?.id === cardId ? null : c);
    return { slots: newSlots };
  }),

  setTeam: (cards) => set({ slots: [cards[0] ?? null, cards[1] ?? null, cards[2] ?? null] }),

  clearDeck: () => set({ slots: [null, null, null] }),

  isDeckFull: () => {
    return get().slots.every(slot => slot !== null);
  },

  getTeamPower: () => {
    return get().slots.reduce((sum, card) => sum + (card?.ovr || 0), 0);
  }
}));
