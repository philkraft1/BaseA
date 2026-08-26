/**
 * Set StandingOrder.operator (CDP subscription owner).
 *   $env:DEPLOYER_PRIVATE_KEY="0x..."
 *   $env:OPERATOR_ADDRESS="0x..."
 *   node scripts/set-operator.mjs
 */
import { createWalletClient, createPublicClient, http, isAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
const chain = sepolia ? baseSepolia : base
const rpc =
  process.env.BASE_RPC_URL ??
  (sepolia ? 'https://sepolia.base.org' : 'https://mainnet.base.org')
const pk = process.env.DEPLOYER_PRIVATE_KEY
const operator = process.env.OPERATOR_ADDRESS
const standing =
  process.env.NEXT_PUBLIC_STANDING_ORDER_ADDRESS ??
  process.env.STANDING_ORDER_ADDRESS

if (!pk || !operator || !isAddress(operator) || !standing || !isAddress(standing)) {
  console.error('Need DEPLOYER_PRIVATE_KEY, OPERATOR_ADDRESS, NEXT_PUBLIC_STANDING_ORDER_ADDRESS')
  process.exit(1)
}

const artifactPath = resolve(
  root,
  'contracts/out/StandingOrder.sol/StandingOrder.json',
)
if (!existsSync(artifactPath)) {
  console.error('Missing artifact. Run: npm run contracts:build')
  process.exit(1)
}
const { abi } = JSON.parse(readFileSync(artifactPath, 'utf8'))
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`)
const publicClient = createPublicClient({ chain, transport: http(rpc) })
const walletClient = createWalletClient({ account, chain, transport: http(rpc) })

const hash = await walletClient.writeContract({
  address: standing,
  abi,
  functionName: 'setOperator',
  args: [operator],
})
console.log('Tx:', hash)
await publicClient.waitForTransactionReceipt({ hash })
console.log('Operator set to', operator)
