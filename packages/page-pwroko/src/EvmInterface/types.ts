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
  pendingUnlockAmount: string | null;
  readyUnlockAmount: string | null;
  stakedAmount: string | null;
  delegatedAmount: string | null;
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