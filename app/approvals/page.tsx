import { ApprovalsPanel } from '@/components/ApprovalsPanel'
import { PageHeader } from '@/components/PageHeader'

export default function ApprovalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="USDC approvals"
        subtitle="Revoke leftover allowances on known spenders."
      />
      <div className="float-card p-5">
        <ApprovalsPanel />
      </div>
    </div>
  )
}
