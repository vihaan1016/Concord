# Frontend Build Plan (phase-wise)

The frontend is a clone of the OmniCurve SPA adapted to the sealed-bid batch-auction DEX. This is the
execution guide; implement phases in order and commit after each. See [`FRONTEND_GUIDE.md`](./FRONTEND_GUIDE.md)
for the exact contract surface, encryption, and tick math.

## Stack & layout

- **`frontend/`** — Vite + React 18 + wagmi/viem + RainbowKit + TanStack Query + react-router + Tailwind
  (CSS-var "Signal/Noise" tokens) + framer-motion + `@zama-fhe/relayer-sdk` (client-side FHE).
- **`indexer/`** — Express + socket.io + viem + Postgres. Read-only: watches DEX events, serves batch/order
  state over REST + socket. Stores metadata only — never price/size (those stay encrypted on-chain).

Live data flow: chain → indexer (viem event watch → Postgres + socket emit) → frontend (REST + socket).

## Domain mapping (OmniCurve → FBA DEX)

| OmniCurve | Ours |
|-----------|------|
| Markets list / `MarketCard` | Batches list / `BatchCard` |
| `MarketDetail` | `BatchDetail` |
| `UserDashboard` | `Portfolio` (my orders + user-decrypt fills) |
| `useTrade` (approve→buy) | `useSubmitOrder` (encrypt size+tick → submit) |
| `CreateMarketModal` | `FaucetModal` (mint + `setOperator(DEX)`) |
| `StrikeSlider` | `TickSlider` (32-tick price grid) |
| `GaussianChart` | `BatchVisualizer` (countdown, slot-fill, status pipeline) |
| `LPPanel`/`StakerPanel` | removed |

Reuse verbatim (rebrand only): `components/ui/*`, `components/layout/*`, `wallet/ConnectButton`,
`ThemeProvider`, `lib/{gas,errors,socket,api}`, `hooks/{useLiveRefetch,useTheme}`, `config/wagmi` pattern,
`styles/globals.css` tokens, `index.html` fonts.

## Phases

- **Phase 0 — Scaffold ✅** — `frontend/` (Vite app booting) + `indexer/` (Express+socket, `/api/health` ok) + this doc.
- **Phase 1 — Config & contracts** — wagmi Sepolia + Zama RPC; `contracts.ts` with DEX/token addresses +
  ABIs copied from `out/BatchAuctionDEX.sol/*.json`, `out/ConfidentialToken.sol/*.json` into `frontend/src/abis/`.
- **Phase 2 — Design system + UI kit** — port tokens/fonts/globals + UI primitives + layout; rebrand copy/accent.
- **Phase 3 — FHE layer** — `lib/fhe.ts` relayer instance; hooks `useEncryptOrder`, `useUserDecrypt`,
  `useOperatorApproval`, `useFaucet`; `lib/ticks.ts` price↔tick + euint64 scaling.
- **Phase 4 — Indexer** — viem `watchContractEvent` for all DEX events → Postgres (`batches`, `orders`) →
  socket emits (`batch:update`, `order:new`, `batch:cleared`, `order:filled`); REST routes.
- **Phase 5 — Pages & hooks** — `useCurrentBatch/useBatches/useMyOrders/useSubmitOrder`; pages
  Landing / Trade / Batches / Portfolio / Docs; routing + provider tree (add FHE init).
- **Phase 6 — Domain components** — `OrderForm`, `TickSlider`, `BatchVisualizer`, `ClearingResult`,
  `OrderCard`, `DecryptPanel`, `FaucetModal`.
- **Phase 7 — Polish & deploy** — framer-motion; the "read another's order → blocked" proof; deploy
  frontend (Vercel), add indexer to `docker-compose.yml` alongside the keeper.

## Verify (per phase)

Phase 0: `cd frontend && npm run dev` serves 200; `cd indexer && npm run dev` → `GET /api/health` ok.
Later phases: typecheck clean; the referenced flow works end-to-end in the browser against a deployed DEX.
Final: on Sepolia, a trader does faucet→approve→encrypted submit→clear→settle→user-decrypt, and a second
trader provably cannot read the first's order.
