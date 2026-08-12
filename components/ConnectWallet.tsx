'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isReconnecting) {
    return <div className="text-sm text-zinc-500">Reconnecting...</div>
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            type="button"
            onClick={() => connect({ connector })}
            disabled={isConnecting || isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        Disconnect
      </button>
    </div>
  )
}
