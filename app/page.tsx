import type { Metadata } from 'next'
import { Ledger } from '@/components/Ledger'
import { PageHeader } from '@/components/PageHeader'

export const metadata: Metadata = {
  other: {
    'base:app_id': '6a8abd3739d7d26f4bad1883',
  },
}

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
