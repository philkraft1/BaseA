import { createBaseAccountSDK } from '@base-org/account'
import { APP_CHAIN_ID } from '@/config/network'

let sdk: ReturnType<typeof createBaseAccountSDK> | null = null

export function getDueSdk() {
  if (!sdk) {
    sdk = createBaseAccountSDK({
      appName: 'Due',
      appLogoUrl: 'https://basea-tau.vercel.app/due.svg',
      appChainIds: [APP_CHAIN_ID],
    })
  }
  return sdk
}

export function getDueProvider() {
  return getDueSdk().getProvider()
}
