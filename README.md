# Float — request, pay, and park USDC on Base

Personal USDC cashflow for Base. Not a swap aggregator, not a memecoin launcher, not a merchant checkout clone.

- **Repo:** https://github.com/philkraft1/BaseA
- **Live demo:** https://basea-tau.vercel.app
- **Network (v1):** Base Sepolia (`84532`). Mainnet after Float works.

## Why this exists

Base MCP plugins already cover protocol actions (Uniswap, Morpho, Moonwell, YO, Flaunch, Bitrefill, …). Base Pay covers merchant checkout. Daily users still lack:

1. A weekly USDC ledger (not a raw explorer dump)
2. Request-to-pay links (roommate, client, split)
3. Idle USDC comparison across Morpho / Moonwell / YO — **you pick the protocol**
4. Batched revoke of leftover USDC approvals

## Daily use

1. Connect Base Account or an injected wallet.
2. **Ledger** — USDC balance and recent in/out.
3. **Request** — create an onchain invoice; share `/pay/{id}`.
4. **Pay** — send USDC to an address or basename, or open a request link (approve + pay in one batch on smart wallets).
5. **Idle** — compare Base mainnet USDC venues; deposit on their site.
6. **Approvals** — revoke leftover allowances.

## Contract

[`contracts/src/PayRequest.sol`](contracts/src/PayRequest.sol) — `createRequest(payer, token, amount, memo)` and `pay(id)` (pulls ERC-20 via `transferFrom`).

```bash
npm run contracts:build
npm run contracts:test
# needs Sepolia ETH + DEPLOYER_PRIVATE_KEY
npm run contracts:deploy
```

Set on Vercel / `.env.local`:

```bash
NEXT_PUBLIC_PAY_REQUEST_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

Circle test USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`. Faucet: [Circle](https://faucet.circle.com/) (select Base Sepolia).

## Setup

```bash
npm install
cd contracts && forge install foundry-rs/forge-std --no-git && cd ..
npm run dev
```

## Metrics to track (grants)

| Metric | Why |
|--------|-----|
| Requests created / paid | Core usage |
| Unique payers / payees | Real users |
| USDC volume through `pay()` | Economic activity |
| Approval revokes | Safety hygiene |

Weekly Rewards: public repo + demo + onchain txs. Builder Grants: **mainnet**, real volume — not this tutorial-era tally. Still not Base Batches until there is a business.

## Promote to Base mainnet

1. Redeploy `PayRequest` to Base (`8453`).
2. In [`config/network.ts`](config/network.ts): `base` instead of `baseSepolia`, USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, Basescan URLs, dedicated RPC.
3. Set `NEXT_PUBLIC_PAY_REQUEST_ADDRESS` and redeploy Vercel.

## Stack

Next.js · wagmi · viem · Base Account · Foundry · TanStack Query
