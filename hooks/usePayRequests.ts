'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address } from 'viem'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { APP_CHAIN_ID, ZERO_ADDRESS } from '@/config/network'
import {
  PAY_REQUEST_ADDRESS,
  isPayRequestDeployed,
  payRequestAbi,
} from '@/config/pay-request'
import { isRpcRateLimited } from '@/lib/logs'

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
    retry: (count, error) => count < 3 && isRpcRateLimited(error),
    retryDelay: (count) => 500 * 2 ** count,
    queryFn: async (): Promise<{
      incoming: PayRequestView[]
      outgoing: PayRequestView[]
    }> => {
      if (!address || !client) return { incoming: [], outgoing: [] }

      const nextId = await client.readContract({
        address: PAY_REQUEST_ADDRESS,
        abi: payRequestAbi,
        functionName: 'nextId',
      })
      if (nextId === BigInt(0)) return { incoming: [], outgoing: [] }
      const count = nextId > BigInt(500) ? 500 : Number(nextId)

      const results = await client.multicall({
        contracts: Array.from({ length: count }, (_, i) => ({
          address: PAY_REQUEST_ADDRESS,
          abi: payRequestAbi,
          functionName: 'getRequest' as const,
          args: [BigInt(i)] as const,
        })),
        allowFailure: true,
      })

      const views: PayRequestView[] = []
      results.forEach((row, i) => {
        if (row.status !== 'success') return
        const request = row.result
        if (request.payee === ZERO_ADDRESS) return
        views.push({
          id: BigInt(i),
          payee: request.payee,
          payer: request.payer,
          token: request.token,
          amount: request.amount,
          memo: request.memo,
          paid: request.paid,
          paidBy: request.paidBy,
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
