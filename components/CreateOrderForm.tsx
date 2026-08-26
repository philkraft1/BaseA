'use client'

import { useState } from 'react'
import { isAddress, zeroAddress } from 'viem'
import { base } from '@base-org/account'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { TxConfirm } from '@/components/TxConfirm'
import { useAttributedWrite } from '@/hooks/useAttributedWrite'
import {
  APP_CHAIN_ID,
  MEMO_MAX_BYTES,
  USDC_ADDRESS,
  appChain,
} from '@/config/network'
import {
  STANDING_ORDER_ADDRESS,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'
import { formatUsdc } from '@/lib/format'
import { PERIOD_OPTIONS, daysToPeriod } from '@/lib/period'
import { resolveRecipient } from '@/lib/resolve'
import {
  checksumAddress,
  memoByteLength,
  parseUsdcAmount,
  simulateErrorMessage,
  assertSafeRecipient,
} from '@/lib/tx-guard'
import { formatUsdcPlain, subscriptionIdToBytes32 } from '@/lib/usdc'

export function CreateOrderForm() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const { hash, isPending, writeContract, error } = useAttributedWrite()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const [amount, setAmount] = useState('50')
  const [memo, setMemo] = useState('Rent')
  const [payee, setPayee] = useState('')
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]['days']>(30)
  const [shareId, setShareId] = useState<string | null>(null)
  const [subscribeNote, setSubscribeNote] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)
  const [pendingPayee, setPendingPayee] = useState<`0x${string}`>(zeroAddress)
  const [pendingAmount, setPendingAmount] = useState<bigint>(BigInt(0))
  const [pendingSub, setPendingSub] = useState<`0x${string}`>(
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  )

  if (!isConnected) {
    return <p className="text-sm text-zinc-500">Connect to create a standing order.</p>
  }
  if (!isStandingOrderDeployed) {
    return (
      <p className="text-sm text-amber-700">
        Deploy StandingOrder and set NEXT_PUBLIC_STANDING_ORDER_ADDRESS first.
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
    setSubscribeNote(null)
    const parsed = parseUsdcAmount(amount)
    if (!parsed.ok) {
      setResolveError(parsed.error)
      return
    }
    if (memoByteLength(memo) > MEMO_MAX_BYTES) {
      setResolveError(`Memo must be at most ${MEMO_MAX_BYTES} bytes.`)
      return
    }
    if (!payee.trim()) {
      setResolveError('Enter a payee address or basename.')
      return
    }

    let payeeAddress: `0x${string}`
    if (isAddress(payee.trim())) {
      payeeAddress = payee.trim() as `0x${string}`
    } else if (client) {
      const resolved = await resolveRecipient(client, payee)
      if (!resolved) {
        setResolveError('Could not resolve payee address or basename.')
        return
      }
      payeeAddress = resolved
    } else {
      setResolveError('Wallet client unavailable.')
      return
    }

    const unsafe = assertSafeRecipient(payeeAddress)
    if (unsafe) {
      setResolveError(unsafe)
      return
    }
    if (address && payeeAddress.toLowerCase() === address.toLowerCase()) {
      setResolveError('Payee cannot be your own wallet.')
      return
    }

    setPendingPayee(payeeAddress)
    setPendingAmount(parsed.value)
    setConfirmOpen(true)
  }

  async function onConfirm() {
    if (!client || !address) return
    setSimulating(true)
    setSimError(null)

    let subscriptionId =
      '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
    try {
      const ownerRes = await fetch('/api/subscription/owner')
      const owner = (await ownerRes.json()) as {
        configured?: boolean
        address?: `0x${string}` | null
      }
      if (owner.configured && owner.address) {
        try {
          const subscription = await base.subscribe({
            recurringCharge: formatUsdcPlain(pendingAmount),
            subscriptionOwner: owner.address,
            periodInDays: days,
          })
          subscriptionId = subscriptionIdToBytes32(subscription.id)
          setSubscribeNote('Auto-charge permission granted. Due can pull this period when it is due.')
        } catch (err) {
          setSubscribeNote(
            `Auto-charge not available here (${simulateErrorMessage(err)}). You can still Pay this period manually.`,
          )
        }
      } else {
        setSubscribeNote(
          'CDP subscription owner is not configured. Manual Pay this period still works.',
        )
      }
    } catch (err) {
      setSubscribeNote(
        `Could not reach subscription owner API (${simulateErrorMessage(err)}). Manual pay still works.`,
      )
    }

    const period = daysToPeriod(days)
    try {
      await client.simulateContract({
        address: STANDING_ORDER_ADDRESS,
        abi: standingOrderAbi,
        functionName: 'create',
        args: [pendingPayee, USDC_ADDRESS, pendingAmount, period, subscriptionId, memo],
        account: address,
        chain: appChain,
      })
    } catch (err) {
      setSimError(simulateErrorMessage(err))
      setSimulating(false)
      return
    }
    setPendingSub(subscriptionId)
    setSimulating(false)
    setConfirmOpen(false)
    writeContract(
      {
        address: STANDING_ORDER_ADDRESS,
        abi: standingOrderAbi,
        functionName: 'create',
        args: [pendingPayee, USDC_ADDRESS, pendingAmount, period, subscriptionId, memo],
        chainId: APP_CHAIN_ID,
      },
      {
        onSuccess: async (txHash) => {
          if (!client) return
          const receipt = await client.waitForTransactionReceipt({ hash: txHash })
          const log = receipt.logs.find(
            (item) =>
              item.address.toLowerCase() === STANDING_ORDER_ADDRESS.toLowerCase() &&
              item.topics[1],
          )
          if (log?.topics[1]) {
            setShareId(BigInt(log.topics[1]).toString())
          }
        },
      },
    )
  }

  const shareUrl =
    typeof window !== 'undefined' && shareId
      ? `${window.location.origin}/due/${shareId}`
      : shareId
        ? `/due/${shareId}`
        : null

  return (
    <>
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
        <label className="text-sm">
          Payee (address or basename)
          <input
            className="float-field"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="alice.base.eth"
          />
        </label>
        <label className="text-sm">
          Amount (USDC per period)
          <input
            className="float-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="text-sm">
          Period
          <select
            className="float-field"
            value={days}
            onChange={(e) =>
              setDays(Number(e.target.value) as (typeof PERIOD_OPTIONS)[number]['days'])
            }
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.days} value={option.days}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Memo
          <input
            className="float-field"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Rent, allowance…"
            maxLength={MEMO_MAX_BYTES}
          />
        </label>
        <button type="submit" disabled={isPending || isConfirming} className="float-btn">
          {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Create standing order'}
        </button>
        {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}
        {subscribeNote && <p className="text-sm text-zinc-600">{subscribeNote}</p>}
        {isSuccess && shareUrl && (
          <p className="text-sm">
            Share this link:{' '}
            <a className="break-all underline" href={shareUrl}>
              {shareUrl}
            </a>
          </p>
        )}
      </form>
      <TxConfirm
        open={confirmOpen}
        title="Create standing order"
        lines={[
          { label: 'Payee', value: checksumAddress(pendingPayee) },
          { label: 'Amount', value: `${formatUsdc(pendingAmount)} USDC` },
          { label: 'Period', value: `${days} days` },
          { label: 'Memo', value: memo || '—' },
        ]}
        pending={simulating}
        error={simError}
        confirmLabel="Approve and create"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
      />
      <p className="sr-only">{pendingSub}</p>
    </>
  )
}
