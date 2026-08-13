import { Ledger } from '@/components/Ledger'
import { PageHeader } from '@/components/PageHeader'

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Your USDC float"
        subtitle="See what moved, request payment, or park idle dollars. On Base."
      />
      <Ledger />
    </div>
  )
}
