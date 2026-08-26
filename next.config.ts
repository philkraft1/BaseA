import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src https://keys.coinbase.com https://*.coinbase.com",
  [
    "connect-src 'self'",
    isDev ? 'http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*' : '',
    'https://mainnet.base.org',
    'https://sepolia.base.org',
    'https://rpc.wallet.coinbase.com',
    'https://api.base.org',
    'https://*.coinbase.com',
    'wss://*.coinbase.com',
    'https://keys.coinbase.com',
    'https://*.walletconnect.com',
    'https://*.walletconnect.org',
    'wss://*.walletconnect.org',
    'https://www.walletlink.org',
    'wss://www.walletlink.org',
  ]
    .filter(Boolean)
    .join(' '),
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return [
      { source: '/request', destination: '/new', permanent: true },
      { source: '/approvals', destination: '/permissions', permanent: true },
      { source: '/idle', destination: '/', permanent: true },
    ]
  },
}

export default nextConfig
