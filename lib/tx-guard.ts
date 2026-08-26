import { getAddress, isAddress } from 'viem'
import {
  MEMO_MAX_BYTES,
  USDC_ADDRESS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from '@/config/network'
import { PAY_REQUEST_ADDRESS } from '@/config/pay-request'
import { STANDING_ORDER_ADDRESS } from '@/config/standing-order'

export { MEMO_MAX_BYTES }

export const MAX_USDC_WHOLE_DIGITS = 12

export function isNativeUsdc(token: string): boolean {
  return token.toLowerCase() === USDC_ADDRESS.toLowerCase()
}

export function memoByteLength(memo: string): number {
  return new TextEncoder().encode(memo).length
}

export function parseUsdcAmount(
  input: string,
): { ok: true; value: bigint } | { ok: false; error: string } {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Enter an amount greater than 0.' }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: 'Amount must be a positive number.' }
  }
  const [whole, frac = ''] = trimmed.split('.')
  if (frac.length > USDC_DECIMALS) {
    return { ok: false, error: `USDC allows at most ${USDC_DECIMALS} decimal places.` }
  }
  if (whole.length > MAX_USDC_WHOLE_DIGITS) {
    return { ok: false, error: 'Amount is too large.' }
  }
  const fracPadded = (frac + '000000').slice(0, USDC_DECIMALS)
  const value =
    BigInt(whole || '0') * BigInt(10) ** BigInt(USDC_DECIMALS) +
    BigInt(fracPadded || '0')
  if (value <= BigInt(0)) {
    return { ok: false, error: 'Enter an amount greater than 0.' }
  }
  return { ok: true, value }
}

export function assertSafeRecipient(to: string): string | null {
  if (!isAddress(to)) return 'Invalid recipient address.'
  const lower = to.toLowerCase()
  if (lower === ZERO_ADDRESS) return 'Cannot send to the zero address.'
  if (lower === USDC_ADDRESS.toLowerCase()) {
    return 'Cannot send to the USDC contract.'
  }
  if (lower === STANDING_ORDER_ADDRESS.toLowerCase()) {
    return 'Cannot send to the StandingOrder contract.'
  }
  if (lower === PAY_REQUEST_ADDRESS.toLowerCase()) {
    return 'Cannot send to the PayRequest contract.'
  }
  return null
}

export function checksumAddress(address: string): string {
  try {
    return getAddress(address)
  } catch {
    return address
  }
}

export function safeHttpsHref(href: string): string | null {
  try {
    const url = new URL(href)
    if (url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function simulateErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { shortMessage?: string; message?: string }
    if (e.shortMessage) return e.shortMessage
    if (e.message) return e.message
  }
  return 'Simulation failed. The transaction would revert.'
}
