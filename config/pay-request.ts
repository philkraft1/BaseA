import { ZERO_ADDRESS } from './network'

export const PAY_REQUEST_ADDRESS =
  (process.env.NEXT_PUBLIC_PAY_REQUEST_ADDRESS as `0x${string}` | undefined) ??
  ZERO_ADDRESS

export const isPayRequestDeployed = PAY_REQUEST_ADDRESS !== ZERO_ADDRESS

export const payRequestAbi = [
  {
    type: 'function',
    name: 'createRequest',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'payer', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'memo', type: 'string' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pay',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getRequest',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'payee', type: 'address' },
          { name: 'payer', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'memo', type: 'string' },
          { name: 'paid', type: 'bool' },
          { name: 'paidBy', type: 'address' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'nextId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'usdc',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'RequestCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'memo', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RequestPaid',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'paidBy', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const
