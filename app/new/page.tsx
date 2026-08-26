import { NewFlow } from '@/components/NewFlow'
import { PageHeader } from '@/components/PageHeader'

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New payment"
        subtitle="Create a standing USDC order on a schedule, or a one-time request anyone (or a named payer) can settle from a share link."
      />
      <NewFlow />
    </div>
  )
}
