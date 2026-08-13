'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { EXPLORER_TX_URL } from '@/config/network'
import { isPayRequestDeployed } from '@/config/pay-request'
import { useLedger } from '@/hooks/useLedger'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import { formatUsdc, shortAddress } from '@/lib/format'

const kindLabel = {
  in: 'Received',
  out: 'Sent',
  request: 'Request created',
  paid: 'Request paid',
}

export function Ledger() {
  const { isConnected } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useUsdcBalance()
  const { data, isLoading, isError } = useLedger()

  if (!isConnected) {
    return (
      <p className="text-sm text-zinc-500">
        Connect a wallet to see your USDC float.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="USDC balance"
          value={
            balanceLoading
              ? '…'
              : balance !== undefined
                ? formatUsdc(balance)
                : '—'
          }
        />
        <Stat
          label="In (recent blocks)"
          value={data ? formatUsdc(data.inflow) : '…'}
        />
        <Stat
          label="Out (recent blocks)"
          value={data ? formatUsdc(data.outflow) : '…'}
        />
      </section>

      {!isPayRequestDeployed && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          PayRequest is not deployed yet. Set{' '}
          <code className="font-mono">NEXT_PUBLIC_PAY_REQUEST_ADDRESS</code> after{' '}
          <code className="font-mono">npm run contracts:deploy</code>. You can
          still send USDC and review idle yield.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
        {isLoading && <p className="text-sm text-zinc-500">Loading ledger…</p>}
        {isError && (
          <p className="text-sm text-red-600">
            Could not load transfers. The RPC rejected the log query.
          </p>
        )}
        {data && data.rows.length === 0 && !isLoading && (
          <p className="text-sm text-zinc-500">
            No recent USDC movement. Create a request or send a payment.
          </p>
        )}
        <ul className="float-card divide-y divide-zinc-200 dark:divide-zinc-800">
          {data?.rows.map((row) => (
            <li
              key={`${row.txHash}-${row.kind}-${row.id ?? ''}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{kindLabel[row.kind]}</p>
                <p className="text-zinc-500">
                  {shortAddress(row.counterparty)}
                  {row.memo ? ` · ${row.memo}` : ''}
                  {row.id ? (
                    <>
                      {' '}
                      ·{' '}
                      <Link className="underline" href={`/pay/${row.id}`}>
                        #{row.id}
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-mono ${
                    row.kind === 'out'
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {row.kind === 'out' ? '−' : '+'}
                  {formatUsdc(row.amount)} USDC
                </p>
                <a
                  className="text-xs text-sky-700 underline dark:text-sky-400"
                  href={EXPLORER_TX_URL(row.txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Basescan
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="float-card p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
