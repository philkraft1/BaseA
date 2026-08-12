# BaseA — Onchain Tally (Base Sepolia)

Next.js app on **Base Sepolia** (chain ID `84532`) with wagmi, viem, and Base Account. Read/write a Foundry `Counter`, with EIP-5792 batch increment when the wallet supports it.

- **Repo (public):** https://github.com/philkraft1/BaseA
- **Live demo:** https://basea-tau.vercel.app

The demo UI is live. The Counter contract is **not deployed yet** (no Sepolia ETH on the deployer). Until `NEXT_PUBLIC_COUNTER_ADDRESS` is set, the page shows a “not deployed” notice. After you claim faucet ETH and deploy, redeploy Vercel with that env var.

## Base funding (Weekly Rewards)

This project is an early prototype. It does **not** qualify for Builder Grants, OP Retro Funding, or Base Batches. It **can** count toward [Weekly Rewards / Builder Score](https://www.builderscore.xyz/) after onchain deploy + public progress.

1. Claim Base Sepolia ETH: [network faucets](https://docs.base.org/base-chain/network-information/network-faucets) (CDP, Alchemy, thirdweb, etc.)
2. Deploy the Counter (`npm run contracts:deploy` or Foundry script below)
3. Set `NEXT_PUBLIC_COUNTER_ADDRESS` on Vercel and redeploy
4. Create a profile at [builderscore.xyz](https://www.builderscore.xyz/) (Talent Protocol) and share the demo + repo
5. Keep building past this tutorial before applying to larger programs

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- wagmi + viem + TanStack Query
- `@base-org/account` (Base Account connector)
- Foundry contracts in [`contracts/`](contracts/)

## Prerequisites

- Node.js 20+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`) on your `PATH`
- Base Sepolia ETH for deploy + txs — [network faucets](https://docs.base.org/base-chain/network-information/network-faucets)

## Setup

```bash
npm install
```

If `forge` is missing on Windows, install Foundry binaries (e.g. from [foundry-rs/foundry releases](https://github.com/foundry-rs/foundry/releases)) and add them to `PATH`.

Install Solidity deps and build:

```bash
cd contracts
forge install foundry-rs/forge-std --no-git
forge build
forge test
cd ..
```

## Deploy Counter (Base Sepolia)

1. Fund a deployer wallet with Sepolia ETH (faucet link above).
2. Prefer a Foundry keystore (no key in git):

```bash
cd contracts
# PowerShell: set RPC in contracts/.env (see .env.example)
cast wallet import deployer --interactive
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --account deployer --broadcast
```

Or one-shot with an env private key (never commit it):

```bash
# PowerShell
$env:DEPLOYER_PRIVATE_KEY="0x..."
$env:BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
npm run contracts:build
npm run contracts:deploy
```

The Node script writes `NEXT_PUBLIC_COUNTER_ADDRESS` into `.env.local`.

3. Restart the Next app so it picks up the address.

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect with Base Account or an injected wallet, switch to Base Sepolia if prompted, then increment the tally.

Optional env (`.env.local`):

```bash
NEXT_PUBLIC_COUNTER_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

## Project layout

| Path | Purpose |
|------|---------|
| [`config/network.ts`](config/network.ts) | Chain, RPC, explorer helpers (cutover point) |
| [`config/wagmi.ts`](config/wagmi.ts) | Wagmi config (Sepolia + Base Account) |
| [`config/counter.ts`](config/counter.ts) | Counter address + ABI |
| [`components/`](components/) | Connect, display, increment UI |
| [`contracts/`](contracts/) | Foundry Counter + deploy script |

## Promote to Base mainnet (later)

When the app is finalized:

1. Redeploy `Counter` to Base mainnet (`chainId` `8453`).
2. In [`config/network.ts`](config/network.ts): import `base` instead of `baseSepolia`, point `RPC_URL` at a dedicated mainnet provider (do not ship API keys in the client — proxy if needed), and change `EXPLORER_TX_URL` to `https://basescan.org/tx/...`.
3. Set `NEXT_PUBLIC_COUNTER_ADDRESS` to the mainnet deployment.
4. Confirm wagmi `chains` / `transports` only list mainnet (or keep both with an env toggle).
5. Retest connect → read → increment → batch path on a smart wallet.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run contracts:build` | `forge build` |
| `npm run contracts:test` | `forge test` |
| `npm run contracts:deploy` | Deploy via `scripts/deploy-counter.mjs` |
