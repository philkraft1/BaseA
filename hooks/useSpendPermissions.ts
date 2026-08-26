'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPermissions } from '@base-org/account/spend-permission/browser'
import { useAccount } from 'wagmi'
import { APP_CHAIN_ID } from '@/config/network'
import { getDueProvider } from '@/lib/base-account'

type SpendPermission = Awaited<ReturnType<typeof fetchPermissions>>[number]

export function useSpendPermissions(spender?: `0x${string}`) {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['spend-permissions', address, spender, APP_CHAIN_ID],
    enabled: Boolean(address),
    queryFn: async (): Promise<SpendPermission[]> => {
      if (!address) return []
      const provider = getDueProvider()

      if (!spender) {
        try {
          const response = (await provider.request({
            method: 'coinbase_fetchPermissions',
            params: [
              {
                account: address,
                chainId: `0x${APP_CHAIN_ID.toString(16)}`,
              },
            ],
          })) as { permissions?: SpendPermission[] }
          if (response?.permissions) return response.permissions
        } catch {
          // Host may require a spender; fall through.
        }
        return []
      }

      return fetchPermissions({
        provider,
        account: address,
        chainId: APP_CHAIN_ID,
        spender,
      })
    },
  })
}
