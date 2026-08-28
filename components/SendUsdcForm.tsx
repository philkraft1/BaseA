'use client'

import { useState } from 'react'
import { isAddress, zeroAddress } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'
import { TxConfirm } from '@/components/TxConfirm'
import { APP_CHAIN_ID, EXPLORER_TX_URL } from '@/config/network'
import { sendUsdcWithBasePay, waitForBasePayment } from '@/lib/base-pay'
import { formatUsdc } from '@/lib/format'
import { resolveRecipient } from '@/lib/resolve'
import {
  assertSafeRecipient,
  checksumAddress,
  parseUsdcAmount,
  simulateErrorMessage,
} from '@/lib/tx-guard'
import { formatUsdcPlain } from '@/lib/usdc'

export function SendUsdcForm() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const [amount, setAmount] = useState('5.00')
  const [payee, setPayee] = useState('')
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [pendingPayee, setPendingPayee] = useState<`0x${string}`>(zeroAddress)
  const [pendingAmount, setPendingAmount] = useState<bigint>(BigInt(0))
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResolveError(null)
    setPayError(null)
    setPaymentId(null)
    setStatusMessage(null)
    const parsed = parseUsdcAmount(amount)
    if (!parsed.ok) {
      setResolveError(parsed.error)
      return
    }
    if (!payee.trim()) {
      setResolveError('Enter a recipient address or basename.')
      return
    }

    let payeeAddress: `0x${string}`
    if (isAddress(payee.trim())) {
      payeeAddress = payee.trim() as `0x${string}`
    } else if (client) {
      const resolved = await resolveRecipient(client, payee)
      if (!resolved) {
        setResolveError('Could not resolve recipient address or basename.')
        return
      }
      payeeAddress = resolved
    } else {
      setResolveError('Network client unavailable.')
      return
    }

    const unsafe = assertSafeRecipient(payeeAddress)
    if (unsafe) {
      setResolveError(unsafe)
      return
    }
    if (address && payeeAddress.toLowerCase() === address.toLowerCase()) {
      setResolveError('Recipient cannot be your own wallet.')
      return
    }

    setPendingPayee(payeeAddress)
    setPendingAmount(parsed.value)
    setConfirmOpen(true)
  }

  async function onConfirm() {
    setPending(true)
    setPayError(null)
    try {
      const payment = await sendUsdcWithBasePay({
        amount: formatUsdcPlain(pendingAmount),
        to: pendingPayee,
      })
      setPaymentId(payment.id)
      setStatusMessage('Sent — waiting for confirmation…')
      setConfirmOpen(false)
      const status = await waitForBasePayment(payment.id)
      if (status.status === 'completed') {
        setStatusMessage(status.message || 'Payment completed.')
      } else if (status.status === 'failed') {
        setPayError(status.reason || status.message || 'Payment failed.')
        setStatusMessage(null)
      } else {
        setStatusMessage(status.message || `Status: ${status.status}`)
      }
    } catch (err) {
      setPayError(simulateErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
        <p className="text-sm text-zinc-600">
          One-tap USDC with the Base Account SDK. Opens Base Account — you hold
          the keys. No PayRequest contract and no ERC-20 approve step.
        </p>
        <label className="text-sm">
          Recipient (address or basename)
          <input
            className="float-field"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="alice.base.eth"
          />
        </label>
        <label className="text-sm">
          Amount (USDC)
          <input
            className="float-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <button type="submit" disabled={pending} className="float-btn">
          {pending ? 'Paying…' : 'Send with Base Account'}
        </button>
        {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}
        {payError && <p className="text-sm text-red-600">{payError}</p>}
        {statusMessage && <p className="text-sm text-zinc-600">{statusMessage}</p>}
        {paymentId && (
          <p className="text-sm">
            <a
              className="break-all underline"
              href={EXPLORER_TX_URL(paymentId)}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
            </a>
          </p>
        )}
      </form>
      <TxConfirm
        open={confirmOpen}
        title="Send USDC"
        lines={[
          { label: 'To', value: checksumAddress(pendingPayee) },
          { label: 'Amount', value: `${formatUsdc(pendingAmount)} USDC` },
          { label: 'Method', value: 'Base Account pay()' },
        ]}
        pending={pending}
        error={payError}
        confirmLabel="Pay with Base Account"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  )
}
