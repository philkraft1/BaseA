'use client'

import { encodeFunctionData, type Abi, type Address, type Hex } from 'viem'
import { useSendTransaction } from 'wagmi'
import { APP_CHAIN_ID } from '@/config/network'
import { appendBuilderCode } from '@/lib/attribution'

type WriteArgs = {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  chainId?: typeof APP_CHAIN_ID
}

export function useAttributedWrite() {
  const { data: hash, isPending, error, sendTransaction } = useSendTransaction()

  function writeContract(
    params: WriteArgs,
    options?: { onSuccess?: (txHash: Hex) => void },
  ) {
    const data = appendBuilderCode(
      encodeFunctionData({
        abi: params.abi,
        functionName: params.functionName,
        args: params.args as never,
      }),
    )
    sendTransaction(
      { to: params.address, data, chainId: params.chainId ?? APP_CHAIN_ID },
      {
        onSuccess: (txHash) => options?.onSuccess?.(txHash),
      },
    )
  }

  return { hash, isPending, error, writeContract }
}
