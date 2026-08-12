import { PayRequestPanel } from '@/components/PayRequestPanel'

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
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Pay request</h1>
      <PayRequestPanel id={requestId} />
    </div>
  )
}
