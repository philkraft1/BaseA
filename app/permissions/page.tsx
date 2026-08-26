import { PermissionsPanel } from '@/components/PermissionsPanel'
import { PageHeader } from '@/components/PageHeader'

export default function PermissionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Who can spend"
        subtitle="Spend permissions on your Base Account and leftover USDC allowances — revoke in one tap."
      />
      <PermissionsPanel />
    </div>
  )
}
