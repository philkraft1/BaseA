'use client'

import { useQuery } from '@tanstack/react-query'
import { parseAbiItem, type Address } from 'viem'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { APP_CHAIN_ID, ZERO_ADDRESS } from '@/config/network'
import {
  PAY_REQUEST_ADDRESS,
  isPayRequestDeployed,
  payRequestAbi,
} from '@/config/pay-request'
import { getLogsInRange } from '@/lib/logs'

const createdEvent = parseAbiItem(
  'event RequestCreated(uint256 indexed id, address indexed payee, address indexed payer, address token, uint256 amount, string memo)',
)

export type PayRequestView = {
  id: bigint
  payee: Address
  payer: Address
  token: Address
  amount: bigint
  memo: string
  paid: boolean
  paidBy: Address
}

export function usePayRequests() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })

  return useQuery({
    queryKey: ['pay-requests', address, PAY_REQUEST_ADDRESS],
    enabled: Boolean(address && client && isPayRequestDeployed),
    queryFn: async (): Promise<{
      incoming: PayRequestView[]
      outgoing: PayRequestView[]
    }> => {
      if (!address || !client) return { incoming: [], outgoing: [] }

      const latest = await client.getBlockNumber()
      const lookback = BigInt(80_000)
      const fromBlock = latest > lookback ? latest - lookback : BigInt(0)

      const [asPayee, asPayer] = await Promise.all([
        getLogsInRange(
          (start, end) =>
            client.getLogs({
              address: PAY_REQUEST_ADDRESS,
              event: createdEvent,
              fromBlock: start,
              toBlock: end,
              args: { payee: address },
            }),
          fromBlock,
          latest,
        ),
        getLogsInRange(
          (start, end) =>
            client.getLogs({
              address: PAY_REQUEST_ADDRESS,
              event: createdEvent,
              fromBlock: start,
              toBlock: end,
              args: { payer: address },
            }),
          fromBlock,
          latest,
        ),
      ])

      const ids = [
        ...new Set(
          [...asPayee, ...asPayer]
            .map((log) => log.args.id)
            .filter((id): id is bigint => id !== undefined),
        ),
      ]

      const views: PayRequestView[] = []
      for (const id of ids) {
        const request = await client.readContract({
          address: PAY_REQUEST_ADDRESS,
          abi: payRequestAbi,
          functionName: 'getRequest',
          args: [id],
        })
        if (request.payee === ZERO_ADDRESS) continue
        views.push({
          id,
          payee: request.payee,
          payer: request.payer,
          token: request.token,
          amount: request.amount,
          memo: request.memo,
          paid: request.paid,
          paidBy: request.paidBy,
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

export function usePayRequest(id: bigint | undefined) {
  const enabled = Boolean(isPayRequestDeployed && id !== undefined)

  return useReadContract({
    address: PAY_REQUEST_ADDRESS,
    abi: payRequestAbi,
    functionName: 'getRequest',
    args: id !== undefined ? [id] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled },
  })
}
