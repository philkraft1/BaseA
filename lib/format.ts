import { USDC_DECIMALS } from '@/config/network'

export function formatUsdc(amount: bigint, digits = 2): string {
  const n = Number(amount) / 10 ** USDC_DECIMALS
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function parseUsdc(input: string): bigint {
  const trimmed = input.trim()
  if (!trimmed) return BigInt(0)
  const [whole, frac = ''] = trimmed.split('.')
  const fracPadded = (frac + '000000').slice(0, USDC_DECIMALS)
  return (
    BigInt(whole || '0') * BigInt(10) ** BigInt(USDC_DECIMALS) +
    BigInt(fracPadded || '0')
  )
}

export function shortAddress(address?: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function isAddressLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}
