'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectWallet } from '@/components/ConnectWallet'
import { DueLogo } from '@/components/DueLogo'

const links = [
  { href: '/', label: 'Inbox' },
  { href: '/new', label: 'New' },
  { href: '/permissions', label: 'Permissions' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfeff_0%,_var(--background)_55%)] dark:bg-[radial-gradient(ellipse_at_top,_#164e63_0%,_var(--background)_55%)]">
      <header className="border-b-2 border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <DueLogo className="h-9 w-9 shrink-0 rounded-[9px] ring-2 ring-cyan-800/10 dark:ring-cyan-300/20" />
            <span>
              <span className="block text-lg font-bold leading-none tracking-tight">
                Due
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Standing USDC on Base
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
            {links.map((link) => {
              const active =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active
                      ? 'border border-cyan-700 bg-white text-cyan-800 shadow-sm dark:border-cyan-400 dark:bg-zinc-800 dark:text-cyan-200'
                      : 'border border-transparent text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <ConnectWallet />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
