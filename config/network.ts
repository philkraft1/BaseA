import { base } from 'wagmi/chains'

export const appChain = base

export const APP_CHAIN_ID = appChain.id

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? 'https://mainnet.base.org'

export const EXPLORER_TX_URL = (hash: string) =>
  `https://basescan.org/tx/${hash}`

export const EXPLORER_ADDRESS_URL = (address: string) =>
  `https://basescan.org/address/${address}`

/** Native Circle USDC on Base. */
export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined) ??
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export const USDC_DECIMALS = 6

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const
