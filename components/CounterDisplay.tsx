'use client'

import { useReadContract } from 'wagmi'
import { APP_CHAIN_ID } from '@/config/network'
import { COUNTER_ADDRESS, counterAbi } from '@/config/counter'

export function CounterDisplay() {
  const isDeployed =
    COUNTER_ADDRESS !== '0x0000000000000000000000000000000000000000'

  const { data: count, isLoading, isError } = useReadContract({
    address: COUNTER_ADDRESS,
    abi: counterAbi,
    functionName: 'number',
    chainId: APP_CHAIN_ID,
    query: { enabled: isDeployed },
  })

  if (!isDeployed) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400">
        Counter not deployed yet. Set{' '}
        <code className="font-mono">NEXT_PUBLIC_COUNTER_ADDRESS</code> after{' '}
        <code className="font-mono">forge create</code>.
      </p>
    )
  }

  if (isLoading && count === undefined) {
    return <p className="text-sm text-zinc-500">Loading...</p>
  }

  if (isError && count === undefined) {
    return <p className="text-sm text-red-600">Failed to read contract</p>
  }

  return (
    <p className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
      {count?.toString()}
    </p>
  )
}
