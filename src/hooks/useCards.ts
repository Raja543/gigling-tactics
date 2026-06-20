import { useQuery } from "@tanstack/react-query";
import type { CardDisplay } from "@/types/card";

export function useCollection(walletAddress: string | null) {
  return useQuery({
    queryKey: ["cards", "collection", walletAddress],
    queryFn: async (): Promise<CardDisplay[]> => {
      if (!walletAddress) return [];
      const res = await fetch(`/api/cards/explore?owner=${walletAddress}&limit=100`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      const data = await res.json();
      return data.cards || [];
    },
    enabled: !!walletAddress,
  });
}
