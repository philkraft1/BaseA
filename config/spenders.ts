import { PAY_REQUEST_ADDRESS } from '@/config/pay-request'

/** Spenders we check for leftover USDC allowances. User picks what to revoke. */
export const KNOWN_USDC_SPENDERS: { name: string; address: `0x${string}` }[] = [
  { name: 'Float PayRequest', address: PAY_REQUEST_ADDRESS },
  {
    name: 'Permit2',
    address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
  {
    name: 'Uniswap Universal Router',
    address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  },
]
