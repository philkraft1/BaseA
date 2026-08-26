import { CreateOrderForm } from '@/components/CreateOrderForm'
import { PageHeader } from '@/components/PageHeader'

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New standing order"
        subtitle="Pay a basename on a schedule. Auto-charge when spend permissions are available; otherwise pay each period in one tap."
      />
      <CreateOrderForm />
    </div>
  )
}
