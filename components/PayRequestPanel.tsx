'use client'

import { useEffect, useState } from 'react'
import { encodeFunctionData } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { TxConfirm } from '@/components/TxConfirm'
import { APP_CHAIN_ID, USDC_ADDRESS, appChain } from '@/config/network'
import {
  PAY_REQUEST_ADDRESS,
  erc20Abi,
  isPayRequestDeployed,
  payRequestAbi,
} from '@/config/pay-request'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { formatUsdc, shortAddress } from '@/lib/format'
import {
  checksumAddress,
  isNativeUsdc,
  simulateErrorMessage,
} from '@/lib/tx-guard'

type RequestTuple = {
  payee: `0x${string}`
  payer: `0x${string}`
  token: `0x${string}`
  amount: bigint
  memo: string
  paid: boolean
  paidBy: `0x${string}`
}

export function PayRequestPanel({ id }: { id: bigint }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { supportsBatching } = useWalletCapabilities()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useReadContract({
    address: PAY_REQUEST_ADDRESS,
    abi: payRequestAbi,
    functionName: 'getRequest',
    args: [id],
    chainId: APP_CHAIN_ID,
    query: { enabled: isPayRequestDeployed },
  })

  const req = data as RequestTuple | undefined

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, PAY_REQUEST_ADDRESS] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled: Boolean(address && req) },
  })

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
  } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: writeSuccess } =
    useWaitForTransactionReceipt({ hash })

  const {
    data: callsData,
    sendCalls,
    isPending: isCallsPending,
    error: callsError,
  } = useSendCalls()
  const { isLoading: isCallsConfirming, isSuccess: callsSuccess } =
    useWaitForCallsStatus({ id: callsData?.id })

  useEffect(() => {
    if (writeSuccess || callsSuccess) refetch()
  }, [writeSuccess, callsSuccess, refetch])

  if (!isPayRequestDeployed) {
    return <p className="text-sm text-amber-700">PayRequest is not deployed.</p>
  }
  if (isLoading) return <p className="text-sm text-zinc-500">Loading request…</p>
  if (isError || !req || req.payee === '0x0000000000000000000000000000000000000000') {
    return <p className="text-sm text-red-600">Request not found.</p>
  }
  if (!isNativeUsdc(req.token)) {
    return (
      <p className="text-sm text-red-600">
        This request is not for native USDC. Float will not pay it.
      </p>
    )
  }

  const needsApproval = (allowance ?? BigInt(0)) < req.amount
  const authorized =
    req.payer === '0x0000000000000000000000000000000000000000' ||
    (address && req.payer.toLowerCase() === address.toLowerCase())

  function paySequential() {
    if (needsApproval) {
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PAY_REQUEST_ADDRESS, req!.amount],
        chainId: APP_CHAIN_ID,
      })
      return
    }
    writeContract({
      address: PAY_REQUEST_ADDRESS,
      abi: payRequestAbi,
      functionName: 'pay',
      args: [id],
      chainId: APP_CHAIN_ID,
    })
  }

  function payBatched() {
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [PAY_REQUEST_ADDRESS, req!.amount],
    })
    const payData = encodeFunctionData({
      abi: payRequestAbi,
      functionName: 'pay',
      args: [id],
    })
    sendCalls({
      chainId: APP_CHAIN_ID,
      calls: [
        { to: USDC_ADDRESS, data: approveData },
        { to: PAY_REQUEST_ADDRESS, data: payData },
      ],
    })
  }

  async function onConfirm() {
    if (!client || !address || !req) return
    setSimulating(true)
    setSimError(null)
    try {
      if (needsApproval) {
        await client.simulateContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [PAY_REQUEST_ADDRESS, req.amount],
          account: address,
          chain: appChain,
        })
      } else {
        await client.simulateContract({
          address: PAY_REQUEST_ADDRESS,
          abi: payRequestAbi,
          functionName: 'pay',
          args: [id],
          account: address,
          chain: appChain,
        })
      }
    } catch (err) {
      setSimError(simulateErrorMessage(err))
      setSimulating(false)
      return
    }
    setSimulating(false)
    setConfirmOpen(false)
    if (supportsBatching) payBatched()
    else paySequential()
  }

  return (
    <div className="float-card max-w-md p-5">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Request #{id.toString()}</p>
      <p className="mt-2 text-3xl font-semibold">{formatUsdc(req.amount)} USDC</p>
      {req.memo && <p className="mt-1 text-sm text-zinc-600">{req.memo}</p>}
      <p className="mt-3 text-sm text-zinc-500">
        Payee {shortAddress(req.payee)}
        {req.payer !== '0x0000000000000000000000000000000000000000' && (
          <> · Payer {shortAddress(req.payer)}</>
        )}
      </p>
      {req.paid ? (
        <p className="mt-4 text-sm text-green-700">
          Paid by {shortAddress(req.paidBy)}
        </p>
      ) : !isConnected ? (
        <p className="mt-4 text-sm text-zinc-500">Connect to pay this request.</p>
      ) : chainId !== APP_CHAIN_ID ? (
        <button
          type="button"
          className="float-btn mt-4"
          onClick={() => switchChain({ chainId: APP_CHAIN_ID })}
        >
          {isSwitching ? 'Switching…' : `Switch to ${appChain.name}`}
        </button>
      ) : !authorized ? (
        <p className="mt-4 text-sm text-amber-700">This request is locked to another payer.</p>
      ) : (
        <button
          type="button"
          className="float-btn mt-4"
          disabled={isWritePending || isConfirming || isCallsPending || isCallsConfirming}
          onClick={() => {
            setSimError(null)
            setConfirmOpen(true)
          }}
        >
          {isWritePending || isCallsPending
            ? 'Confirm in wallet…'
            : isConfirming || isCallsConfirming
              ? 'Confirming…'
              : supportsBatching
                ? 'Approve + pay (batch)'
                : needsApproval
                  ? 'Approve USDC'
                  : 'Pay request'}
        </button>
      )}
      {(writeError || callsError) && (
        <p className="mt-2 text-sm text-red-600">
          {(writeError ?? callsError)?.message}
        </p>
      )}
      <TxConfirm
        open={confirmOpen}
        title="Pay USDC request"
        lines={[
          { label: 'Contract', value: 'PayRequest' },
          { label: 'Spender', value: checksumAddress(PAY_REQUEST_ADDRESS) },
          { label: 'Payee', value: checksumAddress(req.payee) },
          { label: 'Amount', value: `${formatUsdc(req.amount)} USDC` },
          { label: 'Allowance', value: 'Exact amount only' },
        ]}
        pending={simulating}
        error={simError}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
      />
    </div>
  )
}
