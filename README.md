# Gigling Tactics

A fan-made **TCG + auto-battler** that turns your **Gigling Racing NFTs** (Gigaverse, on Abstract Chain) into playable trading cards. Connect your wallet, import your Giglings, build a 3-unit squad, and watch them clash in a deterministic, cinematic 3v3 auto-battler with faction synergies, class roles, and a ranked ELO arena.

> Not affiliated with the official Gigaverse team.

---

## ✨ Highlights

- **Real NFTs → real cards.** Each card is generated **deterministically** from a Gigling's on-chain racing history (win rate, ELO, races, traits, rarity). The same Gigling always produces the same card — no RNG packs.
- **Skill over rarity.** Overall rating is `OVR = traitScore × 0.4 + performanceScore × 0.6`, so a grinder's Common can outclass a lazy Legendary.
- **3v3 auto-battler.** Deterministic combat (seeded RNG) with criticals, special abilities, faction synergies, class-based targeting/VFX, and a cinematic "Clash" arena (lunges, impacts, floating damage, KO + victory sequence).
- **Ranked arena.** ELO ladder (Iron → Radiant) with placement matches and skill/streak-aware AI matchmaking.
- **7 rarities · 8 factions**, faction synergy bonuses, unit classes (Tank / Assassin / Mage / Support / Bruiser), achievements, collection score, and leaderboards.
- **Wallet-native.** Sign-in with **Abstract Global Wallet** via SIWE (supports ERC-1271 smart-account signatures).

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion, lucide-react |
| Data | Prisma ORM + Supabase Postgres |
| Wallet / Chain | wagmi v2, viem, Abstract Global Wallet (AGW) + Privy, SIWE |
| State / Fetch | Zustand, TanStack Query |
| Validation / Tests | Zod, Vitest |

---

## 🗂️ Project Structure

```
src/
├─ app/                 # Next.js routes (pages + API)
│  ├─ page.tsx          # Landing page
│  ├─ explorer/         # Browse all racing Giglings
│  ├─ collection/       # Your imported cards
│  ├─ team-builder/     # Build / save 3-unit teams
│  ├─ arena/            # Run battles (ClashArena)
│  ├─ leaderboards/     # Players / arena / cards
│  ├─ profile/          # Stats, rank, achievements
│  ├─ cards/[id]/       # Card detail page
│  ├─ docs/             # Game-engine documentation
│  └─ api/              # Route handlers (cards, decks, battles, profile, auth, …)
├─ engine/             # Deterministic game logic (card-gen, battle, synergy, ranking, …) + tests
├─ services/           # Gigaverse API + on-chain reads + card sync/import
├─ components/         # UI, cards, battle, team, layout, wallet
├─ lib/                # db, cosmetics, utils, hooks
└─ types/              # Shared types
prisma/                # schema.prisma + migrations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Supabase Postgres database (or any Postgres)

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy the example and fill in your values:
```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | App DB connection — **use the Supabase transaction pooler** (`:6543`, `pgbouncer=true`) for low latency |
| `DIRECT_URL` | Direct DB connection (`:5432`) used by Prisma for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `NEXT_PUBLIC_ABSTRACT_RPC` | Abstract Chain RPC endpoint |
| `NEXT_PUBLIC_PET_RACING_ADDRESS` … `NEXT_PUBLIC_GIGA_JUICE_ADDRESS` | Gigaverse contract addresses |
| `GIGAVERSE_API_BASE` | Gigaverse racing API base URL |
| `ADMIN_SYNC_TOKEN` | Secret that gates the leaderboard sync endpoint (server-only) |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` | (Optional) realtime |

> The Prisma CLI reads `.env`, not `.env.local`. The `prisma:*` npm scripts wrap commands with `dotenv -e .env.local` so they pick up your local config automatically.

### 3. Set up the database
```bash
npm run prisma:deploy     # apply migrations
npm run prisma:generate   # generate the Prisma client
```

### 4. Run
```bash
npm run dev               # http://localhost:3000
```

### 5. Populate cards (admin)
The **Sync Leaderboard** button on the Explorer page pulls the racing population from the Gigaverse API. It is gated by `ADMIN_SYNC_TOKEN` — paste the token when prompted. Individual players import their own NFTs from the **Collection** page ("Import Giglings from chain").

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run prisma:deploy` | Apply migrations (uses `.env.local`) |
| `npm run prisma:migrate` | Create + apply a dev migration |
| `npm run prisma:studio` | Open Prisma Studio |

