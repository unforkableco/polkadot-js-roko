// Copyright 2017-2025 @polkadot/react-hooks authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useState } from 'react';

import type { Hash } from '@polkadot/types/interfaces';

import { useApi } from './useApi.js';

interface TemporalTransactionMetadata {
  nanoTimestamp: string;
  timerpcSignature: string;
  timerpcKeyId: number;
  temporalProof: string;
}

interface BlockTimeMetadata {
  blockHash: string;
  blockNumber: number;
  timestamp: string;
  temporalProof?: string;
  timeRpcSignature?: string;
  keyId?: number;
  isTemporalBlock: boolean;
  temporalTransactions: number;
  nonTemporalTransactions: number;
  watermark?: string;
  error?: string;
  temporalTxHashes?: string[];
}

interface UseBlockTimeMetadata {
  getBlockTimeMetadata: (blockHash: string | Hash, txHashes: string[]) => Promise<BlockTimeMetadata | null>;
  getTransactionTimeMetadata: (txHash: string | Hash) => Promise<TemporalTransactionMetadata | null>;
  getTemporalWatermark: () => Promise<string | null>;
  isLoading: boolean;
}

export function useBlockTimeMetadata (): UseBlockTimeMetadata {
  useApi(); // keep hook ordering; API not used when RPC disabled
  const [isLoading, setIsLoading] = useState(false);

  const getTransactionTimeMetadata = useCallback(async (_txHash: string | Hash): Promise<TemporalTransactionMetadata | null> => {
    // Disabled: temporal transaction metadata is derived from events elsewhere
    return null;
  }, []);

  const getTemporalWatermark = useCallback(async (): Promise<string | null> => {
    // Optional RPC disabled for now
    return null;
  }, []);

  const getBlockTimeMetadata = useCallback(async (_blockHash: string | Hash, _txHashes: string[]): Promise<BlockTimeMetadata | null> => {
    // Disabled: block temporal metadata is displayed via events; avoid RPC calls
    setIsLoading(false);
    return null;
  }, []);

  return {
    getBlockTimeMetadata,
    getTransactionTimeMetadata,
    getTemporalWatermark,
    isLoading
  };
} 