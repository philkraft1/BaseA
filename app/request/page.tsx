import { CreateRequestForm } from '@/components/CreateRequestForm'
import { PageHeader } from '@/components/PageHeader'

export default function RequestPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Request USDC"
        subtitle="Create an onchain request and share the link. Optional payer locks it to one address or basename."
      />
      <div className="float-card max-w-md p-5">
        <CreateRequestForm />
      </div>
    </div>
  )
}
