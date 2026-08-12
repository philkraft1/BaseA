'use client'

import { useState } from 'react'
import { isAddress, zeroAddress } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS, appChain } from '@/config/network'
import {
  isPayRequestDeployed,
  PAY_REQUEST_ADDRESS,
  payRequestAbi,
} from '@/config/pay-request'
import { parseUsdc } from '@/lib/format'
import { resolveRecipient } from '@/lib/resolve'

export function CreateRequestForm() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const { data: hash, isPending, writeContract, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const [amount, setAmount] = useState('10')
  const [memo, setMemo] = useState('')
  const [payer, setPayer] = useState('')
  const [shareId, setShareId] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  if (!isConnected) {
    return <p className="text-sm text-zinc-500">Connect to create a request.</p>
  }
  if (!isPayRequestDeployed) {
    return (
      <p className="text-sm text-amber-700">
        Deploy PayRequest and set NEXT_PUBLIC_PAY_REQUEST_ADDRESS first.
      </p>
    )
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
    setShareId(null)
    const parsed = parseUsdc(amount)
    if (parsed <= BigInt(0)) {
      setResolveError('Enter an amount greater than 0.')
      return
    }

    let payerAddress: `0x${string}` = zeroAddress
    if (payer.trim()) {
      if (isAddress(payer.trim())) {
        payerAddress = payer.trim() as `0x${string}`
      } else if (client) {
        const resolved = await resolveRecipient(client, payer)
        if (!resolved) {
          setResolveError('Could not resolve payer address or basename.')
          return
        }
        payerAddress = resolved
      }
    }

    writeContract(
      {
        address: PAY_REQUEST_ADDRESS,
        abi: payRequestAbi,
        functionName: 'createRequest',
        args: [payerAddress, USDC_ADDRESS, parsed, memo],
        chainId: APP_CHAIN_ID,
      },
      {
        onSuccess: async (txHash) => {
          if (!client) return
          const receipt = await client.waitForTransactionReceipt({ hash: txHash })
          const log = receipt.logs.find(
            (item) =>
              item.address.toLowerCase() === PAY_REQUEST_ADDRESS.toLowerCase(),
          )
          if (log?.topics[1]) {
            const id = BigInt(log.topics[1]).toString()
            setShareId(id)
          }
        },
      },
    )
  }

  const shareUrl =
    typeof window !== 'undefined' && shareId
      ? `${window.location.origin}/pay/${shareId}`
      : shareId
        ? `/pay/${shareId}`
        : null

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      <label className="text-sm">
        Amount (USDC)
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />
      </label>
      <label className="text-sm">
        Memo
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Dinner, invoice #12…"
        />
      </label>
      <label className="text-sm">
        Payer (optional address or basename)
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          placeholder="alice.base.eth or 0x… (blank = anyone)"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending
          ? 'Confirm in wallet…'
          : isConfirming
            ? 'Confirming…'
            : 'Create request'}
      </button>
      {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}
      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}
      {isSuccess && shareUrl && (
        <p className="text-sm">
          Share this link:{' '}
          <a className="break-all underline" href={shareUrl}>
            {shareUrl}
          </a>
        </p>
      )}
      {isSuccess && !shareUrl && (
        <p className="text-sm text-green-700">Request created.</p>
      )}
    </form>
  )
}
