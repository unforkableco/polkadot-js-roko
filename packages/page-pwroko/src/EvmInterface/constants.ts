// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

// pwROKO network configuration
export const PWROKO_NETWORK_CONFIG = {
  chainId: '0x1BA', // 442 in hex - ROKO chain ID
  chainName: 'pwROKO Development',
  rpcUrls: ['http://127.0.0.1:8545'], // EVM RPC endpoint
  nativeCurrency: {
    name: 'ROKO',
    symbol: 'ROKO',
    decimals: 18
  },
  blockExplorerUrls: ['http://127.0.0.1:8545'] // Optional
};

// Test accounts for pwroko (using ALITH and BALTATHAR)
export const TEST_ACCOUNTS = [
  { 
    name: 'ALITH', 
    privateKey: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac'
  },
  { 
    name: 'BALTATHAR', 
    privateKey: '0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b',
    address: '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0'
  }
];

// Precompile addresses
export const STAKING_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000700';
export const PWROKO_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000500';

// ABI definitions
export const stakingAbi = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'payeeType', type: 'uint8' }
    ],
    name: 'bond',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function',
    selector: '0x00000001'
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' }
    ],
    name: 'unbond',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
    selector: '0x00000002'
  }
];

export const pwRokoAbi = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' }
    ],
    name: 'lock',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
    selector: '0xf83d08ba'
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' }
    ],
    name: 'unlockRequest',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
    selector: '0x8a4b732f'
  },
  {
    inputs: [
      { name: 'maxRequests', type: 'uint32' }
    ],
    name: 'completeUnlock',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
    selector: '0x648e94a1'
  },
  {
    inputs: [
      { name: 'account', type: 'address' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    selector: '0x70a08231'
  },
  {
    inputs: [
      { name: 'account', type: 'address' }
    ],
    name: 'pendingUnlockAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    selector: '0xb52c8714'
  },
  {
    inputs: [
      { name: 'account', type: 'address' }
    ],
    name: 'readyUnlockAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    selector: '0x719f25e8'
  },
  {
    inputs: [
      { name: 'account', type: 'address' }
    ],
    name: 'stakedBalanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
    selector: '0x821f56a5'
  }
];