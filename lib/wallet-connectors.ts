import type { Connector } from 'wagmi'

function includesCoinbaseOrBaseAccount(value: string) {
  const normalized = value.toLowerCase()
  return (
    normalized.includes('coinbase') || normalized.includes('base account')
  )
}

export function isBaseAccountConnector(connector: Connector) {
  const id = connector.id.toLowerCase()
  const type = String(connector.type).toLowerCase()
  const name = connector.name.toLowerCase()
  return (
    id === 'baseaccount' ||
    type === 'baseaccount' ||
    name.includes('base account')
  )
}

type InjectedEthereum = {
  isBraveWallet?: boolean
  isCoinbaseBrowser?: boolean
  isCoinbaseWallet?: boolean
  isMetaMask?: boolean
  isRabby?: boolean
  providers?: InjectedEthereum[]
}

function getInjectedEthereum(): InjectedEthereum | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { ethereum?: InjectedEthereum }).ethereum
}

function hasNonCoinbaseInjectedWallet() {
  if (typeof window === 'undefined') return false
  const ethereum = getInjectedEthereum()
  if (!ethereum) return false

  const providers = ethereum.providers ?? [ethereum]
  return providers.some(
    (provider) =>
      (provider.isMetaMask || provider.isRabby || provider.isBraveWallet) &&
      !provider.isCoinbaseWallet,
  )
}

function injectedProviderIsCoinbaseOnly() {
  if (typeof window === 'undefined') return false
  const ethereum = getInjectedEthereum()
  if (!ethereum) return true

  if (hasNonCoinbaseInjectedWallet()) return false

  const providers = ethereum.providers ?? [ethereum]
  return Boolean(
    ethereum.isCoinbaseWallet ||
      ethereum.isCoinbaseBrowser ||
      providers.every((provider) => provider.isCoinbaseWallet),
  )
}

export function isCoinbaseInjectedConnector(connector: Connector) {
  if (includesCoinbaseOrBaseAccount(connector.id)) return true
  if (includesCoinbaseOrBaseAccount(connector.name)) return true
  return injectedProviderIsCoinbaseOnly()
}

export function shouldOfferInjectedConnector(connector: Connector) {
  const type = String(connector.type).toLowerCase()
  const id = connector.id.toLowerCase()
  if (type !== 'injected' && id !== 'injected') return false
  return !isCoinbaseInjectedConnector(connector)
}

export function injectedConnectorLabel(connector: Connector) {
  const name = connector.name.trim()
  if (!name || name.toLowerCase() === 'injected') return 'Connect browser wallet'
  return `Connect ${name}`
}
