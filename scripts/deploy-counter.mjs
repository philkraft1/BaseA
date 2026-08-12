/**
 * Deploy Counter to Base Sepolia with viem.
 * Usage (from repo root):
 *   set DEPLOYER_PRIVATE_KEY=0x...
 *   node scripts/deploy-counter.mjs
 */
import { createWalletClient, createPublicClient, http, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const rpc = process.env.BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org'
const pk = process.env.DEPLOYER_PRIVATE_KEY

if (!pk) {
  console.error('Set DEPLOYER_PRIVATE_KEY (hex) then re-run.')
  console.error('Fund the deployer on Base Sepolia first: https://docs.base.org/base-chain/network-information/network-faucets')
  process.exit(1)
}

const artifactPath = resolve(
  root,
  'contracts/out/Counter.sol/Counter.json',
)
if (!existsSync(artifactPath)) {
  console.error('Missing artifact. Run: cd contracts && forge build')
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
const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpc) })
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(rpc),
})

const balance = await publicClient.getBalance({ address: account.address })
console.log('Deployer:', account.address)
console.log('Balance:', formatEther(balance), 'ETH')
if (balance === 0n) {
  console.error('Deployer has 0 ETH. Fund via a Base Sepolia faucet, then retry.')
  process.exit(1)
}

const hash = await walletClient.deployContract({
  abi,
  bytecode,
  args: [],
})
console.log('Tx:', hash)
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const address = receipt.contractAddress
console.log('Counter:', address)

const envPath = resolve(root, '.env.local')
const line = `NEXT_PUBLIC_COUNTER_ADDRESS=${address}\n`
if (existsSync(envPath)) {
  const prev = readFileSync(envPath, 'utf8')
  if (prev.includes('NEXT_PUBLIC_COUNTER_ADDRESS=')) {
    writeFileSync(
      envPath,
      prev.replace(/NEXT_PUBLIC_COUNTER_ADDRESS=.*/g, `NEXT_PUBLIC_COUNTER_ADDRESS=${address}`),
    )
  } else {
    writeFileSync(envPath, prev + (prev.endsWith('\n') ? '' : '\n') + line)
  }
} else {
  writeFileSync(envPath, line)
}
console.log('Wrote', envPath)
