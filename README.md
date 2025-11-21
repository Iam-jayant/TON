# Inheritor

TON-native inheritance automation for Telegram Mini Apps. Owners nominate beneficiaries, define an inactivity window, and let the oracle sweep their TON balances into USDC and Razorpay payouts when a deadman switch trips.

## Monorepo layout

| Path | Description |
|------|-------------|
| `apps/miniapp` | Next.js Telegram WebApp that owners and nominees use to manage policies. |
| `services/backend` | Express + TypeScript API handling policy storage, oracle checks, Razorpay and SendGrid integrations. |
| `contracts/inheritor.tolk` | Tolk smart contract defining on-chain policy state and oracle hooks. |

## Getting started

```bash
# install dependencies per workspace
cd apps/miniapp && npm install
cd ../../services/backend && npm install
```

### Mini App

```bash
cd apps/miniapp
npm run dev # http://localhost:3000
```

Environment variables:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_TON_CONNECT_MANIFEST=https://<vercel-app>/tonconnect-manifest.json
```

### Backend

```bash
cd services/backend
cp env.sample .env
npm run dev
```

Key `.env` variables:

| Variable | Purpose |
|----------|---------|
| `TON_ORACLE_PRIVATE_KEY` | Keypair that signs inactivity declarations. |
| `RAZORPAY_*` | Credentials + payout account IDs for India-centric settlements. |
| `SENDGRID_*` | Email alerts for nominees. |

The backend persists JSON data to `services/backend/data/db.json` for now; swap with Postgres when ready.

## Deadman switch flow

1. Owner connects TON wallet via TonConnect in the Telegram mini app.
2. They choose inactivity window and assign nominees (shares must total 100%).
3. Backend stores the policy and begins monitoring wallet + Telegram session heartbeats.
4. Cron job (`deadmanService`) recomputes vault status every 15 minutes; once `INACTIVE`, it calls the smart contract oracle path, swaps TON to USDC, and fires Razorpay payouts.
5. Nominees receive SendGrid notifications at registration, warning, and payout.

## Smart contract notes

- Written in Tolk to target the TON testnet.
- Stores owner address, inactivity timestamp, nominee dictionary, and last ping.
- Oracle-only `DECLARE_INACTIVE` path sweeps funds to the backend escrow wallet, which subsequently converts to USDC/INR.
- Replace the stubbed backend `performTonSweep` logic with actual wallet-plugin logic once the contract is deployed.

## Deployment checklist

1. Deploy `services/backend` (Vercel/Render/Fly) with secrets from `.env`.
2. Deploy `apps/miniapp` to Vercel; update TonConnect manifest origin + BotFather domain.
3. Compile + deploy `contracts/inheritor.tolk` to TON testnet; set oracle public key in init data.
4. Register a Telegram bot via BotFather, enable WebApp pointing to the Vercel URL.
5. Set up Razorpay webhook for payout reconciliation (endpoint stub TBD).

## Next steps

- Replace JSON persistence with Durable Object/Postgres.
- Finish TON sweep + TON→USDC swap integration.
- Add webhook-driven status updates for payouts & wallet activity.

