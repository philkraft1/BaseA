'use client'

import { useQuery } from '@tanstack/react-query'
import type { YieldRow } from '@/lib/yield'
import { safeHttpsHref } from '@/lib/tx-guard'

export function IdleYieldBoard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['yield-board'],
    queryFn: async () => {
      const res = await fetch('/api/yield')
      if (!res.ok) throw new Error('yield fetch failed')
      return (await res.json()) as { rows: YieldRow[] }
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Idle USDC earns nothing in your wallet. These are Base mainnet venues
        other people use. Float only compares — you pick the protocol and
        deposit on their site.
      </p>
      {isLoading && <p className="text-sm text-zinc-500">Loading venues…</p>}
      {isError && (
        <p className="text-sm text-red-600">Could not refresh Morpho APYs.</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-2">Protocol</th>
              <th className="px-4 py-2">Venue</th>
              <th className="px-4 py-2">APY</th>
              <th className="px-4 py-2">TVL</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((row) => (
              <tr
                key={`${row.protocol}-${row.name}-${row.href}`}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="px-4 py-3 font-medium">{row.protocol}</td>
                <td className="px-4 py-3">
                  <p>{row.name}</p>
                  <p className="text-xs text-zinc-500">{row.note}</p>
                </td>
                <td className="px-4 py-3 font-mono">{row.apy ?? '—'}</td>
                <td className="px-4 py-3 font-mono">{row.tvlUsd ?? '—'}</td>
                <td className="px-4 py-3">
                  {safeHttpsHref(row.href) ? (
                    <a
                      href={safeHttpsHref(row.href)!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 underline dark:text-sky-400"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
