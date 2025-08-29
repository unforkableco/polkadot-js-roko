// Copyright 2017-2025 @polkadot/react-hooks authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from 'react';

import { useApi } from './useApi.js';

interface TemporalPalletStatus {
  isAvailable: boolean;
  availableMethods: string[];
  availableQueries: string[];
  rpcSections: string[];
  querySections: string[];
  error?: string;
}

export function useTemporalPalletCheck (): TemporalPalletStatus & { checkTemporalPallet: () => void } {
  const { api } = useApi();
  const [status, setStatus] = useState<TemporalPalletStatus>({
    isAvailable: false,
    availableMethods: [],
    availableQueries: [],
    rpcSections: [],
    querySections: []
  });

  const checkTemporalPallet = useCallback(() => {
    console.log('=== TEMPORAL PALLET DIAGNOSTIC ===');
    
    try {
      // Check RPC sections
      const rpcSections = Object.keys(api.rpc);
      console.log('Available RPC sections:', rpcSections);
      
      // Check query sections  
      const querySections = Object.keys(api.query);
      console.log('Available query sections:', querySections);
      
      // Check for temporal in RPC
      const hasTemporalRpc = !!(api.rpc as any).temporal;
      console.log('Has temporal RPC section:', hasTemporalRpc);
      
      let temporalRpcMethods: string[] = [];
      if (hasTemporalRpc) {
        temporalRpcMethods = Object.keys((api.rpc as any).temporal);
        console.log('Temporal RPC methods:', temporalRpcMethods);
      }
      
      // Check for temporal in queries
      const hasTemporalQuery = !!(api.query as any).temporal || !!(api.query as any).temporalTransactions;
      console.log('Has temporal query section:', hasTemporalQuery);
      
      let temporalQueryMethods: string[] = [];
      if ((api.query as any).temporal) {
        temporalQueryMethods = Object.keys((api.query as any).temporal);
        console.log('Temporal query methods:', temporalQueryMethods);
      } else if ((api.query as any).temporalTransactions) {
        temporalQueryMethods = Object.keys((api.query as any).temporalTransactions);
        console.log('TemporalTransactions query methods:', temporalQueryMethods);
      }
      
      // Check runtime metadata
      console.log('Runtime metadata sections:', api.runtimeMetadata?.asLatest?.pallets?.map(p => p.name.toString()) || 'not available');
      
      // Check for specific methods we need
      const hasRequiredMethods = !!(api.rpc as any).temporal?.temporal_getBlockMetadata &&
                                 !!(api.rpc as any).temporal?.temporal_getBlockTransactions &&
                                 !!(api.rpc as any).temporal?.temporal_getBlocksMetadata;
                                 
      console.log('Has required RPC methods:', hasRequiredMethods);
      console.log('- temporal_getBlockMetadata:', !!(api.rpc as any).temporal?.temporal_getBlockMetadata);
      console.log('- temporal_getBlockTransactions:', !!(api.rpc as any).temporal?.temporal_getBlockTransactions);
      console.log('- temporal_getBlocksMetadata:', !!(api.rpc as any).temporal?.temporal_getBlocksMetadata);
      
      setStatus({
        isAvailable: hasRequiredMethods,
        availableMethods: temporalRpcMethods,
        availableQueries: temporalQueryMethods,
        rpcSections,
        querySections,
        error: hasRequiredMethods ? undefined : 'Required temporal methods not found'
      });
      
      console.log('=== END TEMPORAL PALLET DIAGNOSTIC ===');
      
    } catch (error) {
      console.error('Error checking temporal pallet:', error);
      setStatus(prev => ({
        ...prev,
        error: (error as Error).message
      }));
    }
  }, [api]);

  useEffect(() => {
    checkTemporalPallet();
  }, [checkTemporalPallet]);

  return {
    ...status,
    checkTemporalPallet
  };
} 