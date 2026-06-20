import { useQuery } from "@tanstack/react-query";

export function useBattles(walletAddress: string | null) {
  return useQuery({
    queryKey: ["battles", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await fetch(`/api/battles?wallet=${walletAddress}`);
      if (!res.ok) throw new Error("Failed to fetch battles");
      const data = await res.json();
      return data.battles || [];
    },
    enabled: !!walletAddress,
  });
}
