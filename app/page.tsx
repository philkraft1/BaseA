import { BatchIncrement } from '@/components/BatchIncrement'
import { ConnectWallet } from '@/components/ConnectWallet'
import { CounterDisplay } from '@/components/CounterDisplay'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-50 to-zinc-100 p-8 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">
          BaseA
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Onchain Tally
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Base Sepolia · wagmi · Base Account
        </p>
      </div>
      <ConnectWallet />
      <CounterDisplay />
      <BatchIncrement />
    </main>
  )
}
