/**
 * Deploy StandingOrder to Base (mainnet by default).
 * Usage (from repo root):
 *   $env:DEPLOYER_PRIVATE_KEY="0x..."
 *   node scripts/deploy-standing-order.mjs
 * Optional:
 *   $env:DEPLOY_NETWORK="sepolia"
 *   $env:OPERATOR_ADDRESS="0x..."
 */
import { createWalletClient, createPublicClient, http, formatEther, isAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
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
const network = (process.env.DEPLOY_NETWORK ?? 'mainnet').toLowerCase()
const sepolia = network === 'sepolia'
const chain = sepolia ? baseSepolia : base
const rpc =
  process.env.BASE_RPC_URL ??
  (sepolia ? 'https://sepolia.base.org' : 'https://mainnet.base.org')
const pk = process.env.DEPLOYER_PRIVATE_KEY
const usdc =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  (sepolia
    ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
const operatorRaw = process.env.OPERATOR_ADDRESS
const operator =
  operatorRaw && isAddress(operatorRaw)
    ? operatorRaw
    : '0x0000000000000000000000000000000000000000'

if (!pk) {
  console.error('Set DEPLOYER_PRIVATE_KEY (hex) then re-run.')
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

const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
const bytecode = artifact.bytecode?.object
const abi = artifact.abi
if (!bytecode || bytecode === '0x') {
  console.error('Artifact missing bytecode')
  process.exit(1)
}

const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`)
const publicClient = createPublicClient({
  chain,
  transport: http(rpc),
})
const walletClient = createWalletClient({
  account,
  chain,
  transport: http(rpc),
})

const balance = await publicClient.getBalance({ address: account.address })
console.log('Network:', chain.name, chain.id)
console.log('Deployer:', account.address)
console.log('USDC:', usdc)
console.log('Operator:', operator)
console.log('Balance:', formatEther(balance), 'ETH')
if (balance === 0n) {
  console.error('Deployer has 0 ETH. Fund it, then retry.')
  process.exit(1)
}

const hash = await walletClient.deployContract({
  abi,
  bytecode,
  args: [usdc, operator],
})
console.log('Tx:', hash)
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const address = receipt.contractAddress
console.log('StandingOrder:', address)

const envPath = resolve(root, '.env.local')
const line = `NEXT_PUBLIC_STANDING_ORDER_ADDRESS=${address}\n`
if (existsSync(envPath)) {
  const prev = readFileSync(envPath, 'utf8')
  if (prev.includes('NEXT_PUBLIC_STANDING_ORDER_ADDRESS=')) {
    writeFileSync(
      envPath,
      prev.replace(
        /NEXT_PUBLIC_STANDING_ORDER_ADDRESS=.*/g,
        `NEXT_PUBLIC_STANDING_ORDER_ADDRESS=${address}`,
      ),
    )
  } else {
    writeFileSync(envPath, prev + (prev.endsWith('\n') ? '' : '\n') + line)
  }
} else {
  writeFileSync(envPath, line)
}
console.log('Wrote', envPath)
if (sepolia) {
  console.log('Sepolia explorer:', `https://sepolia.basescan.org/address/${address}`)
} else {
  console.log('Verify on Basescan, then set OPERATOR_ADDRESS via scripts/set-operator.mjs')
}
