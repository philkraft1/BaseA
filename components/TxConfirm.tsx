'use client'

export type ConfirmLine = { label: string; value: string }

export function TxConfirm({
  open,
  title,
  lines,
  confirmLabel = 'Confirm in wallet',
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  lines: ConfirmLine[]
  confirmLabel?: string
  pending?: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-confirm-title"
        className="float-card w-full max-w-md p-5 shadow-lg"
      >
        <h2 id="tx-confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          {lines.map((line) => (
            <div key={line.label}>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                {line.label}
              </dt>
              <dd className="break-all font-mono text-zinc-900 dark:text-zinc-100">
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="float-btn-ghost"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="float-btn"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
