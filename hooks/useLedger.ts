'use client'

import { useQuery } from '@tanstack/react-query'
import { parseAbiItem } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS } from '@/config/network'
import {
  PAY_REQUEST_ADDRESS,
  isPayRequestDeployed,
} from '@/config/pay-request'

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
)

const createdEvent = parseAbiItem(
  'event RequestCreated(uint256 indexed id, address indexed payee, address indexed payer, address token, uint256 amount, string memo)',
)

const paidEvent = parseAbiItem(
  'event RequestPaid(uint256 indexed id, address indexed paidBy, uint256 amount)',
)

export type LedgerRow = {
  kind: 'in' | 'out' | 'request' | 'paid'
  id?: string
  counterparty: string
  amount: bigint
  memo?: string
  txHash: string
  blockNumber: bigint
}

export function useLedger() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: APP_CHAIN_ID })

  return useQuery({
    queryKey: ['ledger', address, PAY_REQUEST_ADDRESS],
    enabled: Boolean(address && client),
    queryFn: async (): Promise<{
      inflow: bigint
      outflow: bigint
      rows: LedgerRow[]
    }> => {
      if (!address || !client) {
        return { inflow: BigInt(0), outflow: BigInt(0), rows: [] }
      }

      const latest = await client.getBlockNumber()
      const lookback = BigInt(40_000)
      const fromBlock = latest > lookback ? latest - lookback : BigInt(0)

      const [incoming, outgoing] = await Promise.all([
        client.getLogs({
          address: USDC_ADDRESS,
          event: transferEvent,
          args: { to: address },
          fromBlock,
          toBlock: latest,
        }),
        client.getLogs({
          address: USDC_ADDRESS,
          event: transferEvent,
          args: { from: address },
          fromBlock,
          toBlock: latest,
        }),
      ])

      const rows: LedgerRow[] = []
      let inflow = BigInt(0)
      let outflow = BigInt(0)

      for (const log of incoming) {
        const value = log.args.value ?? BigInt(0)
        inflow += value
        rows.push({
          kind: 'in',
          counterparty: log.args.from ?? '',
          amount: value,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        })
      }
      for (const log of outgoing) {
        const value = log.args.value ?? BigInt(0)
        outflow += value
        rows.push({
          kind: 'out',
          counterparty: log.args.to ?? '',
          amount: value,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        })
      }

      if (isPayRequestDeployed) {
        const [created, paid] = await Promise.all([
          client.getLogs({
            address: PAY_REQUEST_ADDRESS,
            event: createdEvent,
            args: { payee: address },
            fromBlock,
            toBlock: latest,
          }),
          client.getLogs({
            address: PAY_REQUEST_ADDRESS,
            event: paidEvent,
            fromBlock,
            toBlock: latest,
          }),
        ])
        for (const log of created) {
          rows.push({
            kind: 'request',
            id: log.args.id?.toString(),
            counterparty: log.args.payer ?? '',
            amount: log.args.amount ?? BigInt(0),
            memo: log.args.memo,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          })
        }
        for (const log of paid) {
          rows.push({
            kind: 'paid',
            id: log.args.id?.toString(),
            counterparty: log.args.paidBy ?? '',
            amount: log.args.amount ?? BigInt(0),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          })
        }
      }

      rows.sort((a, b) => Number(b.blockNumber - a.blockNumber))
      return { inflow, outflow, rows: rows.slice(0, 40) }
    },
  })
}
