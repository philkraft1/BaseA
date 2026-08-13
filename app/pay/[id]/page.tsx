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
    <div className="flex flex-col gap-6">
      <h1 className="border-b-2 border-zinc-200 pb-4 text-3xl font-bold tracking-tight dark:border-zinc-700">
        Pay request
      </h1>
      <PayRequestPanel id={requestId} />
    </div>
  )
}
