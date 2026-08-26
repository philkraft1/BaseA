'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useOrders, type StandingOrderView } from '@/hooks/useOrders'
import { PermissionsSummary } from '@/components/PermissionsSummary'
import { formatUsdc, shortAddress } from '@/lib/format'
import { formatDueDate, periodToDays } from '@/lib/period'
import { isStandingOrderDeployed } from '@/config/standing-order'

function OrderCard({
  order,
  role,
}: {
  order: StandingOrderView
  role: 'in' | 'out'
}) {
  const counterparty = role === 'in' ? order.payer : order.payee
  return (
    <Link
      href={`/due/${order.id.toString()}`}
      className="float-card block p-4 transition hover:border-cyan-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {role === 'in' ? 'Incoming' : 'Outgoing'} · {formatUsdc(order.amount)} USDC
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {role === 'in' ? 'From' : 'To'} {shortAddress(counterparty)}
          </p>
          {order.memo ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{order.memo}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            order.cancelled
              ? 'bg-zinc-100 text-zinc-500'
              : order.due
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                : 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200'
          }`}
        >
          {order.cancelled ? 'Cancelled' : order.due ? 'Due' : 'Scheduled'}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Every {periodToDays(order.period)} days · next {formatDueDate(order.nextDueAt)}
      </p>
    </Link>
  )
}

export function Inbox() {
  const { isConnected } = useAccount()
  const { data, isLoading, error } = useOrders()

  if (!isConnected) {
    return (
      <p className="text-sm text-zinc-500">
        Connect a Base Account to see standing orders and spenders.
      </p>
    )
  }

  if (!isStandingOrderDeployed) {
    return (
      <div className="flex flex-col gap-6">
        <PermissionsSummary />
        <p className="text-sm text-amber-700">
          Deploy StandingOrder and set NEXT_PUBLIC_STANDING_ORDER_ADDRESS to load
          standing orders. Permissions still work.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading inbox…</p>
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Failed to load orders'}
      </p>
    )
  }

  const incoming = data?.incoming.filter((row) => !row.cancelled) ?? []
  const outgoing = data?.outgoing.filter((row) => !row.cancelled) ?? []

  return (
    <div className="flex flex-col gap-6">
      <PermissionsSummary />
      <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          You get paid
        </h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-zinc-500">No incoming standing orders yet.</p>
        ) : (
          incoming.map((order) => (
            <OrderCard key={order.id.toString()} order={order} role="in" />
          ))
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          You pay
        </h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No outgoing orders.{' '}
            <Link href="/new" className="underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          outgoing.map((order) => (
            <OrderCard key={order.id.toString()} order={order} role="out" />
          ))
        )}
      </section>
    </div>
    </div>
  )
}
