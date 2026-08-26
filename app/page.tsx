import { Inbox } from '@/components/Inbox'
import { PageHeader } from '@/components/PageHeader'

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="What’s due"
        subtitle="Standing USDC orders and one-time pay requests between people, plus a control plane for who can still spend your dollars."
      />
      <Inbox />
    </div>
  )
}
