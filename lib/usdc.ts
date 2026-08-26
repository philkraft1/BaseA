import { isHex, keccak256, stringToHex } from 'viem'
import { USDC_DECIMALS } from '@/config/network'

export function formatUsdcPlain(amount: bigint): string {
  const padded = amount.toString().padStart(USDC_DECIMALS + 1, '0')
  const whole = padded.slice(0, -USDC_DECIMALS) || '0'
  const frac = padded.slice(-USDC_DECIMALS).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}

export function subscriptionIdToBytes32(id: string): `0x${string}` {
  if (isHex(id)) {
    const hex = id.slice(2)
    if (hex.length === 64) return id as `0x${string}`
    return `0x${hex.padStart(64, '0').slice(-64)}` as `0x${string}`
  }
  return keccak256(stringToHex(id))
}
