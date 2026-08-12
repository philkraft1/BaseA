import { Ledger } from '@/components/Ledger'

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Your USDC float</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          See what moved, request payment, or park idle dollars. On Base.
        </p>
      </div>
      <Ledger />
    </div>
  )
}
