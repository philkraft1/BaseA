'use client'

import { useAccount, useReadContract } from 'wagmi'
import { APP_CHAIN_ID, USDC_ADDRESS } from '@/config/network'
import { erc20Abi } from '@/config/standing-order'

export function useUsdcBalance() {
  const { address } = useAccount()
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled: Boolean(address) },
  })
}
