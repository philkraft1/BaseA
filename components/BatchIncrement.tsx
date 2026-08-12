'use client'

import { useEffect } from 'react'
import {
  useSendCalls,
  useWaitForCallsStatus,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { readContractQueryOptions } from 'wagmi/query'
import { useQueryClient } from '@tanstack/react-query'
import { encodeFunctionData } from 'viem'
import { config } from '@/config/wagmi'
import { APP_CHAIN_ID, EXPLORER_TX_URL, appChain } from '@/config/network'
import { COUNTER_ADDRESS, counterAbi } from '@/config/counter'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'

const counterQueryKey = readContractQueryOptions(config, {
  address: COUNTER_ADDRESS,
  abi: counterAbi,
  functionName: 'number',
  chainId: APP_CHAIN_ID,
}).queryKey

const isDeployed =
  COUNTER_ADDRESS !== '0x0000000000000000000000000000000000000000'

export function BatchIncrement() {
  const { isConnected } = useAccount()
  const { supportsBatching } = useWalletCapabilities()

  if (!isDeployed) return null
  if (!isConnected) return <p className="text-sm text-zinc-500">Connect your wallet first.</p>

  return supportsBatching ? <BatchFlow /> : <SequentialFlow />
}

function ChainSwitchButton() {
  const { switchChain, isPending } = useSwitchChain()
  return (
    <button
      type="button"
      onClick={() => switchChain({ chainId: APP_CHAIN_ID })}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      disabled={isPending}
    >
      {isPending ? 'Switching...' : `Switch to ${appChain.name}`}
    </button>
  )
}

function BatchFlow() {
  const chainId = useChainId()
  const { data, sendCalls, isPending } = useSendCalls()
  const { isLoading: isConfirming, isSuccess } = useWaitForCallsStatus({
    id: data?.id,
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: counterQueryKey })
    }
  }, [isSuccess, queryClient])

  if (chainId !== APP_CHAIN_ID) return <ChainSwitchButton />

  const incrementData = encodeFunctionData({
    abi: counterAbi,
    functionName: 'increment',
  })

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() =>
          sendCalls({
            calls: [
              { to: COUNTER_ADDRESS, data: incrementData },
              { to: COUNTER_ADDRESS, data: incrementData },
            ],
            chainId: APP_CHAIN_ID,
          })
        }
        disabled={isPending || isConfirming}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending
          ? 'Confirm in Wallet...'
          : isConfirming
            ? 'Confirming...'
            : 'Increment x2 (Batch)'}
      </button>
      {isSuccess && <p className="text-sm text-green-600">Batch confirmed!</p>}
    </div>
  )
}

function SequentialFlow() {
  const chainId = useChainId()
  const { data: hash, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: counterQueryKey })
    }
  }, [isSuccess, queryClient])

  if (chainId !== APP_CHAIN_ID) return <ChainSwitchButton />

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() =>
          writeContract({
            address: COUNTER_ADDRESS,
            abi: counterAbi,
            functionName: 'increment',
            chainId: APP_CHAIN_ID,
          })
        }
        disabled={isPending || isConfirming}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending
          ? 'Confirm in Wallet...'
          : isConfirming
            ? 'Confirming...'
            : 'Increment'}
      </button>
      {isSuccess && <p className="text-sm text-green-600">Confirmed!</p>}
      {hash && (
        <a
          href={EXPLORER_TX_URL(hash)}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 underline"
        >
          View on Basescan
        </a>
      )}
    </div>
  )
}
