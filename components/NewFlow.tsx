'use client'

import { useState } from 'react'
import { CreateOrderForm } from '@/components/CreateOrderForm'
import { CreatePayRequestForm } from '@/components/CreatePayRequestForm'
import { SendUsdcForm } from '@/components/SendUsdcForm'

const tabs = [
  { id: 'order' as const, label: 'Standing order' },
  { id: 'request' as const, label: 'One-time request' },
  { id: 'send' as const, label: 'Send now' },
]

export function NewFlow() {
  const [kind, setKind] = useState<(typeof tabs)[number]['id']>('order')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit flex-wrap gap-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
        {tabs.map((tab) => {
          const active = kind === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setKind(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                active
                  ? 'border border-cyan-700 bg-white text-cyan-800 shadow-sm dark:border-cyan-400 dark:bg-zinc-800 dark:text-cyan-200'
                  : 'border border-transparent text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {kind === 'order' ? (
        <CreateOrderForm />
      ) : kind === 'request' ? (
        <CreatePayRequestForm />
      ) : (
        <SendUsdcForm />
      )}
    </div>
  )
}
