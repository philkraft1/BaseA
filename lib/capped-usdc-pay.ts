import type { Address, Hex } from 'viem'
import { USDC_ADDRESS } from '@/config/network'
import {
  encodeUsdcPermitCall,
  usdcPermitAbi,
  usdcPermitDeadlineSeconds,
  usdcPermitDomain,
  usdcPermitTypes,
} from '@/lib/usdc-permit'

type SignTypedDataAsync = (args: {
  domain: typeof usdcPermitDomain
  types: typeof usdcPermitTypes
  primaryType: 'Permit'
  message: {
    owner: Address
    spender: Address
    value: bigint
    nonce: bigint
    deadline: bigint
  }
}) => Promise<Hex>

type ReadNonceClient = {
  readContract: (args: {
    address: typeof USDC_ADDRESS
    abi: typeof usdcPermitAbi
    functionName: 'nonces'
    args: [Address]
  }) => Promise<bigint>
}

export async function permitCallForExactUsdc(args: {
  client: ReadNonceClient
  signTypedDataAsync: SignTypedDataAsync
  owner: Address
  spender: Address
  value: bigint
}) {
  const nonce = await args.client.readContract({
    address: USDC_ADDRESS,
    abi: usdcPermitAbi,
    functionName: 'nonces',
    args: [args.owner],
  })
  const deadline = usdcPermitDeadlineSeconds()
  const signature = await args.signTypedDataAsync({
    domain: usdcPermitDomain,
    types: usdcPermitTypes,
    primaryType: 'Permit',
    message: {
      owner: args.owner,
      spender: args.spender,
      value: args.value,
      nonce,
      deadline,
    },
  })
  return {
    to: USDC_ADDRESS,
    data: encodeUsdcPermitCall({
      owner: args.owner,
      spender: args.spender,
      value: args.value,
      deadline,
      signature,
    }),
  }
}
