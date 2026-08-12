import { SendUsdcForm } from '@/components/SendUsdcForm'

export default function PayPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Pay USDC</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Send to an address or basename. Open a request link to pay a Float
          invoice.
        </p>
      </div>
      <SendUsdcForm />
    </div>
  )
}
