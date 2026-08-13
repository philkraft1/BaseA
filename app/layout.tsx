import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
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
  title: 'Float — USDC on Base',
  description: 'Request, pay, and park USDC on Base',
  icons: { icon: '/float.svg' },
  metadataBase: new URL('https://basea-tau.vercel.app'),
  openGraph: {
    title: 'Float — USDC on Base',
    description: 'Request, pay, and park USDC on Base',
    images: [{ url: '/og.png', width: 1280, height: 640, alt: 'Float — request, pay, and park USDC on Base' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Float — USDC on Base',
    description: 'Request, pay, and park USDC on Base',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
