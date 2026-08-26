'use client'

import { useQuery } from '@tanstack/react-query'
import { parseAbiItem, type Address } from 'viem'
import { useAccount, usePublicClient, useReadContracts } from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS, ZERO_ADDRESS } from '@/config/network'
import { PAY_REQUEST_ADDRESS } from '@/config/pay-request'
import { STANDING_ORDER_ADDRESS, erc20Abi } from '@/config/standing-order'
import { getLogsInRange, isRpcRateLimited } from '@/lib/logs'

const approvalEvent = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
)

const ALWAYS_CHECK: { name: string; address: Address }[] = [
  { name: 'Permit2', address: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
  {
    name: 'Uniswap Universal Router',
    address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  },
  { name: 'Due StandingOrder', address: STANDING_ORDER_ADDRESS },
  { name: 'Due PayRequest', address: PAY_REQUEST_ADDRESS },
]

export type AllowanceRow = {
  spender: Address
  name?: string
  allowance: bigint
}

export function useUsdcApprovals(options?: { scanLogs?: boolean }) {
  const scanLogs = options?.scanLogs ?? true
  const { address } = useAccount()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })

  const spendersQuery = useQuery({
    queryKey: ['usdc-approval-spenders', address, USDC_ADDRESS, scanLogs],
    enabled: Boolean(address && client),
    retry: (count, error) => count < 3 && isRpcRateLimited(error),
    retryDelay: (count) => 500 * 2 ** count,
    queryFn: async (): Promise<Address[]> => {
      if (!address || !client) return []
      const known = ALWAYS_CHECK.map((row) => row.address).filter(
        (spender) => spender !== ZERO_ADDRESS,
      )
      if (!scanLogs) {
        return [...new Set(known.map((s) => s.toLowerCase() as Address))]
      }
      const latest = await client.getBlockNumber()
      const lookback = BigInt(20_000)
      const fromBlock = latest > lookback ? latest - lookback : BigInt(0)
      const logs = await getLogsInRange(
        (start, end) =>
          client.getLogs({
            address: USDC_ADDRESS,
            event: approvalEvent,
            fromBlock: start,
            toBlock: end,
            args: { owner: address },
          }),
        fromBlock,
        latest,
      )
      const fromLogs = logs
        .map((log) => log.args.spender)
        .filter((spender): spender is Address => Boolean(spender))
      return [...new Set([...fromLogs, ...known].map((s) => s.toLowerCase() as Address))]
    },
  })

  const spenders = spendersQuery.data ?? []
  const allowances = useReadContracts({
    contracts: spenders.map((spender) => ({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance' as const,
      args: address ? [address, spender] : undefined,
      chainId: APP_CHAIN_ID,
    })),
    query: { enabled: Boolean(address && spenders.length) },
  })

  const rows: AllowanceRow[] = spenders.map((spender, i) => {
    const known = ALWAYS_CHECK.find(
      (row) => row.address.toLowerCase() === spender.toLowerCase(),
    )
    return {
      spender,
      name: known?.name,
      allowance: (allowances.data?.[i]?.result as bigint | undefined) ?? BigInt(0),
    }
  })

  return {
    ...spendersQuery,
    rows: rows.filter((row) => row.allowance > BigInt(0)),
    refetchAllowances: allowances.refetch,
  }
}
