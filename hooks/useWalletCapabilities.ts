import { useMemo } from 'react'
import { useCapabilities } from 'wagmi'
import { APP_CHAIN_ID } from '@/config/network'

export function useWalletCapabilities() {
  const { data: capabilities } = useCapabilities()

  const supportsBatching = useMemo(() => {
    const atomic = capabilities?.[APP_CHAIN_ID]?.atomic
    return atomic?.status === 'ready' || atomic?.status === 'supported'
  }, [capabilities])

  const supportsPaymaster = useMemo(() => {
    return capabilities?.[APP_CHAIN_ID]?.paymasterService?.supported === true
  }, [capabilities])

  return { supportsBatching, supportsPaymaster }
}
