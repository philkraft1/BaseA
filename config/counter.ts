/**
 * Set after deploying contracts/src/Counter.sol to Base Sepolia.
 * Replace with the forge create address (and redeploy on mainnet cutover).
 */
export const COUNTER_ADDRESS =
  (process.env.NEXT_PUBLIC_COUNTER_ADDRESS as `0x${string}` | undefined) ??
  ('0x0000000000000000000000000000000000000000' as const)

export const counterAbi = [
  {
    type: 'function',
    name: 'number',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'increment',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setNumber',
    inputs: [{ name: 'newNumber', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const
