import { CreateRequestForm } from '@/components/CreateRequestForm'

export default function RequestPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Request USDC</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create an onchain request and share the link. Optional payer locks it
          to one address or basename.
        </p>
      </div>
      <CreateRequestForm />
    </div>
  )
}
