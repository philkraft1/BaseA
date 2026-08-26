import { concat, numberToHex, size, stringToHex, type Hex } from 'viem'

const code = process.env.NEXT_PUBLIC_BUILDER_CODE?.trim()

export const BUILDER_CODE = code && code.length > 0 ? code : null

/** ERC-8021 schema 0 suffix (ox/erc8021 Attribution.toDataSuffix). */
function toDataSuffix(codes: string[]): Hex {
  const codesHex = stringToHex(codes.join(','))
  const codesLengthHex = numberToHex(size(codesHex), { size: 1 })
  const schemaIdHex = numberToHex(0, { size: 1 })
  const ercSuffix =
    '0x80218021802180218021802180218021' as Hex
  return concat([codesHex, codesLengthHex, schemaIdHex, ercSuffix])
}

export const DATA_SUFFIX = BUILDER_CODE ? toDataSuffix([BUILDER_CODE]) : undefined
