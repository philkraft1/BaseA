import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { baseAccount, injected } from 'wagmi/connectors'
import { DATA_SUFFIX } from './builder-code'
import { appChain, RPC_URL } from './network'

export const config = createConfig({
  chains: [appChain],
  connectors: [
    injected(),
    baseAccount({
      appName: 'Due',
    }),
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
