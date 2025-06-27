// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ethers } from 'ethers';

export interface ContractInstances {
  staking: ethers.Contract;
  pwRoko: ethers.Contract;
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
}

export interface TxResult {
  success: boolean;
  hash?: string;
  blockNumber?: number;
  message?: string;
  error?: string;
}

export interface Balances {
  rokoBalance: string | null;
  rokoFreeBalance: string | null;
  rokoReservedBalance: string | null;
  rokoTotalBalance: string | null;
  pwRokoBalance: string | null;
  
  // Détails des balances pwROKO
  freeAmount: string | null;
  
  // Détails du staking via API Polkadot.js
  bondedAmount: string | null;        // Montant bondé (actif dans le staking)
  unbondingAmount: string | null;     // Montant en période d'unbonding
  redeemableAmount: string | null;    // Montant prêt à être récupéré du staking
  
  // Conversion pwROKO -> ROKO
  pendingConversionAmount: string | null;  // En attente de conversion
  readyConversionAmount: string | null;    // Prêt à être converti
  
  // Unlock général
  pendingUnlockAmount: string | null;
  readyUnlockAmount: string | null;
  
  // Legacy/autres
  stakedAmount: string | null;
  delegatedAmount: string | null;
  
  // Total calculé
  totalOwned: string | null;
  
  // Informations de nomination
  hasNominations: boolean;
  nominatedValidators: string[];
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}