---

## ⚙️ How It Works

1. **Connect** — Sign in with your Abstract Global Wallet (SIWE).
2. **Import** — Owned token IDs are read on-chain (`GigaPetNFT`); each pet's racing data is fetched from the Gigaverse API.
3. **Generate** — `engine/card-generator` deterministically maps that data to stats (ATK/DEF/SPD/HP/Luck), OVR, rarity, faction, traits → abilities.
4. **Build** — Assemble a 3-unit squad; faction synergies and unit classes apply.
5. **Battle** — `engine/battle-engine` simulates a seeded, deterministic 3v3 fight; the arena replays it cinematically and updates your ELO.

See the in-app **Docs** page (`/docs`) for the full formulas, combat rules, rarities, factions, and roadmap.

---

## 🌐 Gigaverse API Integration

All Gigaverse calls are centralized in **`src/services/gigaverse-api.ts`**, which wraps a single
`gigaverseFetch()` helper around `GIGAVERSE_API_BASE` (default `https://gigaverse.io/api/racing`).
Card stats are derived **only** from this live data plus on-chain ownership — there is no mock data.

### Endpoints used

| Endpoint | Wrapper fn | What it returns | Used by |
|---|---|---|---|
| `GET /leaderboard/elo?limit=&offset=` | `fetchEloLeaderboard` → `fetchAllLeaderboard` | The racing population, paginated (100/page) by ELO | Catalog **sync** |
| `GET /pets?ids=a,b,c` | `fetchPets` → `fetchPetsChunked` | Per-pet racing data: rarity, faction, win/race counts, ELO, traits, stat ranges, `imgUrl` (real NFT art). Max 50 ids/request, so it's chunked | **Sync** + **import** |
| `GET /pets/stats?ids=` · `GET /pets/{id}/stats` | `fetchPetStats` · `fetchSinglePetStats` | Extra per-pet stat detail | Stat backfill |
| `GET /stats` | `fetchGlobalStats` | Global racing stats | Optional aggregates |
| `GET /races/{wallet}` | `fetchWalletRaces` | A wallet's recent races | Optional |

### Where it's consumed

- **Catalog sync — `src/services/card-sync.ts`** (triggered by `POST /api/cards/sync`, the admin
  "Sync Leaderboard" button): `fetchAllLeaderboard()` to enumerate every racing Gigling, then
  `fetchPetsChunked()` to hydrate each pet, then `petToPetData()` / `leaderboardEntryToPetData()`
  → `generateCard()` → bulk upsert into Postgres.
- **Per-wallet import — `src/services/gigling-import.ts`** (triggered by `POST /api/giglings/import`,
  the Collection page's "Import Giglings from chain"): reads owned token IDs **on-chain** via viem
  (`src/services/contract-reader.ts`, `GigaPetNFT` contract), then `fetchPets()` for those IDs,
  then `generateCard()` to persist the player's cards with their real NFT art.

So the Gigaverse API supplies the **racing data and artwork**; the chain supplies **ownership**; and
`engine/card-generator.ts` turns both into deterministic cards.

---

## 🧪 Testing

Vitest covers the deterministic engine and API security:
- **Engine** — card generation (determinism, stat bands, rarity mapping, skill-over-rarity), damage math (mitigation, crits, multipliers), synergies, ranking boundaries, balanced battle resolution.
- **Security** — IDOR guards (deck/profile mutations reject non-owners), input validation.

```bash
npm test
```

---

## 🔐 Security Notes

- All deck/battle/profile mutations are **ownership-scoped** (wallet / SIWE session) — no cross-user tampering.
- API errors are generic to the client; full detail is logged server-side.
- `/api/cards/sync` requires `ADMIN_SYNC_TOKEN`. `/api/cards/regen` is currently open for demo convenience — gate it before a public launch.

---

## ☁️ Deploy (Vercel)

1. Import the repo into Vercel.
2. Add all env vars from `.env.example` in the project settings (**both `DATABASE_URL` and `DIRECT_URL`** — Prisma needs `DIRECT_URL` for migrations).
3. Deploy. The `vercel-build` script runs `prisma generate && prisma migrate deploy && next build`, so **pending migrations are applied automatically on every deploy** — no manual migrate step.

---

Built on **Abstract Chain**. Powered by **Gigaverse Racing**.
