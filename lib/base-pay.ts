import { getPaymentStatus, pay } from '@base-org/account'
import { DATA_SUFFIX } from '@/config/builder-code'
import { APP_CHAIN_ID } from '@/config/network'

const TESTNET = APP_CHAIN_ID !== 8453

export function isBasePayTestnet() {
  return TESTNET
}

export async function sendUsdcWithBasePay(args: {
  amount: string
  to: `0x${string}`
}) {
  return pay({
    amount: args.amount,
    to: args.to,
    testnet: TESTNET,
    ...(DATA_SUFFIX ? { dataSuffix: DATA_SUFFIX } : {}),
  })
}

export async function waitForBasePayment(id: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const status = await getPaymentStatus({ id, testnet: TESTNET })
    if (
      status.status === 'completed' ||
      status.status === 'failed' ||
      status.status === 'not_found'
    ) {
      return status
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  return getPaymentStatus({ id, testnet: TESTNET })
}
