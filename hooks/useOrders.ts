'use client'

import { useQuery } from '@tanstack/react-query'
import { parseAbiItem, type Address } from 'viem'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { APP_CHAIN_ID } from '@/config/network'
import {
  STANDING_ORDER_ADDRESS,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'
import { getLogsInRange } from '@/lib/logs'

const createdEvent = parseAbiItem(
  'event OrderCreated(uint256 indexed id, address indexed payer, address indexed payee, address token, uint256 amount, uint64 period, bytes32 subscriptionId, string memo)',
)

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
    queryFn: async (): Promise<{
      incoming: StandingOrderView[]
      outgoing: StandingOrderView[]
    }> => {
      if (!address || !client) return { incoming: [], outgoing: [] }

      const latest = await client.getBlockNumber()
      const lookback = BigInt(80_000)
      const fromBlock = latest > lookback ? latest - lookback : BigInt(0)

      const [asPayer, asPayee] = await Promise.all([
        getLogsInRange(
          (start, end) =>
            client.getLogs({
              address: STANDING_ORDER_ADDRESS,
              event: createdEvent,
              fromBlock: start,
              toBlock: end,
              args: { payer: address },
            }),
          fromBlock,
          latest,
        ),
        getLogsInRange(
          (start, end) =>
            client.getLogs({
              address: STANDING_ORDER_ADDRESS,
              event: createdEvent,
              fromBlock: start,
              toBlock: end,
              args: { payee: address },
            }),
          fromBlock,
          latest,
        ),
      ])

      const ids = [
        ...new Set(
          [...asPayer, ...asPayee]
            .map((log) => log.args.id)
            .filter((id): id is bigint => id !== undefined),
        ),
      ]

      const views: StandingOrderView[] = []
      for (const id of ids) {
        const [order, due, nextDue] = await Promise.all([
          client.readContract({
            address: STANDING_ORDER_ADDRESS,
            abi: standingOrderAbi,
            functionName: 'getOrder',
            args: [id],
          }),
          client.readContract({
            address: STANDING_ORDER_ADDRESS,
            abi: standingOrderAbi,
            functionName: 'isDue',
            args: [id],
          }),
          client.readContract({
            address: STANDING_ORDER_ADDRESS,
            abi: standingOrderAbi,
            functionName: 'nextDueAt',
            args: [id],
          }),
        ])
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
          due,
          nextDueAt: nextDue,
        })
      }

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
