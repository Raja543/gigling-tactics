import { z } from "zod";

// Only the env vars the app actually consumes are validated here. Public vars
// that are read directly via process.env (NEXT_PUBLIC_ABSTRACT_RPC,
// NEXT_PUBLIC_GIGA_PET_NFT_ADDRESS) are intentionally not duplicated.
const serverSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  DIRECT_URL: z.string().url().startsWith("postgresql://"),
  GIGAVERSE_API_BASE: z.string().url(),
});

export const serverEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  GIGAVERSE_API_BASE: process.env.GIGAVERSE_API_BASE,
});

export const integrationReadiness = {
  database: true,
  gigaverse: true,
  abstract: true,
  injectedWallet: true,
} as const;
