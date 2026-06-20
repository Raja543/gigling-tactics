import { z } from "zod";

const optionalPublicKey = z.string().trim().optional().default("");

const serverSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  DIRECT_URL: z.string().url().startsWith("postgresql://"),
  GIGAVERSE_API_BASE: z.string().url(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalPublicKey,
  NEXT_PUBLIC_ABSTRACT_RPC: z.string().url(),
  NEXT_PUBLIC_PET_RACING_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Expected an EVM contract address"),
  NEXT_PUBLIC_GIGA_PET_NFT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Expected an EVM contract address"),
  NEXT_PUBLIC_GAME_ITEMS_ADDRESS: optionalPublicKey,
  NEXT_PUBLIC_GIGA_JUICE_ADDRESS: optionalPublicKey,
  NEXT_PUBLIC_PUSHER_KEY: optionalPublicKey,
  NEXT_PUBLIC_PUSHER_CLUSTER: optionalPublicKey,
});

export const serverEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  GIGAVERSE_API_BASE: process.env.GIGAVERSE_API_BASE,
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_ABSTRACT_RPC: process.env.NEXT_PUBLIC_ABSTRACT_RPC,
  NEXT_PUBLIC_PET_RACING_ADDRESS:
    process.env.NEXT_PUBLIC_PET_RACING_ADDRESS,
  NEXT_PUBLIC_GIGA_PET_NFT_ADDRESS:
    process.env.NEXT_PUBLIC_GIGA_PET_NFT_ADDRESS,
  NEXT_PUBLIC_GAME_ITEMS_ADDRESS:
    process.env.NEXT_PUBLIC_GAME_ITEMS_ADDRESS,
  NEXT_PUBLIC_GIGA_JUICE_ADDRESS:
    process.env.NEXT_PUBLIC_GIGA_JUICE_ADDRESS,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

export const integrationReadiness = {
  database: true,
  gigaverse: true,
  abstract: true,
  supabaseBrowser: Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  injectedWallet: true,
  realtime: Boolean(
    publicEnv.NEXT_PUBLIC_PUSHER_KEY &&
      publicEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
  ),
} as const;
