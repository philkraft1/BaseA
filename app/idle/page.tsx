import { IdleYieldBoard } from '@/components/IdleYieldBoard'

export default function IdlePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Idle USDC</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Comparison only. Float never auto-deposits.
        </p>
      </div>
      <IdleYieldBoard />
    </div>
  )
}
