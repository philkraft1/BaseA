'use client'

import Link from 'next/link'
import { zeroAddress } from 'viem'
import { useAccount } from 'wagmi'
import { useOrders, type StandingOrderView } from '@/hooks/useOrders'
import { usePayRequests, type PayRequestView } from '@/hooks/usePayRequests'
import { PermissionsSummary } from '@/components/PermissionsSummary'
import { formatUsdc, shortAddress } from '@/lib/format'
import { formatDueDate, periodToDays } from '@/lib/period'
import { isStandingOrderDeployed } from '@/config/standing-order'
import { isPayRequestDeployed } from '@/config/pay-request'
import { isRpcRateLimited } from '@/lib/logs'

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

function RequestCard({
  request,
  role,
}: {
  request: PayRequestView
  role: 'in' | 'out'
}) {
  const counterparty = role === 'in' ? request.payer : request.payee
  const openPayer = request.payer === zeroAddress
  return (
    <Link
      href={`/pay/${request.id.toString()}`}
      className="float-card block p-4 transition hover:border-cyan-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            Request · {formatUsdc(request.amount)} USDC
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {role === 'in'
              ? openPayer
                ? 'Open — anyone can pay'
                : `From ${shortAddress(counterparty)}`
              : `To ${shortAddress(counterparty)}`}
          </p>
          {request.memo ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{request.memo}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            request.paid
              ? 'bg-zinc-100 text-zinc-500'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
          }`}
        >
          {request.paid ? 'Paid' : openPayer ? 'Open' : 'Unpaid'}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">One-time USDC request</p>
    </Link>
  )
}

export function Inbox() {
  const { isConnected } = useAccount()
  const orders = useOrders()
  const requests = usePayRequests()

  if (!isConnected) {
    return (
      <p className="text-sm text-zinc-500">
        Connect a Base Account to see standing orders, pay requests, and spenders.
      </p>
    )
  }

  const loading =
    (isStandingOrderDeployed && orders.isLoading) ||
    (isPayRequestDeployed && requests.isLoading)

  if (!isStandingOrderDeployed && !isPayRequestDeployed) {
    return (
      <div className="flex flex-col gap-6">
        <PermissionsSummary />
        <p className="text-sm text-amber-700">
          Set NEXT_PUBLIC_STANDING_ORDER_ADDRESS and NEXT_PUBLIC_PAY_REQUEST_ADDRESS
          to load inbox items. Permissions still work.
        </p>
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading inbox…</p>
  }

  const orderError = isStandingOrderDeployed ? orders.error : null
  const requestError = isPayRequestDeployed ? requests.error : null
  const rpcBusy =
    (orderError && isRpcRateLimited(orderError)) ||
    (requestError && isRpcRateLimited(requestError))

  const incomingOrders = orders.data?.incoming.filter((row) => !row.cancelled) ?? []
  const outgoingOrders = orders.data?.outgoing.filter((row) => !row.cancelled) ?? []
  const incomingRequests = requests.data?.incoming ?? []
  const outgoingRequests = requests.data?.outgoing ?? []

  const incomingEmpty = incomingOrders.length === 0 && incomingRequests.length === 0
  const outgoingEmpty = outgoingOrders.length === 0 && outgoingRequests.length === 0
  const hasAny =
    incomingOrders.length +
      outgoingOrders.length +
      incomingRequests.length +
      outgoingRequests.length >
    0

  if (orderError && requestError && !hasAny) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-600">
          {rpcBusy
            ? 'Base’s public RPC is rate-limiting right now, so Inbox could not load. Your onchain invoice is still there — retry in a few seconds, or open the share link from New.'
            : orderError instanceof Error
              ? orderError.message
              : 'Failed to load inbox'}
        </p>
        <p className="text-sm text-zinc-500">
          Direct link to the invoice you created:{' '}
          <Link href="/pay/0" className="underline">
            /pay/0
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PermissionsSummary />
      {orderError && (
        <p className="text-sm text-red-600">
          {orderError instanceof Error ? orderError.message : 'Failed to load standing orders'}
        </p>
      )}
      {requestError && (
        <p className="text-sm text-red-600">
          {requestError instanceof Error ? requestError.message : 'Failed to load pay requests'}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          You get paid
        </h2>
        {incomingEmpty ? (
          <p className="text-sm text-zinc-500">No incoming orders or requests yet.</p>
        ) : (
          <>
            {incomingRequests
              .filter((row) => !row.paid)
              .map((request) => (
                <RequestCard key={`req-${request.id}`} request={request} role="in" />
              ))}
            {incomingOrders.map((order) => (
              <OrderCard key={`ord-${order.id}`} order={order} role="in" />
            ))}
            {incomingRequests
              .filter((row) => row.paid)
              .map((request) => (
                <RequestCard key={`req-${request.id}`} request={request} role="in" />
              ))}
          </>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          You pay
        </h2>
        {outgoingEmpty ? (
          <p className="text-sm text-zinc-500">
            Nothing outgoing.{' '}
            <Link href="/new" className="underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <>
            {outgoingRequests
              .filter((row) => !row.paid)
              .map((request) => (
                <RequestCard key={`req-${request.id}`} request={request} role="out" />
              ))}
            {outgoingOrders.map((order) => (
              <OrderCard key={`ord-${order.id}`} order={order} role="out" />
            ))}
            {outgoingRequests
              .filter((row) => row.paid)
              .map((request) => (
                <RequestCard key={`req-${request.id}`} request={request} role="out" />
              ))}
          </>
        )}
      </section>
    </div>
    </div>
  )
}
