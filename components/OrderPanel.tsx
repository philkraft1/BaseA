'use client'

import { useEffect, useState } from 'react'
import { encodeFunctionData, zeroAddress } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { TxConfirm } from '@/components/TxConfirm'
import {
  APP_CHAIN_ID,
  EXPLORER_TX_URL,
  USDC_ADDRESS,
  appChain,
} from '@/config/network'
import {
  STANDING_ORDER_ADDRESS,
  erc20Abi,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'
import { useAttributedWrite } from '@/hooks/useAttributedWrite'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { useOrder } from '@/hooks/useOrders'
import { attributionCapabilities } from '@/lib/attribution'
import { formatUsdc, shortAddress } from '@/lib/format'
import { formatDueDate, periodToDays } from '@/lib/period'
import { checksumAddress, simulateErrorMessage } from '@/lib/tx-guard'

export function OrderPanel({ id }: { id: bigint }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { supportsBatching } = useWalletCapabilities()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const { order, due, nextDueAt } = useOrder(id)
  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, STANDING_ORDER_ADDRESS] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled: Boolean(address) },
  })

  const { hash, isPending, writeContract, error } = useAttributedWrite()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const {
    data: callsData,
    sendCalls,
    isPending: isCallsPending,
    error: callsError,
  } = useSendCalls()
  const { isLoading: isCallsConfirming, isSuccess: callsSuccess } =
    useWaitForCallsStatus({ id: callsData?.id })

  const [confirm, setConfirm] = useState<'pay' | 'cancel' | null>(null)
  const [simError, setSimError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    if (isSuccess || callsSuccess) {
      order.refetch()
      due.refetch()
      nextDueAt.refetch()
      allowance.refetch()
    }
  }, [isSuccess, callsSuccess, order, due, nextDueAt, allowance])

  if (!isStandingOrderDeployed) {
    return <p className="text-sm text-amber-700">StandingOrder is not deployed.</p>
  }
  if (order.isLoading) return <p className="text-sm text-zinc-500">Loading order…</p>
  const data = order.data
  if (!data || data.payer === zeroAddress) {
    return <p className="text-sm text-red-600">Unknown standing order.</p>
  }
  if (chainId !== APP_CHAIN_ID) {
    return (
      <button type="button" className="float-btn" onClick={() => switchChain({ chainId: APP_CHAIN_ID })}>
        {isSwitching ? 'Switching…' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  const isPayer = Boolean(address && data.payer.toLowerCase() === address.toLowerCase())
  const needsApprove = (allowance.data ?? BigInt(0)) < data.amount

  async function onConfirmPay() {
    if (!client || !address) return
    setSimulating(true)
    setSimError(null)
    try {
      if (needsApprove && supportsBatching) {
        setSimulating(false)
        setConfirm(null)
        sendCalls({
          calls: [
            {
              to: USDC_ADDRESS,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [STANDING_ORDER_ADDRESS, data.amount],
              }),
            },
            {
              to: STANDING_ORDER_ADDRESS,
              data: encodeFunctionData({
                abi: standingOrderAbi,
                functionName: 'payPeriod',
                args: [id],
              }),
            },
          ],
          chainId: APP_CHAIN_ID,
          capabilities: attributionCapabilities(),
        })
        return
      }
      if (needsApprove) {
        await client.simulateContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [STANDING_ORDER_ADDRESS, data.amount],
          account: address,
          chain: appChain,
        })
        setSimulating(false)
        setConfirm(null)
        writeContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [STANDING_ORDER_ADDRESS, data.amount],
          chainId: APP_CHAIN_ID,
        })
        return
      }
      await client.simulateContract({
        address: STANDING_ORDER_ADDRESS,
        abi: standingOrderAbi,
        functionName: 'payPeriod',
        args: [id],
        account: address,
        chain: appChain,
      })
    } catch (err) {
      setSimError(simulateErrorMessage(err))
      setSimulating(false)
      return
    }
    setSimulating(false)
    setConfirm(null)
    writeContract({
      address: STANDING_ORDER_ADDRESS,
      abi: standingOrderAbi,
      functionName: 'payPeriod',
      args: [id],
      chainId: APP_CHAIN_ID,
    })
  }

  async function onConfirmCancel() {
    if (!client || !address) return
    setSimulating(true)
    setSimError(null)
    try {
      await client.simulateContract({
        address: STANDING_ORDER_ADDRESS,
        abi: standingOrderAbi,
        functionName: 'cancel',
        args: [id],
        account: address,
        chain: appChain,
      })
    } catch (err) {
      setSimError(simulateErrorMessage(err))
      setSimulating(false)
      return
    }
    setSimulating(false)
    setConfirm(null)
    writeContract({
      address: STANDING_ORDER_ADDRESS,
      abi: standingOrderAbi,
      functionName: 'cancel',
      args: [id],
      chainId: APP_CHAIN_ID,
    })
  }

  return (
    <div className="float-card max-w-lg p-5">
      <p className="text-3xl font-bold">{formatUsdc(data.amount)} USDC</p>
      <p className="mt-1 text-sm text-zinc-600">
        Every {periodToDays(data.period)} days
        {data.memo ? ` · ${data.memo}` : ''}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase text-zinc-500">Payer</dt>
          <dd className="font-mono">{shortAddress(data.payer)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Payee</dt>
          <dd className="font-mono">{shortAddress(data.payee)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Status</dt>
          <dd>
            {data.cancelled
              ? 'Cancelled'
              : due.data
                ? 'Due now'
                : `Next ${formatDueDate(nextDueAt.data ?? data.lastPaidAt)}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Paid so far</dt>
          <dd>
            {formatUsdc(data.totalPaid)} USDC · {data.paymentCount.toString()} payments
          </dd>
        </div>
      </dl>

      {!isConnected && (
        <p className="mt-4 text-sm text-zinc-500">Connect the payer wallet to settle this period.</p>
      )}

      {isPayer && !data.cancelled && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="float-btn"
            disabled={!due.data || isPending || isConfirming || isCallsPending || isCallsConfirming}
            onClick={() => {
              setSimError(null)
              setConfirm('pay')
            }}
          >
            {needsApprove ? 'Approve and pay this period' : 'Pay this period'}
          </button>
          <button
            type="button"
            className="float-btn-ghost"
            disabled={isPending || isConfirming}
            onClick={() => {
              setSimError(null)
              setConfirm('cancel')
            }}
          >
            Cancel order
          </button>
        </div>
      )}

      {(error || callsError) && (
        <p className="mt-3 text-sm text-red-600">
          {(error ?? callsError)?.message}
        </p>
      )}
      {(isSuccess || callsSuccess) && hash && (
        <p className="mt-3 text-sm">
          <a className="underline" href={EXPLORER_TX_URL(hash)} target="_blank" rel="noreferrer">
            View transaction
          </a>
        </p>
      )}

      <TxConfirm
        open={confirm === 'pay'}
        title="Pay this period"
        lines={[
          { label: 'To', value: checksumAddress(data.payee) },
          { label: 'Amount', value: `${formatUsdc(data.amount)} USDC` },
          {
            label: 'USDC approval',
            value: needsApprove
              ? `${formatUsdc(data.amount)} USDC (this period only)`
              : 'Already approved',
          },
        ]}
        pending={simulating}
        error={simError}
        onCancel={() => setConfirm(null)}
        onConfirm={onConfirmPay}
      />
      <TxConfirm
        open={confirm === 'cancel'}
        title="Cancel standing order"
        lines={[{ label: 'Order', value: id.toString() }]}
        pending={simulating}
        error={simError}
        confirmLabel="Cancel order"
        onCancel={() => setConfirm(null)}
        onConfirm={onConfirmCancel}
      />
    </div>
  )
}
