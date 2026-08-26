'use client'

import { useEffect, useState } from 'react'
import { encodeFunctionData, zeroAddress } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSendCalls,
  useSignTypedData,
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
  PAY_REQUEST_ADDRESS,
  isPayRequestDeployed,
  payRequestAbi,
} from '@/config/pay-request'
import { erc20Abi } from '@/config/standing-order'
import { useAttributedWrite } from '@/hooks/useAttributedWrite'
import { usePayRequest } from '@/hooks/usePayRequests'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { attributionCapabilities } from '@/lib/attribution'
import { permitCallForExactUsdc } from '@/lib/capped-usdc-pay'
import { formatUsdc, shortAddress } from '@/lib/format'
import { checksumAddress, simulateErrorMessage } from '@/lib/tx-guard'
import { isUserRejected } from '@/lib/usdc-permit'

export function PayRequestPanel({ id }: { id: bigint }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { supportsBatching } = useWalletCapabilities()
  const { signTypedDataAsync } = useSignTypedData()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const request = usePayRequest(id)
  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, PAY_REQUEST_ADDRESS] : undefined,
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

  const [confirm, setConfirm] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isSuccess || callsSuccess) {
      request.refetch()
      allowance.refetch()
    }
  }, [isSuccess, callsSuccess, request, allowance])

  if (!isPayRequestDeployed) {
    return <p className="text-sm text-amber-700">PayRequest is not deployed.</p>
  }
  if (request.isLoading) return <p className="text-sm text-zinc-500">Loading request…</p>
  const data = request.data
  if (!data || data.payee === zeroAddress) {
    return <p className="text-sm text-red-600">Unknown pay request.</p>
  }
  if (chainId !== APP_CHAIN_ID) {
    return (
      <button type="button" className="float-btn" onClick={() => switchChain({ chainId: APP_CHAIN_ID })}>
        {isSwitching ? 'Switching…' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  const isPayee = Boolean(address && data.payee.toLowerCase() === address.toLowerCase())
  const isDesignatedPayer = Boolean(
    address && data.payer.toLowerCase() === address.toLowerCase(),
  )
  const isOpen = data.payer === zeroAddress
  const canPay = Boolean(
    isConnected && !data.paid && !isPayee && (isOpen || isDesignatedPayer),
  )
  const payAmount = data.amount
  const needsApprove = (allowance.data ?? BigInt(0)) < payAmount
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pay/${id.toString()}`
      : `/pay/${id.toString()}`

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function onConfirmPay() {
    if (!client || !address) return
    setSimulating(true)
    setSimError(null)
    const payCall = {
      to: PAY_REQUEST_ADDRESS,
      data: encodeFunctionData({
        abi: payRequestAbi,
        functionName: 'pay',
        args: [id],
      }),
    }
    try {
      if (needsApprove) {
        const permitCall = await permitCallForExactUsdc({
          client,
          signTypedDataAsync,
          owner: address,
          spender: PAY_REQUEST_ADDRESS,
          value: payAmount,
        })
        setSimulating(false)
        setConfirm(false)
        sendCalls({
          calls: [permitCall, payCall],
          chainId: APP_CHAIN_ID,
          capabilities: attributionCapabilities(),
        })
        return
      }
      if (supportsBatching) {
        setSimulating(false)
        setConfirm(false)
        sendCalls({
          calls: [payCall],
          chainId: APP_CHAIN_ID,
          capabilities: attributionCapabilities(),
        })
        return
      }
      await client.simulateContract({
        address: PAY_REQUEST_ADDRESS,
        abi: payRequestAbi,
        functionName: 'pay',
        args: [id],
        account: address,
        chain: appChain,
      })
    } catch (err) {
      setSimError(
        isUserRejected(err)
          ? 'Signature cancelled. Coinbase shows “Unlimited” on ERC-20 approve — Due uses a permit for this amount only.'
          : simulateErrorMessage(err),
      )
      setSimulating(false)
      return
    }
    setSimulating(false)
    setConfirm(false)
    writeContract({
      address: PAY_REQUEST_ADDRESS,
      abi: payRequestAbi,
      functionName: 'pay',
      args: [id],
      chainId: APP_CHAIN_ID,
    })
  }

  return (
    <div className="float-card max-w-lg p-5">
      <p className="text-3xl font-bold">{formatUsdc(data.amount)} USDC</p>
      <p className="mt-1 text-sm text-zinc-600">
        One-time request{data.memo ? ` · ${data.memo}` : ''}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase text-zinc-500">Payee</dt>
          <dd className="font-mono">{shortAddress(data.payee)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Payer</dt>
          <dd className="font-mono">
            {isOpen ? 'Anyone with this link' : shortAddress(data.payer)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-zinc-500">Status</dt>
          <dd>
            {data.paid
              ? `Paid by ${shortAddress(data.paidBy)}`
              : isOpen
                ? 'Open'
                : 'Unpaid'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="float-btn-ghost" onClick={copyShareLink}>
          {copied ? 'Copied' : 'Copy share link'}
        </button>
      </div>

      {!isConnected && !data.paid && (
        <p className="mt-4 text-sm text-zinc-500">Connect a wallet to pay this request.</p>
      )}
      {isConnected && !data.paid && !canPay && (
        <p className="mt-4 text-sm text-zinc-500">
          {isPayee
            ? 'Share the link. Only the payer settles this request.'
            : 'This request is assigned to a different payer.'}
        </p>
      )}

      {canPay && (
        <div className="mt-4">
          <button
            type="button"
            className="float-btn"
            disabled={isPending || isConfirming || isCallsPending || isCallsConfirming}
            onClick={() => {
              setSimError(null)
              setConfirm(true)
            }}
          >
            {needsApprove ? 'Sign and pay' : 'Pay'}
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
        open={confirm}
        title="Pay this request"
        lines={[
          { label: 'To', value: checksumAddress(data.payee) },
          { label: 'Amount', value: `${formatUsdc(data.amount)} USDC` },
          {
            label: 'USDC permit',
            value: needsApprove
              ? `Sign ${formatUsdc(data.amount)} USDC for this request only — not unlimited`
              : 'Already authorized',
          },
        ]}
        pending={simulating}
        error={simError}
        onCancel={() => setConfirm(false)}
        onConfirm={onConfirmPay}
      />
    </div>
  )
}
