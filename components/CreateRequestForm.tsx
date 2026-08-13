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
import { TxConfirm } from '@/components/TxConfirm'
import {
  APP_CHAIN_ID,
  MEMO_MAX_BYTES,
  USDC_ADDRESS,
  appChain,
} from '@/config/network'
import {
  isPayRequestDeployed,
  PAY_REQUEST_ADDRESS,
  payRequestAbi,
} from '@/config/pay-request'
import { formatUsdc } from '@/lib/format'
import { resolveRecipient } from '@/lib/resolve'
import {
  checksumAddress,
  memoByteLength,
  parseUsdcAmount,
  simulateErrorMessage,
} from '@/lib/tx-guard'

export function CreateRequestForm() {
  const { address, isConnected } = useAccount()
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)
  const [pendingPayer, setPendingPayer] = useState<`0x${string}`>(zeroAddress)
  const [pendingAmount, setPendingAmount] = useState<bigint>(BigInt(0))

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
        className="float-btn"
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
    setSimError(null)
    const parsed = parseUsdcAmount(amount)
    if (!parsed.ok) {
      setResolveError(parsed.error)
      return
    }
    if (memoByteLength(memo) > MEMO_MAX_BYTES) {
      setResolveError(`Memo must be at most ${MEMO_MAX_BYTES} bytes.`)
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

    setPendingPayer(payerAddress)
    setPendingAmount(parsed.value)
    setConfirmOpen(true)
  }

  async function onConfirm() {
    if (!client || !address) return
    setSimulating(true)
    setSimError(null)
    try {
      await client.simulateContract({
        address: PAY_REQUEST_ADDRESS,
        abi: payRequestAbi,
        functionName: 'createRequest',
        args: [pendingPayer, USDC_ADDRESS, pendingAmount, memo],
        account: address,
        chain: appChain,
      })
    } catch (err) {
      setSimError(simulateErrorMessage(err))
      setSimulating(false)
      return
    }
    setSimulating(false)
    setConfirmOpen(false)
    writeContract(
      {
        address: PAY_REQUEST_ADDRESS,
        abi: payRequestAbi,
        functionName: 'createRequest',
        args: [pendingPayer, USDC_ADDRESS, pendingAmount, memo],
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
    <>
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
        <label className="text-sm">
          Amount (USDC)
          <input
            className="float-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="text-sm">
          Memo
          <input
            className="float-field"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Dinner, invoice #12…"
            maxLength={MEMO_MAX_BYTES}
          />
        </label>
        <label className="text-sm">
          Payer (optional address or basename)
          <input
            className="float-field"
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            placeholder="alice.base.eth or 0x… (blank = anyone)"
          />
        </label>
        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="float-btn"
        >
          {isPending
            ? 'Confirm in wallet…'
            : isConfirming
              ? 'Confirming…'
              : 'Create request'}
        </button>
        {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}
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
      <TxConfirm
        open={confirmOpen}
        title="Create USDC request"
        lines={[
          { label: 'Contract', value: 'PayRequest' },
          { label: 'Token', value: checksumAddress(USDC_ADDRESS) },
          { label: 'Amount', value: `${formatUsdc(pendingAmount)} USDC` },
          {
            label: 'Payer',
            value:
              pendingPayer === zeroAddress
                ? 'Anyone'
                : checksumAddress(pendingPayer),
          },
          { label: 'Memo', value: memo || '—' },
        ]}
        pending={simulating}
        error={simError}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  )
}
