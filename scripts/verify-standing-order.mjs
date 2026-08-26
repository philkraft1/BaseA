/**
 * Verify StandingOrder on Basescan via Etherscan API V2.
 *   node scripts/verify-standing-order.mjs
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAddress } from 'viem'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(resolve(root, 'contracts/.env'))
loadEnvFile(resolve(root, '.env.local'))

const sepolia = (process.env.DEPLOY_NETWORK ?? 'mainnet').toLowerCase() === 'sepolia'
const chainId = sepolia ? 84532 : 8453
const address = process.env.NEXT_PUBLIC_STANDING_ORDER_ADDRESS
const usdc =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  (sepolia
    ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
const operator = process.env.OPERATOR_ADDRESS ?? '0x0000000000000000000000000000000000000000'
const apiKey = process.env.ETHERSCAN_API_KEY ?? process.env.BASESCAN_API_KEY

if (!address || !isAddress(address) || address === '0x0000000000000000000000000000000000000000') {
  console.error('Set NEXT_PUBLIC_STANDING_ORDER_ADDRESS first.')
  process.exit(1)
}
if (!apiKey) {
  console.error('Set ETHERSCAN_API_KEY (V2 key works for Basescan).')
  process.exit(1)
}

const encoded = spawnSync(
  'cast',
  ['abi-encode', 'constructor(address,address)', usdc, operator],
  { encoding: 'utf8' },
)
if (encoded.status !== 0) {
  console.error(encoded.stderr || 'cast abi-encode failed')
  process.exit(encoded.status ?? 1)
}

const args = [
  'verify-contract',
  address,
  'src/StandingOrder.sol:StandingOrder',
  '--chain',
  String(chainId),
  '--verifier',
  'etherscan',
  '--verifier-url',
  `https://api.etherscan.io/v2/api?chainid=${chainId}`,
  '--etherscan-api-key',
  apiKey,
  '--constructor-args',
  encoded.stdout.trim(),
  '--watch',
  '--compiler-version',
  '0.8.24',
  '--optimizer-runs',
  '200',
]

const result = spawnSync('forge', args, {
  cwd: resolve(root, 'contracts'),
  encoding: 'utf8',
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
