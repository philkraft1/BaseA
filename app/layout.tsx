import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookieToInitialState } from 'wagmi'
import { AppShell } from '@/components/AppShell'
import { config } from '@/config/wagmi'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Due — standing USDC on Base',
  description:
    'Person-to-person USDC standing orders and a control plane for Base Account spend permissions.',
  icons: { icon: '/due.svg' },
  metadataBase: new URL('https://basea-tau.vercel.app'),
  openGraph: {
    title: 'Due — standing USDC on Base',
    description:
      'Pay a basename on a schedule. See who can still spend your USDC.',
    images: [{ url: '/og.svg', width: 1280, height: 640, alt: 'Due on Base' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Due — standing USDC on Base',
    description:
      'Pay a basename on a schedule. See who can still spend your USDC.',
    images: ['/og.svg'],
  },
  other: {
    'base:app_id': '6a8abd3739d7d26f4bad1883',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const initialState = cookieToInitialState(config, headersList.get('cookie'))

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers initialState={initialState}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
