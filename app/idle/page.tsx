import { IdleYieldBoard } from '@/components/IdleYieldBoard'
import { PageHeader } from '@/components/PageHeader'

export default function IdlePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Idle USDC"
        subtitle="Comparison only. Float never auto-deposits."
      />
      <IdleYieldBoard />
    </div>
  )
}
