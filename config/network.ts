import { baseSepolia } from 'wagmi/chains'

/** Swap to `base` + mainnet RPC/explorer when promoting off Sepolia. */
export const appChain = baseSepolia

export const APP_CHAIN_ID = appChain.id

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org'

export const EXPLORER_TX_URL = (hash: string) =>
  `https://sepolia.basescan.org/tx/${hash}`
