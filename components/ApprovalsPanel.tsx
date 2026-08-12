'use client'

import { useEffect, useMemo } from 'react'
import { encodeFunctionData } from 'viem'
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS, ZERO_ADDRESS, appChain } from '@/config/network'
import { erc20Abi } from '@/config/pay-request'
import { KNOWN_USDC_SPENDERS } from '@/config/spenders'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { formatUsdc, shortAddress } from '@/lib/format'

export function ApprovalsPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { supportsBatching } = useWalletCapabilities()

  const spenders = useMemo(
    () => KNOWN_USDC_SPENDERS.filter((s) => s.address !== ZERO_ADDRESS),
    [],
  )

  const { data, refetch } = useReadContracts({
    contracts: spenders.map((spender) => ({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance' as const,
      args: address ? [address, spender.address] : undefined,
      chainId: APP_CHAIN_ID,
    })),
    query: { enabled: Boolean(address) },
  })

  const rows = spenders.map((spender, i) => ({
    ...spender,
    allowance: (data?.[i]?.result as bigint | undefined) ?? BigInt(0),
  }))
  const active = rows.filter((row) => row.allowance > BigInt(0))

  const { data: hash, isPending, writeContract, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const {
    data: callsData,
    sendCalls,
    isPending: isCallsPending,
    error: callsError,
  } = useSendCalls()
  const { isLoading: isCallsConfirming, isSuccess: callsSuccess } =
    useWaitForCallsStatus({ id: callsData?.id })

  useEffect(() => {
    if (isSuccess || callsSuccess) refetch()
  }, [isSuccess, callsSuccess, refetch])

  function revokeOne(spender: `0x${string}`) {
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, BigInt(0)],
      chainId: APP_CHAIN_ID,
    })
  }

  function revokeAll() {
    const calls = active.map((row) => ({
      to: USDC_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [row.address, BigInt(0)],
      }),
    }))
    sendCalls({ chainId: APP_CHAIN_ID, calls })
  }

  if (!isConnected) {
    return <p className="text-sm text-zinc-500">Connect to review USDC approvals.</p>
  }
  if (chainId !== APP_CHAIN_ID) {
    return (
      <button
        type="button"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        onClick={() => switchChain({ chainId: APP_CHAIN_ID })}
      >
        {isSwitching ? 'Switching…' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Leftover allowances let old apps move your USDC. Revoke what you no
        longer use. Batch revoke needs a smart wallet (Base Account).
      </p>
      {active.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No non-zero USDC allowances on the known spender list.
        </p>
      ) : (
        <>
          {supportsBatching && active.length > 1 && (
            <button
              type="button"
              className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              disabled={isCallsPending || isCallsConfirming}
              onClick={revokeAll}
            >
              {isCallsPending
                ? 'Confirm in wallet…'
                : isCallsConfirming
                  ? 'Confirming…'
                  : `Revoke all (${active.length})`}
            </button>
          )}
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {active.map((row) => (
              <li
                key={row.address}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="font-mono text-xs text-zinc-500">
                    {shortAddress(row.address)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatUsdc(row.allowance)}</span>
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-600"
                    disabled={isPending || isConfirming}
                    onClick={() => revokeOne(row.address)}
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {(error || callsError) && (
        <p className="text-sm text-red-600">{(error ?? callsError)?.message}</p>
      )}
    </div>
  )
}
