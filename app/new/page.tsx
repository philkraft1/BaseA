import { NewFlow } from '@/components/NewFlow'
import { PageHeader } from '@/components/PageHeader'

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New payment"
        subtitle="Create a standing USDC order, a one-time request, or send USDC now with Base Account pay()."
      />
      <NewFlow />
    </div>
  )
}
