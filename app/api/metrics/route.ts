import { NextResponse } from 'next/server'
import { APP_CHAIN_ID } from '@/config/network'
import {
  PAY_REQUEST_ADDRESS,
  isPayRequestDeployed,
  payRequestAbi,
} from '@/config/pay-request'
import {
  STANDING_ORDER_ADDRESS,
  isStandingOrderDeployed,
  standingOrderAbi,
} from '@/config/standing-order'
import { chainPublicClient } from '@/lib/cdp'

export const runtime = 'nodejs'

/** Public onchain counters for Base.dev / Builder Grants. */
export async function GET() {
  const client = chainPublicClient()

  const [ordersCreated, requestsCreated] = await Promise.all([
    isStandingOrderDeployed
      ? client.readContract({
          address: STANDING_ORDER_ADDRESS,
          abi: standingOrderAbi,
          functionName: 'nextId',
        })
      : Promise.resolve(BigInt(0)),
    isPayRequestDeployed
      ? client.readContract({
          address: PAY_REQUEST_ADDRESS,
          abi: payRequestAbi,
          functionName: 'nextId',
        })
      : Promise.resolve(BigInt(0)),
  ])

  return NextResponse.json({
    deployed: isStandingOrderDeployed,
    chainId: APP_CHAIN_ID,
    address: STANDING_ORDER_ADDRESS,
    payRequestAddress: PAY_REQUEST_ADDRESS,
    payRequestDeployed: isPayRequestDeployed,
    ordersCreated: ordersCreated.toString(),
    requestsCreated: requestsCreated.toString(),
  })
}
