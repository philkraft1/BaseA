import { NextResponse } from 'next/server'
import { APP_CHAIN_ID } from '@/config/network'
import {
  STANDING_ORDER_ADDRESS,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'
import { chainPublicClient } from '@/lib/cdp'

export const runtime = 'nodejs'

/** Public onchain counters for Base.dev / Builder Grants. */
export async function GET() {
  if (!isStandingOrderDeployed) {
    return NextResponse.json({
      deployed: false,
      chainId: APP_CHAIN_ID,
      address: STANDING_ORDER_ADDRESS,
      ordersCreated: '0',
    })
  }

  const client = chainPublicClient()
  const nextId = await client.readContract({
    address: STANDING_ORDER_ADDRESS,
    abi: standingOrderAbi,
    functionName: 'nextId',
  })

  return NextResponse.json({
    deployed: true,
    chainId: APP_CHAIN_ID,
    address: STANDING_ORDER_ADDRESS,
    ordersCreated: nextId.toString(),
  })
}
