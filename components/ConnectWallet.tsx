'use client'

import { useSyncExternalStore } from 'react'
import { useAccount, useConnect, useConnectors, useDisconnect } from 'wagmi'
import { shortAddress } from '@/lib/format'
import {
  injectedConnectorLabel,
  isBaseAccountConnector,
  shouldOfferInjectedConnector,
} from '@/lib/wallet-connectors'

const emptySubscribe = () => () => {}

export function ConnectWallet() {
  const { address, isConnected, isReconnecting } = useAccount()
  const { connect, isPending, error, variables } = useConnect()
  const connectors = useConnectors()
  const { disconnect } = useDisconnect()
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const baseAccount = connectors.find(isBaseAccountConnector)
  const injected = isClient
    ? connectors.find(shouldOfferInjectedConnector)
    : undefined
  const pendingConnector = variables?.connector
  const pendingUid =
    pendingConnector && 'uid' in pendingConnector
      ? pendingConnector.uid
      : undefined

  if (isReconnecting && (isConnected || address)) {
    return <div className="text-sm text-zinc-500">Reconnecting…</div>
  }

  if (!isConnected) {
    return (
      <div className="flex max-w-sm flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end gap-2">
          {baseAccount ? (
            <button
              key={baseAccount.uid}
              type="button"
              onClick={() => connect({ connector: baseAccount })}
              disabled={isPending && pendingUid === baseAccount.uid}
              className="float-btn"
            >
              {isPending && pendingUid === baseAccount.uid
                ? 'Connecting…'
                : 'Sign in with Base'}
            </button>
          ) : null}
          {injected ? (
            <button
              key={injected.uid}
              type="button"
              onClick={() => connect({ connector: injected })}
              disabled={isPending && pendingUid === injected.uid}
              className="float-btn-ghost"
            >
              {isPending && pendingUid === injected.uid
                ? 'Connecting…'
                : injectedConnectorLabel(injected)}
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="text-right text-xs text-red-600">{error.message}</p>
        ) : null}
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
