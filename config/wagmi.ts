import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { baseAccount, injected } from 'wagmi/connectors'
import { DUE_APP_LOGO_URL, DUE_APP_NAME } from './app'
import { DATA_SUFFIX } from './builder-code'
import { appChain, RPC_URL } from './network'

export const config = createConfig({
  chains: [appChain],
  multiInjectedProviderDiscovery: false,
  connectors: [
    baseAccount({
      appName: DUE_APP_NAME,
      appLogoUrl: DUE_APP_LOGO_URL,
    }),
    injected(),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [appChain.id]: http(RPC_URL),
  },
  ...(DATA_SUFFIX ? { dataSuffix: DATA_SUFFIX } : {}),
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
