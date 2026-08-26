import { isAddress } from 'viem'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Best-effort Base App notification. No-ops without BASE_NOTIFICATIONS_API_KEY.
 * Docs: https://docs.base.org/apps/technical-guides/base-notifications
 */
export async function POST(request: Request) {
  const key = process.env.BASE_NOTIFICATIONS_API_KEY
  const appUrl = process.env.BASE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!key || !appUrl) {
    return NextResponse.json({ sent: false, reason: 'notifications not configured' })
  }

  let body: { wallet?: string; title?: string; body?: string; targetPath?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.wallet || !isAddress(body.wallet) || !body.title || !body.body) {
    return NextResponse.json({ error: 'wallet, title, and body required' }, { status: 400 })
  }

  const res = await fetch('https://api.base.org/v1/notifications', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify({
      app_url: appUrl,
      wallet_addresses: [body.wallet],
      title: body.title.slice(0, 30),
      body: body.body.slice(0, 180),
      target_path: body.targetPath?.startsWith('/') ? body.targetPath : '/',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ sent: false, error: text }, { status: 502 })
  }
  return NextResponse.json({ sent: true })
}
