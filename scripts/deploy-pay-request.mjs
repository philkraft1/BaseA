/**
 * Deploy PayRequest to Base mainnet with viem.
 * Usage (from repo root):
 *   $env:DEPLOYER_PRIVATE_KEY="0x..."
 *   node scripts/deploy-pay-request.mjs
 */
import { createWalletClient, createPublicClient, http, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const rpc = process.env.BASE_RPC_URL ?? 'https://mainnet.base.org'
const pk = process.env.DEPLOYER_PRIVATE_KEY

if (!pk) {
  console.error('Set DEPLOYER_PRIVATE_KEY (hex) then re-run.')
  console.error(
    'Fund the deployer with ETH on Base first, then retry.',
  )
  process.exit(1)
}

const artifactPath = resolve(root, 'contracts/out/PayRequest.sol/PayRequest.json')
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
  chain: base,
  transport: http(rpc),
})
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(rpc),
})

const balance = await publicClient.getBalance({ address: account.address })
console.log('Deployer:', account.address)
console.log('Balance:', formatEther(balance), 'ETH')
if (balance === 0n) {
  console.error('Deployer has 0 ETH. Fund it on Base, then retry.')
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
console.log('PayRequest:', address)

const envPath = resolve(root, '.env.local')
const line = `NEXT_PUBLIC_PAY_REQUEST_ADDRESS=${address}\n`
if (existsSync(envPath)) {
  const prev = readFileSync(envPath, 'utf8')
  if (prev.includes('NEXT_PUBLIC_PAY_REQUEST_ADDRESS=')) {
    writeFileSync(
      envPath,
      prev.replace(
        /NEXT_PUBLIC_PAY_REQUEST_ADDRESS=.*/g,
        `NEXT_PUBLIC_PAY_REQUEST_ADDRESS=${address}`,
      ),
    )
  } else {
    writeFileSync(envPath, prev + (prev.endsWith('\n') ? '' : '\n') + line)
  }
} else {
  writeFileSync(envPath, line)
}
console.log('Wrote', envPath)
