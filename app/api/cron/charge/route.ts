import { isAddress } from 'viem'
import { NextResponse } from 'next/server'
import { chainPublicClient, chargeOrder, recordPaymentOnchain } from '@/lib/cdp'
import {
  STANDING_ORDER_ADDRESS,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'

export const runtime = 'nodejs'

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization')
  return header === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isStandingOrderDeployed) {
    return NextResponse.json({ error: 'StandingOrder not deployed' }, { status: 503 })
  }

  const client = chainPublicClient()
  const nextId = await client.readContract({
    address: STANDING_ORDER_ADDRESS,
    abi: standingOrderAbi,
    functionName: 'nextId',
  })

  const charged: { id: string; tx?: string; error?: string }[] = []
  const skipped: string[] = []

  for (let i = 0n; i < nextId; i++) {
    const order = await client.readContract({
      address: STANDING_ORDER_ADDRESS,
      abi: standingOrderAbi,
      functionName: 'getOrder',
      args: [i],
    })
    if (order.cancelled || order.payer === '0x0000000000000000000000000000000000000000') {
      skipped.push(i.toString())
      continue
    }
    const due = await client.readContract({
      address: STANDING_ORDER_ADDRESS,
      abi: standingOrderAbi,
      functionName: 'isDue',
      args: [i],
    })
    if (!due) {
      skipped.push(i.toString())
      continue
    }
    if (order.subscriptionId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      skipped.push(i.toString())
      continue
    }
    if (!isAddress(order.payee) || !isAddress(order.payer)) {
      skipped.push(i.toString())
      continue
    }
    try {
      const result = await chargeOrder({
        subscriptionId: order.subscriptionId,
        amount: order.amount,
        payee: order.payee,
        payer: order.payer,
      })
      try {
        await recordPaymentOnchain(i, order.amount)
      } catch (recordError) {
        charged.push({
          id: i.toString(),
          tx: result.id,
          error: `charged but recordPayment failed: ${
            recordError instanceof Error ? recordError.message : 'unknown'
          }`,
        })
        continue
      }
      charged.push({ id: i.toString(), tx: result.id })
    } catch (error) {
      charged.push({
        id: i.toString(),
        error: error instanceof Error ? error.message : 'charge failed',
      })
    }
  }

  return NextResponse.json({ nextId: nextId.toString(), charged, skipped })
}
