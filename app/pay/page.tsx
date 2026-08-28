import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'

export default function PayIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pay a request"
        subtitle="Open a shared /pay/{id} link, or create a one-time USDC request to share."
      />
      <p className="text-sm text-zinc-600">
        Need to collect?{' '}
        <Link href="/new" className="underline">
          Create a pay request
        </Link>
        . Sending USDC yourself? Use{' '}
        <Link href="/new" className="underline">
          Send now
        </Link>{' '}
        on the New page (Base Account <code>pay()</code>).
      </p>
    </div>
  )
}
