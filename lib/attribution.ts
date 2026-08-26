import { concat, type Hex } from 'viem'
import { DATA_SUFFIX } from '@/config/builder-code'

export { BUILDER_CODE, DATA_SUFFIX } from '@/config/builder-code'

/** Append ERC-8021 suffix to EOA / inner calldata. */
export function appendBuilderCode(data: Hex): Hex {
  if (!DATA_SUFFIX) return data
  return concat([data, DATA_SUFFIX])
}

/** EIP-5792 capability so smart wallets put the suffix on the UserOp. */
export function attributionCapabilities() {
  if (!DATA_SUFFIX) return undefined
  return {
    dataSuffix: {
      value: DATA_SUFFIX,
      optional: true as const,
    },
  }
}
