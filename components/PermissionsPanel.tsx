'use client'

import { useEffect, useState } from 'react'
import { encodeFunctionData } from 'viem'
import { requestRevoke } from '@base-org/account/spend-permission/browser'
import {
  useAccount,
  useChainId,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS, appChain } from '@/config/network'
import { erc20Abi } from '@/config/standing-order'
import { useAttributedWrite } from '@/hooks/useAttributedWrite'
import { useSpendPermissions } from '@/hooks/useSpendPermissions'
import { useUsdcApprovals } from '@/hooks/useUsdcApprovals'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { attributionCapabilities } from '@/lib/attribution'
import { getDueProvider } from '@/lib/base-account'
import { formatUsdc, shortAddress } from '@/lib/format'

export function PermissionsPanel() {
  const { isConnected, connector } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { supportsBatching } = useWalletCapabilities()
  const [owner, setOwner] = useState<`0x${string}` | null>(null)

  useEffect(() => {
    fetch('/api/subscription/owner')
      .then((res) => res.json())
      .then((body: { address?: `0x${string}` | null }) => {
        if (body.address) setOwner(body.address)
      })
      .catch(() => undefined)
  }, [])

  const allPerms = useSpendPermissions()
  const duePerms = useSpendPermissions(owner ?? undefined)
  const approvals = useUsdcApprovals()

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
  const [revokeError, setRevokeError] = useState<string | null>(null)

  useEffect(() => {
    if (isSuccess || callsSuccess) {
      approvals.refetchAllowances()
      allPerms.refetch()
      duePerms.refetch()
    }
  }, [isSuccess, callsSuccess, approvals, allPerms, duePerms])

  if (!isConnected) {
    return <p className="text-sm text-zinc-500">Connect to see who can spend your USDC.</p>
  }
  if (chainId !== APP_CHAIN_ID) {
    return (
      <button type="button" className="float-btn" onClick={() => switchChain({ chainId: APP_CHAIN_ID })}>
        {isSwitching ? 'Switching…' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  const permissions = (allPerms.data?.length ? allPerms.data : duePerms.data) ?? []
  const allowanceRows = approvals.rows

  async function revokePermission(index: number) {
    const permission = permissions[index]
    if (!permission) return
    setRevokeError(null)
    try {
      await requestRevoke({
        provider: await getDueProvider(connector),
        permission,
      })
      allPerms.refetch()
      duePerms.refetch()
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : 'Revoke failed')
    }
  }

  function revokeAllowance(spender: `0x${string}`) {
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, BigInt(0)],
      chainId: APP_CHAIN_ID,
    })
  }

  function revokeAllAllowances() {
    if (!supportsBatching || allowanceRows.length === 0) return
    sendCalls({
      calls: allowanceRows.map((row) => ({
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [row.spender, BigInt(0)],
        }),
      })),
      chainId: APP_CHAIN_ID,
      capabilities: attributionCapabilities(),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold">Spend permissions</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Apps that can pull USDC from your Base Account on a schedule.
        </p>
        {allPerms.isLoading || duePerms.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading permissions…</p>
        ) : permissions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No spend permissions found. If you just connected, the host may only
            return permissions for a known spender.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {permissions.map((permission, index) => (
              <li
                key={permission.permissionHash ?? `${permission.permission.spender}-${index}`}
                className="float-card flex items-center justify-between gap-3 p-3"
              >
                <div>
                  <p className="font-mono text-sm">
                    {shortAddress(permission.permission.spender as `0x${string}`)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Allowance {permission.permission.allowance} · period{' '}
                    {Math.round(Number(permission.permission.period) / 86400)}d
                  </p>
                </div>
                <button
                  type="button"
                  className="float-btn-ghost"
                  onClick={() => revokePermission(index)}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">USDC allowances</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Leftover ERC-20 approvals discovered from onchain logs.
            </p>
          </div>
          {allowanceRows.length > 1 && supportsBatching && (
            <button
              type="button"
              className="float-btn-ghost"
              disabled={isCallsPending || isCallsConfirming}
              onClick={revokeAllAllowances}
            >
              Revoke all
            </button>
          )}
        </div>
        {approvals.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Scanning approvals…</p>
        ) : allowanceRows.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No leftover USDC allowances in the recent window.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {allowanceRows.map((row) => (
              <li
                key={row.spender}
                className="float-card flex items-center justify-between gap-3 p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {row.name ?? shortAddress(row.spender)}
                  </p>
                  <p className="font-mono text-xs text-zinc-500">{row.spender}</p>
                  <p className="text-xs text-zinc-500">
                    {row.allowance === BigInt(
                      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                    )
                      ? 'Unlimited'
                      : `${formatUsdc(row.allowance)} USDC`}
                  </p>
                </div>
                <button
                  type="button"
                  className="float-btn-ghost"
                  disabled={isPending || isConfirming}
                  onClick={() => revokeAllowance(row.spender)}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(error || callsError || revokeError) && (
        <p className="text-sm text-red-600">
          {revokeError ?? (error ?? callsError)?.message}
        </p>
      )}
    </div>
  )
}
