import { createPublicClient, http, type Address, type Hex, encodeFunctionData } from 'viem'
import { APP_CHAIN_ID, RPC_URL, appChain } from '@/config/network'
import {
  CDP_WALLET_NAME,
  STANDING_ORDER_ADDRESS,
  standingOrderAbi,
} from '@/config/standing-order'
import { appendBuilderCode } from '@/lib/attribution'

export const SUBSCRIPTION_TESTNET = false

function hasCdpCreds() {
  return Boolean(
    process.env.CDP_API_KEY_ID &&
      process.env.CDP_API_KEY_SECRET &&
      process.env.CDP_WALLET_SECRET,
  )
}

export function cdpConfigured() {
  return hasCdpCreds()
}

export async function getSubscriptionOwner() {
  if (!hasCdpCreds()) {
    return { configured: false as const, address: null as Address | null }
  }
  const { base } = await import('@base-org/account/node')
  const wallet = await base.subscription.getOrCreateSubscriptionOwnerWallet({
    walletName: CDP_WALLET_NAME,
  })
  return { configured: true as const, address: wallet.address }
}

export function formatChargeAmount(amount: bigint) {
  const padded = amount.toString().padStart(7, '0')
  const whole = padded.slice(0, -6) || '0'
  const frac = padded.slice(-6).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}

export async function chargeOrder(args: {
  subscriptionId: Hex
  amount: bigint
  payee: Address
  payer: Address
}) {
  const { base } = await import('@base-org/account/node')
  const result = await base.subscription.charge({
    id: args.subscriptionId,
    amount: formatChargeAmount(args.amount),
    recipient: args.payee,
    expectedPayer: args.payer,
    testnet: SUBSCRIPTION_TESTNET,
    walletName: CDP_WALLET_NAME,
    paymasterUrl: process.env.PAYMASTER_URL,
    rpcUrl: RPC_URL,
  })
  return result
}

export async function recordPaymentOnchain(orderId: bigint, amount: bigint) {
  if (!hasCdpCreds() || STANDING_ORDER_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return { skipped: true as const }
  }
  const { CdpClient } = await import('@coinbase/cdp-sdk')
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  })
  const eoa = await cdp.evm.getOrCreateAccount({ name: CDP_WALLET_NAME })
  const smart = await cdp.evm.getOrCreateSmartAccount({
    name: CDP_WALLET_NAME,
    owner: eoa,
  })
  const data = appendBuilderCode(
    encodeFunctionData({
      abi: standingOrderAbi,
      functionName: 'recordPayment',
      args: [orderId, amount],
    }),
  )
  const network = APP_CHAIN_ID === 8453 ? 'base' : 'base-sepolia'
  const op = await cdp.evm.sendUserOperation({
    smartAccount: smart,
    network,
    calls: [{ to: STANDING_ORDER_ADDRESS, data, value: BigInt(0) }],
    paymasterUrl: process.env.PAYMASTER_URL,
  })
  return { skipped: false as const, userOpHash: op.userOpHash }
}

export function chainPublicClient() {
  return createPublicClient({
    chain: appChain,
    transport: http(RPC_URL),
  })
}
