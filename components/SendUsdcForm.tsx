'use client'

import { useState } from 'react'
import { encodeFunctionData } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS, appChain } from '@/config/network'
import { erc20Abi } from '@/config/pay-request'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { parseUsdc } from '@/lib/format'
import { resolveRecipient } from '@/lib/resolve'

export function SendUsdcForm() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const { supportsBatching } = useWalletCapabilities()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('5')
  const [resolveError, setResolveError] = useState<string | null>(null)

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

  if (!isConnected) {
    return <p className="text-sm text-zinc-500">Connect to send USDC.</p>
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResolveError(null)
    const parsed = parseUsdc(amount)
    if (parsed <= BigInt(0)) {
      setResolveError('Enter an amount greater than 0.')
      return
    }
    if (!client) return
    const recipient = await resolveRecipient(client, to)
    if (!recipient) {
      setResolveError('Could not resolve address or basename.')
      return
    }

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient, parsed],
    })

    if (supportsBatching) {
      sendCalls({
        chainId: APP_CHAIN_ID,
        calls: [{ to: USDC_ADDRESS, data }],
      })
      return
    }

    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient, parsed],
      chainId: APP_CHAIN_ID,
    })
  }

  const pending = isPending || isCallsPending || isConfirming || isCallsConfirming

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      <label className="text-sm">
        To (address or basename)
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="alice.base.eth"
        />
      </label>
      <label className="text-sm">
        Amount (USDC)
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending || isCallsPending
          ? 'Confirm in wallet…'
          : isConfirming || isCallsConfirming
            ? 'Confirming…'
            : 'Send USDC'}
      </button>
      {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}
      {(error || callsError) && (
        <p className="text-sm text-red-600">{(error ?? callsError)?.message}</p>
      )}
      {(isSuccess || callsSuccess) && (
        <p className="text-sm text-green-700">Sent.</p>
      )}
    </form>
  )
}
