import { isAddress } from 'viem'
import type { YieldRow } from '@/lib/yield'
import { safeHttpsHref } from '@/lib/tx-guard'

const MORPHO_QUERY = `{
  vaults(
    first: 8
    orderBy: TotalAssetsUsd
    orderDirection: Desc
    where: { chainId_in: [8453] }
  ) {
    items {
      name
      address
      asset { symbol address }
      state { netApy totalAssetsUsd }
    }
  }
}`

const STATIC_ROWS: YieldRow[] = [
  {
    protocol: 'YO',
    name: 'yoUSD',
    chain: 'Base mainnet',
    apy: null,
    tvlUsd: null,
    href: 'https://app.yo.xyz/',
    note: 'ERC-4626 USDC vault. You choose YO — Float does not deposit for you.',
  },
  {
    protocol: 'Moonwell',
    name: 'USDC market',
    chain: 'Base mainnet',
    apy: null,
    tvlUsd: null,
    href: 'https://moonwell.fi/markets/base/usdc',
    note: 'Lending market. You choose Moonwell — Float does not deposit for you.',
  },
  {
    protocol: 'Morpho',
    name: 'USDC vaults',
    chain: 'Base mainnet',
    apy: null,
    tvlUsd: null,
    href: 'https://app.morpho.org/base/earn',
    note: 'Vault aggregator. You choose Morpho — Float does not deposit for you.',
  },
]

type MorphoVault = {
  name: string
  address: string
  asset?: { symbol?: string; address?: string }
  state?: { netApy?: number | null; totalAssetsUsd?: number | null }
}

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 30
const hits = new Map<string, { n: number; t: number }>()

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const cur = hits.get(ip)
  if (!cur || now - cur.t > RATE_WINDOW_MS) {
    hits.set(ip, { n: 1, t: now })
    return false
  }
  cur.n += 1
  return cur.n > RATE_MAX
}

const jsonHeaders = {
  'content-type': 'application/json',
  'cache-control': 'public, s-maxage=300, stale-while-revalidate=60',
}

export async function GET(req: Request) {
  const rows: YieldRow[] = [...STATIC_ROWS]

  if (rateLimited(clientIp(req))) {
    return new Response(JSON.stringify({ rows }), {
      status: 200,
      headers: jsonHeaders,
    })
  }

  try {
    const res = await fetch('https://api.morpho.org/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: MORPHO_QUERY }),
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { vaults?: { items?: MorphoVault[] } }
      }
      const usdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
      const vaults = (json.data?.vaults?.items ?? []).filter(
        (v) =>
          isAddress(v.address) &&
          v.asset?.address?.toLowerCase() === usdc,
      )
      for (const vault of vaults.slice(0, 5)) {
        const href = safeHttpsHref(
          `https://app.morpho.org/base/vault/${vault.address}`,
        )
        if (!href) continue
        const apy = vault.state?.netApy
        const tvl = vault.state?.totalAssetsUsd
        rows.unshift({
          protocol: 'Morpho',
          name: vault.name,
          chain: 'Base mainnet',
          apy: typeof apy === 'number' ? `${(apy * 100).toFixed(2)}%` : null,
          tvlUsd:
            typeof tvl === 'number'
              ? `$${Math.round(tvl).toLocaleString()}`
              : null,
          href,
          note: 'Live Morpho vault. You pick this protocol — Float only compares.',
        })
      }
    }
  } catch {
    // Static rows still returned.
  }

  return new Response(JSON.stringify({ rows }), {
    status: 200,
    headers: jsonHeaders,
  })
}
