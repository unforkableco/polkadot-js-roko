// Copyright 2017-2025 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';

import { keyring } from '@polkadot/ui-keyring';

// Standard Ethereum test accounts for pwroko (Moonbeam-style)
export const TEST_ACCOUNTS = [
  { 
    name: 'ALITH', 
    privateKey: '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac' // ALITH address
  },
  { 
    name: 'BALTATHAR', 
    privateKey: '0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b',
    address: '0x3Cd0A705a2DC65e5b1E1205896BaA2be8A07c6e0' // BALTATHAR address
  }
];

export function getTestAccount(address: string): typeof TEST_ACCOUNTS[0] | undefined {
  return TEST_ACCOUNTS.find(acc => 
    acc.address.toLowerCase() === address.toLowerCase()
  );
}

export function ensureTestAccountExists(address: string): KeyringPair | null {
  const testAccount = getTestAccount(address);
  
  if (!testAccount) {
    console.log(`Address ${address} is not a known test account`);
    return null;
  }

  try {
    // Try to get existing pair by address
    const pair = keyring.getPair(testAccount.address);
    console.log(`Found existing test account ${testAccount.name}`);
    return pair;
  } catch {
    // Create the pair if it doesn't exist
    try {
      console.log(`Creating test account ${testAccount.name} from private key`);
      
      // Check if keyring is ready
      if (!keyring.isAvailable) {
        console.error('Keyring is not available for test account creation');
        return null;
      }
      
      // Create from private key (Ethereum style)
      const pair = keyring.addUri(testAccount.privateKey, '', { name: testAccount.name, isLocal: true }, 'ethereum').pair;
      
      console.log(`Created test account ${testAccount.name} (${testAccount.address})`);
      return pair;
      
    } catch (e) {
      console.error(`Failed to create test account ${testAccount.name}:`, e);
      return null;
    }
  }
}