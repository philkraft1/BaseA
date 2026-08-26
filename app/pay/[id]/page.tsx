import { PayRequestPanel } from '@/components/PayRequestPanel'
import { PageHeader } from '@/components/PageHeader'

export default async function PayRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let requestId: bigint
  try {
    requestId = BigInt(id)
  } catch {
    return <p className="text-sm text-red-600">Invalid request id.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Request #${id}`}
        subtitle="Share this link. The payer settles this one-time USDC request from here."
      />
      <PayRequestPanel id={requestId} />
    </div>
  )
}
