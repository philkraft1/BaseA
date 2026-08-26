import { NextResponse } from 'next/server'
import { getSubscriptionOwner } from '@/lib/cdp'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const owner = await getSubscriptionOwner()
    return NextResponse.json({
      configured: owner.configured,
      address: owner.address,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load subscription owner'
    return NextResponse.json({ configured: false, address: null, error: message }, { status: 500 })
  }
}
