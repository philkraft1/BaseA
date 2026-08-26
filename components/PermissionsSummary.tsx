'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useSpendPermissions } from '@/hooks/useSpendPermissions'
import { useUsdcApprovals } from '@/hooks/useUsdcApprovals'

export function PermissionsSummary() {
  const { isConnected } = useAccount()
  const perms = useSpendPermissions()
  const approvals = useUsdcApprovals({ scanLogs: false })

  if (!isConnected) return null

  const permissionCount = perms.data?.length ?? 0
  const allowanceCount = approvals.rows.length
  const total = permissionCount + allowanceCount
  const loading = perms.isLoading || approvals.isLoading

  return (
    <Link href="/permissions" className="float-card block p-4 transition hover:border-cyan-600">
      <p className="text-sm font-semibold">Who can spend</p>
      <p className="mt-1 text-sm text-zinc-500">
        {loading
          ? 'Checking spend permissions and USDC allowances…'
          : total === 0
            ? 'No active spenders found. Open the inbox to revoke later.'
            : `${total} active spender${total === 1 ? '' : 's'} — tap to revoke.`}
      </p>
    </Link>
  )
}
