import {
  createBaseAccountSDK,
  type ProviderInterface,
} from '@base-org/account'
import type { Connector } from 'wagmi'
import { DUE_APP_LOGO_URL, DUE_APP_NAME } from '@/config/app'
import { APP_CHAIN_ID } from '@/config/network'

let sdk: ReturnType<typeof createBaseAccountSDK> | null = null

export function getDueSdk() {
  if (!sdk) {
    sdk = createBaseAccountSDK({
      appName: DUE_APP_NAME,
      appLogoUrl: DUE_APP_LOGO_URL,
      appChainIds: [APP_CHAIN_ID],
    })
  }
  return sdk
}

function asProviderInterface(value: unknown): ProviderInterface | null {
  if (
    value &&
    typeof value === 'object' &&
    'request' in value &&
    typeof (value as ProviderInterface).request === 'function'
  ) {
    return value as ProviderInterface
  }
  return null
}

/** Prefer the connected wagmi provider so spend-permission calls share the login session. */
export async function getDueProvider(connector?: Connector | null) {
  if (connector) {
    const fromConnector = asProviderInterface(await connector.getProvider())
    if (fromConnector) return fromConnector
  }
  return getDueSdk().getProvider()
}
