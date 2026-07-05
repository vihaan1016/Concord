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
- **Phase 1 — Config & contracts ✅** — wagmi Sepolia + Zama RPC; `contracts.ts` env-driven addresses +
  ABIs in `frontend/src/abis/`.
- **Phase 2 — Design system + UI kit ✅** — kept the "Ledger Paper" tokens/fonts/UI kit; rebranded shell.
- **Phase 3 — FHE layer ✅** — `lib/fhe.ts` relayer instance; `useEncryptOrder`, `useUserDecrypt`,
  `useOperatorApproval`, `useFaucet`; `lib/ticks.ts`.
- **Phase 4 — Indexer ✅** — viem backfill + `watchContractEvent` → Postgres/in-memory store → socket
  emits; REST routes.
- **Phase 5 — Pages & hooks ✅** — `useCurrentBatch/useBatches/useBatch/useMyOrders/useSubmitOrder`;
  Landing / Trade / Batches / BatchDetail / Portfolio / Docs; routing + FHE warm-up.
- **Phase 6 — Domain components ✅** — `TickSlider`, `ClearingResult`, `SealedSlots` + `BatchVisualizer`
  (countdown, status pill, pipeline). Order form + decrypt panel live inline in Trade/Portfolio.
- **Phase 7 — Deploy prep ✅** — indexer Dockerfile + service in `docker-compose.yml` (Grafana moved to
  :3002 to free :3001); `vercel.json` SPA rewrite. The "read another's order → blocked" proof is inherent
  in Portfolio (user-decrypt only authorizes your own handles).

## Deploy

```bash
# Frontend (Vercel) — set VITE_* env vars from .env.example in the project settings
cd frontend && npm run build   # or: vercel --prod

# Indexer + keeper + observability
cp indexer/.env.example indexer/.env   # set DEX_ADDRESS, RPC_URL
cp keeper/.env.example  keeper/.env
docker compose up --build              # postgres, keeper, indexer(:3001), prometheus(:9090), grafana(:3002)
```

## Verify

Phase 0: `frontend` dev serves 200; `indexer` `/api/health` ok. Frontend: `npm run typecheck` + `npm run
build` clean. Final (needs deployed DEX + running keeper + indexer): a trader does
faucet→approve→encrypted submit→clear→settle→user-decrypt in the browser, and a second trader provably
cannot read the first's order.
