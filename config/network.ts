import { baseSepolia } from 'wagmi/chains'

/** Swap to `base` + mainnet RPC/explorer/USDC when promoting off Sepolia. */
export const appChain = baseSepolia

export const APP_CHAIN_ID = appChain.id

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org'

export const EXPLORER_TX_URL = (hash: string) =>
  `https://sepolia.basescan.org/tx/${hash}`

export const EXPLORER_ADDRESS_URL = (address: string) =>
  `https://sepolia.basescan.org/address/${address}`

/** Circle USDC on Base Sepolia. Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 */
export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined) ??
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

export const USDC_DECIMALS = 6

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const
