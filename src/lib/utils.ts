import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize an EVM wallet address to a canonical lowercase form. All wallet
 * addresses are stored and looked up lowercased so that checksummed addresses
 * (e.g. from Abstract Global Wallet) and lowercase ones (from the leaderboard)
 * always resolve to the same user.
 */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}
