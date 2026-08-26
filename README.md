# Due — standing USDC orders for Base App

Personal control plane for Base Account users: **who can spend your USDC**, and **standing orders** to pay a basename on a schedule.

- **Repo:** https://github.com/philkraft1/Float
- **Live demo:** https://basea-tau.vercel.app
- **Network:** Base (`8453`)
- **Base.dev app id:** `6a8abd3739d7d26f4bad1883`

## Why this exists

Base App is full of swaps, launches, and merchant checkout. Nothing else is:

1. A daily inbox of Base Account **spend permissions** and leftover ERC-20 approvals
2. One-tap **revoke**
3. Person-to-person **recurring USDC** (rent, allowance) using spend permissions when the host allows it, with a **Pay this period** fallback when it does not

## Daily use

1. Connect Base Account or an injected wallet.
2. **Inbox** — incoming and outgoing standing orders, plus who can still spend.
3. **New** — create an order to a basename; optionally grant a spend permission so Due can auto-charge.
4. **`/due/{id}`** — shareable link; payer settles the current period.
5. **Permissions** — list spend permissions + discovered USDC allowances; revoke.

Spend permissions inside Base App itself are still rolling out. Auto-charge is implemented; **Pay this period** is the path that always works.

## Contract

[`contracts/src/StandingOrder.sol`](contracts/src/StandingOrder.sol) — `create`, `payPeriod`, `recordPayment` (operator / CDP), `cancel`.

```bash
npm run contracts:build
npm run contracts:test
# needs Base ETH + DEPLOYER_PRIVATE_KEY
npm run contracts:deploy
# Etherscan V2 key (works for Basescan)
npm run contracts:verify
```

Then set the CDP subscription owner as operator:

```bash
node scripts/set-operator.mjs
```

Onchain counters: `GET /api/metrics`.

## Environment

See [`.env.example`](.env.example).

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_STANDING_ORDER_ADDRESS` | Client |
| `NEXT_PUBLIC_USDC_ADDRESS` | Client |
| `NEXT_PUBLIC_RPC_URL` | Client |
| `NEXT_PUBLIC_BUILDER_CODE` | Client — from [base.dev](https://www.base.dev) Settings → Builder Codes |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` / `CDP_WALLET_SECRET` | Server only — [CDP Portal](https://portal.cdp.coinbase.com) |
| `PAYMASTER_URL` | Server, optional gas sponsorship |
| `CRON_SECRET` | Server — Vercel cron `Authorization: Bearer` |
| `BASE_NOTIFICATIONS_API_KEY` | Server, optional |
| `ETHERSCAN_API_KEY` | Deploy machine — verify on Basescan (API V2) |
| `DEPLOYER_PRIVATE_KEY` | Deploy machine only |

Never put CDP secrets or the deployer key in `NEXT_PUBLIC_*` vars.

## Setup

```bash
npm install
cd contracts && forge install foundry-rs/forge-std --no-git && cd ..
npm run dev
```

## Base.dev listing (paste)

Register / update the project at [base.dev](https://www.base.dev). Discovery no longer uses `farcaster.json`.

| Field | Value |
|-------|--------|
| Name | Due |
| Tagline | Standing USDC between people, plus a spend-permission inbox |
| Description | See every spender that can take your USDC, revoke in one tap, and create person-to-person standing orders (rent / allowance) to a basename. Auto-charge when Base Account spend permissions are available; otherwise pay each period from the share link. |
| Category | finance |
| Primary URL | https://basea-tau.vercel.app |
| Icon | `/app-icon.svg` or `/due.svg` |
| Screenshots | Inbox, New order, Permissions, `/due/{id}` |
| Builder code | paste from Base.dev Settings |

## Talent / weekly ETH wiring

Eligibility is on **you**, not the app: Basename, Talent Builder Score ≥ 40, human checkmark, OFAC-clean wallet.

Ranked activity this repo is meant to produce:

1. **Public GitHub quality** — keep [github.com/philkraft1/Float](https://github.com/philkraft1/Float) public; connect it on Talent.
2. **Verified mainnet contract activity** — users must transact with **our** `StandingOrder`, not only USDC / SpendPermissionManager. Deploy, verify, then create / pay / revoke for real.
3. **Base App usage** — this listing on [base.dev](https://www.base.dev), builder code on every write (`NEXT_PUBLIC_BUILDER_CODE` + ERC-8021 suffix).
4. **Share** — cast the live demo after mainnet ship. Connect the deployer wallet on Talent.

Do not wash volume. Talent does not pay for a Sepolia-only tutorial.

## Metrics to track (grants / weekly rewards)

| Metric | Why |
|--------|-----|
| Orders created / paid | Core usage (`GET /api/metrics`) |
| Unique payers / payees | Real users + onboarding |
| USDC volume through `payPeriod` / charge | Economic activity |
| Permission and allowance revokes | Safety hygiene |
| Permission-inbox opens | Retention loop |

## Stack

Next.js · wagmi · viem · Base Account · Foundry · TanStack Query · CDP subscriptions
