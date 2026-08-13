'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { shortAddress } from '@/lib/format'

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isReconnecting) {
    return <div className="text-sm text-zinc-500">Reconnecting…</div>
  }

  if (!isConnected) {
    return (
      <div className="flex flex-wrap gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            type="button"
            onClick={() => connect({ connector })}
            disabled={isConnecting || isPending}
            className="float-btn"
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
      <span className="rounded-md bg-cyan-50 px-2 py-1 font-mono text-xs text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
        {shortAddress(address)}
      </span>
      <button type="button" onClick={() => disconnect()} className="float-btn-ghost">
        Disconnect
      </button>
    </div>
  )
}
