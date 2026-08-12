import { isAddress } from 'viem'
import { normalize } from 'viem/ens'
import { ZERO_ADDRESS } from '@/config/network'

type EnsClient = {
  getEnsAddress: (args: { name: string }) => Promise<`0x${string}` | null>
}

export async function resolveRecipient(
  client: EnsClient,
  input: string,
): Promise<`0x${string}` | null> {
  const value = input.trim()
  if (!value) return null
  if (isAddress(value)) return value as `0x${string}`

  try {
    const name = value.includes('.') ? value : `${value}.base.eth`
    const resolved = await client.getEnsAddress({ name: normalize(name) })
    if (!resolved || resolved === ZERO_ADDRESS) return null
    return resolved
  } catch {
    return null
  }
}
