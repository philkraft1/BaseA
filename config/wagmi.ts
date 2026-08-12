import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { baseAccount, injected } from 'wagmi/connectors'
import { appChain, RPC_URL } from './network'

export const config = createConfig({
  chains: [appChain],
  connectors: [
    injected(),
    baseAccount({
      appName: 'Float',
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [appChain.id]: http(RPC_URL),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
