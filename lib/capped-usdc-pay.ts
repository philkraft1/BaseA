import { encodeFunctionData, type Address, type Hex } from 'viem'
import { USDC_ADDRESS } from '@/config/network'
import { erc20Abi } from '@/config/standing-order'

type CodeClient = {
  getCode: (args: { address: Address }) => Promise<Hex | undefined>
}

export function exactUsdcApproveCall(spender: Address, amount: bigint) {
  return {
    to: USDC_ADDRESS,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
    }),
  }
}

export function cappedUsdcPayCalls(args: {
  spender: Address
  amount: bigint
  pay: { to: Address; data: Hex }
  needsApprove: boolean
}) {
  if (!args.needsApprove) return [args.pay]
  return [exactUsdcApproveCall(args.spender, args.amount), args.pay]
}

/** Coinbase Smart Wallet and other contract accounts batch via EIP-5792. */
export async function walletCanBatchCalls(
  client: CodeClient,
  address: Address,
  supportsBatching: boolean,
) {
  if (supportsBatching) return true
  try {
    const code = await client.getCode({ address })
    return Boolean(code && code !== '0x')
  } catch {
    return false
  }
}
