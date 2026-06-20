import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateDeckPayload {
  walletAddress: string;
  name: string;
  cardIds: string[];
}

export function useDecks(walletAddress: string | null) {
  const queryClient = useQueryClient();

  const decksQuery = useQuery({
    queryKey: ["decks", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await fetch(`/api/decks?wallet=${walletAddress}`);
      if (!res.ok) throw new Error("Failed to fetch decks");
      const data = await res.json();
      return data.decks || [];
    },
    enabled: !!walletAddress,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (payload: CreateDeckPayload) => {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create team");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", walletAddress] });
    },
  });

  const renameDeckMutation = useMutation({
    mutationFn: async ({ deckId, name }: { deckId: string; name: string }) => {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to rename team");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", walletAddress] });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: string) => {
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", walletAddress] });
    },
  });

  return {
    decks: decksQuery.data,
    isLoading: decksQuery.isLoading,
    createDeck: createDeckMutation.mutateAsync,
    isCreating: createDeckMutation.isPending,
    renameDeck: renameDeckMutation.mutateAsync,
    deleteDeck: deleteDeckMutation.mutateAsync,
  };
}
