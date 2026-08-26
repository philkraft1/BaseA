import { encodeFunctionData, parseSignature, type Address, type Hex } from 'viem'
import { APP_CHAIN_ID, USDC_ADDRESS } from '@/config/network'

export const usdcPermitAbi = [
  {
    type: 'function',
    name: 'nonces',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'permit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const

export const usdcPermitDomain = {
  name: 'USD Coin',
  version: '2',
  chainId: APP_CHAIN_ID,
  verifyingContract: USDC_ADDRESS,
} as const

export const usdcPermitTypes = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

export function usdcPermitDeadlineSeconds() {
  return BigInt(Math.floor(Date.now() / 1000) + 30 * 60)
}

export function encodeUsdcPermitCall(args: {
  owner: Address
  spender: Address
  value: bigint
  deadline: bigint
  signature: Hex
}) {
  const parsed = parseSignature(args.signature)
  const v = Number(parsed.v ?? BigInt(27 + parsed.yParity))
  return encodeFunctionData({
    abi: usdcPermitAbi,
    functionName: 'permit',
    args: [args.owner, args.spender, args.value, args.deadline, v, parsed.r, parsed.s],
  })
}

export function isUserRejected(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; code?: number; shortMessage?: string; message?: string }
  const text = `${e.shortMessage ?? ''} ${e.message ?? ''}`.toLowerCase()
  return (
    e.name === 'UserRejectedRequestError' ||
    e.code === 4001 ||
    text.includes('user rejected') ||
    text.includes('denied')
  )
}
