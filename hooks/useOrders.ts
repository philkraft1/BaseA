'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address } from 'viem'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { APP_CHAIN_ID } from '@/config/network'
import {
  STANDING_ORDER_ADDRESS,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'
import { isRpcRateLimited } from '@/lib/logs'

export type StandingOrderView = {
  id: bigint
  payer: Address
  payee: Address
  token: Address
  amount: bigint
  period: bigint
  lastPaidAt: bigint
  totalPaid: bigint
  paymentCount: bigint
  subscriptionId: `0x${string}`
  memo: string
  cancelled: boolean
  due: boolean
  nextDueAt: bigint
}

export function useOrders() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })

  return useQuery({
    queryKey: ['standing-orders', address, STANDING_ORDER_ADDRESS],
    enabled: Boolean(address && client && isStandingOrderDeployed),
    retry: (count, error) => count < 3 && isRpcRateLimited(error),
    retryDelay: (count) => 500 * 2 ** count,
    queryFn: async (): Promise<{
      incoming: StandingOrderView[]
      outgoing: StandingOrderView[]
    }> => {
      if (!address || !client) return { incoming: [], outgoing: [] }

      const nextId = await client.readContract({
        address: STANDING_ORDER_ADDRESS,
        abi: standingOrderAbi,
        functionName: 'nextId',
      })
      if (nextId === BigInt(0)) return { incoming: [], outgoing: [] }

      const count = nextId > BigInt(500) ? 500 : Number(nextId)
      const ids = Array.from({ length: count }, (_, i) => BigInt(i))
      const orderRows = await client.multicall({
        contracts: ids.map((id) => ({
          address: STANDING_ORDER_ADDRESS,
          abi: standingOrderAbi,
          functionName: 'getOrder' as const,
          args: [id] as const,
        })),
        allowFailure: true,
      })
      const dueRows = await client.multicall({
        contracts: ids.map((id) => ({
          address: STANDING_ORDER_ADDRESS,
          abi: standingOrderAbi,
          functionName: 'isDue' as const,
          args: [id] as const,
        })),
        allowFailure: true,
      })
      const nextRows = await client.multicall({
        contracts: ids.map((id) => ({
          address: STANDING_ORDER_ADDRESS,
          abi: standingOrderAbi,
          functionName: 'nextDueAt' as const,
          args: [id] as const,
        })),
        allowFailure: true,
      })

      const views: StandingOrderView[] = []
      ids.forEach((id, i) => {
        const orderRow = orderRows[i]
        if (orderRow.status !== 'success') return
        const order = orderRow.result
        views.push({
          id,
          payer: order.payer,
          payee: order.payee,
          token: order.token,
          amount: order.amount,
          period: order.period,
          lastPaidAt: order.lastPaidAt,
          totalPaid: order.totalPaid,
          paymentCount: order.paymentCount,
          subscriptionId: order.subscriptionId,
          memo: order.memo,
          cancelled: order.cancelled,
          due: dueRows[i]?.status === 'success' ? dueRows[i].result : false,
          nextDueAt: nextRows[i]?.status === 'success' ? nextRows[i].result : BigInt(0),
        })
      })

      return {
        incoming: views.filter(
          (row) => row.payee.toLowerCase() === address.toLowerCase(),
        ),
        outgoing: views.filter(
          (row) => row.payer.toLowerCase() === address.toLowerCase(),
        ),
      }
    },
  })
}

export function useOrder(id: bigint | undefined) {
  const enabled = Boolean(isStandingOrderDeployed && id !== undefined)

  const order = useReadContract({
    address: STANDING_ORDER_ADDRESS,
    abi: standingOrderAbi,
    functionName: 'getOrder',
    args: id !== undefined ? [id] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled },
  })
  const due = useReadContract({
    address: STANDING_ORDER_ADDRESS,
    abi: standingOrderAbi,
    functionName: 'isDue',
    args: id !== undefined ? [id] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled },
  })
  const nextDueAt = useReadContract({
    address: STANDING_ORDER_ADDRESS,
    abi: standingOrderAbi,
    functionName: 'nextDueAt',
    args: id !== undefined ? [id] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled },
  })

  return { order, due, nextDueAt }
}
