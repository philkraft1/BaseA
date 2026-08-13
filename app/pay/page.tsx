import { SendUsdcForm } from '@/components/SendUsdcForm'
import { PageHeader } from '@/components/PageHeader'

export default function PayPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pay USDC"
        subtitle="Send to an address or basename. Open a request link to pay a Float invoice."
      />
      <div className="float-card max-w-md p-5">
        <SendUsdcForm />
      </div>
    </div>
  )
}
