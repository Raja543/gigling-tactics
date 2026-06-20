import { create } from 'zustand';

interface BattleState {
  battleId: string | null;
  status: 'IDLE' | 'MATCHMAKING' | 'IN_PROGRESS' | 'FINISHED';
  currentTurn: number;
  logs: any[];
  winner: string | null;
  setBattleId: (id: string) => void;
  setStatus: (status: 'IDLE' | 'MATCHMAKING' | 'IN_PROGRESS' | 'FINISHED') => void;
  addLog: (log: any) => void;
  setWinner: (winner: string) => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  battleId: null,
  status: 'IDLE',
  currentTurn: 0,
  logs: [],
  winner: null,
  setBattleId: (id) => set({ battleId: id }),
  setStatus: (status) => set({ status }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log], currentTurn: state.currentTurn + 1 })),
  setWinner: (winner) => set({ winner, status: 'FINISHED' }),
  reset: () => set({ battleId: null, status: 'IDLE', currentTurn: 0, logs: [], winner: null })
}));
