import { OrderPanel } from '@/components/OrderPanel'
import { PageHeader } from '@/components/PageHeader'

export default async function DueOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let orderId: bigint
  try {
    orderId = BigInt(id)
  } catch {
    return <p className="text-sm text-red-600">Invalid order id.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Order #${id}`}
        subtitle="Share this link. The payer settles each period from here."
      />
      <OrderPanel id={orderId} />
    </div>
  )
}
