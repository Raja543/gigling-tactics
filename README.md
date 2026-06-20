# Gigling Tactics

Turn real Gigling NFTs into deterministic trading cards and battle-ready
three-card squads.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in private values.
2. Run `npm install`.
3. Run `npm run prisma:generate`.
4. Run `npm run dev`.

Wallet access uses an injected Abstract-compatible browser wallet. Reown and
WalletConnect QR support are intentionally out of scope for the MVP.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run prisma:validate
npm run build
```
