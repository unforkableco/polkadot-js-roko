// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect, useCallback } from 'react';

import { styled } from '@polkadot/react-components/styled';
import { useApi } from '@polkadot/react-hooks';
import { useTranslation } from '../translate.js';

import WalletConnection from './WalletConnection.js';
import BalanceDisplay from './BalanceDisplay.js';
import Faucet from './Faucet.js';
import LockUnlock from './LockUnlock.js';
import Staking from './Staking.js';
import ValidatorNomination from './ValidatorNomination.js';
import TransactionResult from './TransactionResult.js';
import { getRokoBalance, getDetailedRokoBalances, getPwRokoBalance, getUnlockAmounts, getStakedAmount, getStakedAmountSubstrate, getDelegatedAmount, getAllPwRokoBalancesWithStaking } from './utils.js';
import type { ContractInstances, TxResult, Balances } from './types.js';

interface Props {
  className?: string;
}

function EvmInterface ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api } = useApi();
  
  // Connection state
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [contracts, setContracts] = useState<ContractInstances | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  
  // UI state
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  
  // Balances - NOUVELLE STRUCTURE COMPLÈTE
  const [balances, setBalances] = useState<Balances>({
    rokoBalance: null,
    rokoFreeBalance: null,
    rokoReservedBalance: null,
    rokoTotalBalance: null,
    pwRokoBalance: null,
    // Détails des balances pwROKO
    freeAmount: null,
    // Détails du staking via API Polkadot.js
    bondedAmount: null,
    unbondingAmount: null,
    redeemableAmount: null,
    // Conversion pwROKO -> ROKO
    pendingConversionAmount: null,
    readyConversionAmount: null,
    // Unlock général
    pendingUnlockAmount: null,
    readyUnlockAmount: null,
    // Legacy/autres
    stakedAmount: null,
    delegatedAmount: null,
          // Total calculé
      totalOwned: null,
      // Informations de nomination
      hasNominations: false,
      nominatedValidators: []
    });

  const refreshBalances = useCallback(async () => {
    if (!account || !isConnected) return;
    
    console.log('🔄 Refreshing all balances with NEW structure...');
    
    try {
      // Récupérer les balances ROKO (inchangé)
      const rokoBalance = await getRokoBalance(account);
      const detailedBalances = await getDetailedRokoBalances(account, api);
      const pwRokoBalance = await getPwRokoBalance(account);
      
      // ✅ UTILISER LA NOUVELLE FONCTION pour récupérer toutes les balances pwROKO avec staking
      const pwRokoBalances = await getAllPwRokoBalancesWithStaking(account, api);
      
      // Récupérer la délégation (ancien système, gardé pour compatibilité)
      const delegatedAmount = await getDelegatedAmount(account);
      
      console.log('✅ New balance structure loaded:', pwRokoBalances);
      
      setBalances({
        rokoBalance,
        rokoFreeBalance: detailedBalances.free,
        rokoReservedBalance: detailedBalances.reserved,
        rokoTotalBalance: detailedBalances.total,
        pwRokoBalance,
        // Détails des balances pwROKO
        freeAmount: pwRokoBalances.freeAmount,
        // Détails du staking via API Polkadot.js
        bondedAmount: pwRokoBalances.bondedAmount,
        unbondingAmount: pwRokoBalances.unbondingAmount,
        redeemableAmount: pwRokoBalances.redeemableAmount,
        // Conversion pwROKO -> ROKO
        pendingConversionAmount: pwRokoBalances.pendingConversionAmount,
        readyConversionAmount: pwRokoBalances.readyConversionAmount,
        // Unlock général
        pendingUnlockAmount: pwRokoBalances.pendingUnlockAmount,
        readyUnlockAmount: pwRokoBalances.readyUnlockAmount,
        // Legacy/autres (pour compatibilité)
        stakedAmount: pwRokoBalances.bondedAmount, // bondedAmount pour stakedAmount legacy
        delegatedAmount,
        // Total calculé
        totalOwned: pwRokoBalances.totalOwned,
        // Informations de nomination
        hasNominations: pwRokoBalances.hasNominations,
        nominatedValidators: pwRokoBalances.nominatedValidators
      });
    } catch (error) {
      console.error('❌ Error refreshing balances:', error);
      setError(`Error loading balances: ${error}`);
    }
  }, [account, api, isConnected]);

  const handleWalletConnected = useCallback((walletAccount: string, contractInstances: ContractInstances, network: any) => {
    setAccount(walletAccount);
    setIsConnected(true);
    setContracts(contractInstances);
    setNetworkInfo(network);
  }, []);

  const handleWalletDisconnected = useCallback(() => {
    setAccount('');
    setIsConnected(false);
    setContracts(null);
    setNetworkInfo(null);
    setError('');
    setBalances({
      rokoBalance: null,
      rokoFreeBalance: null,
      rokoReservedBalance: null,
      rokoTotalBalance: null,
      pwRokoBalance: null,
      // Détails des balances pwROKO
      freeAmount: null,
      // Détails du staking via API Polkadot.js
      bondedAmount: null,
      unbondingAmount: null,
      redeemableAmount: null,
      // Conversion pwROKO -> ROKO
      pendingConversionAmount: null,
      readyConversionAmount: null,
      // Unlock général
      pendingUnlockAmount: null,
      readyUnlockAmount: null,
      // Legacy/autres
      stakedAmount: null,
      delegatedAmount: null,
      // Total calculé
      totalOwned: null,
      // Informations de nomination
      hasNominations: false,
      nominatedValidators: []
    });
  }, []);

  // Load balances when connected
  useEffect(() => {
    if (isConnected && account) {
      refreshBalances();
    }
  }, [isConnected, account, refreshBalances]);

  // Auto-refresh balances after successful transaction
  const handleTransactionSuccess = useCallback(() => {
    setTimeout(() => {
      refreshBalances();
    }, 2000);
  }, [refreshBalances]);

  return (
    <StyledDiv className={className}>
      <div className='evm-interface'>
        <div className='header'>
        <h1>{'EVM Interface - Ethereum Wallet 🚀'}</h1>
        <p>{t('Connect your MetaMask wallet and interact with pwROKO via EVM')}</p>
        </div>

        <WalletConnection
          account={account}
          isConnected={isConnected}
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
          error={error}
          loading={loading}
          setError={setError}
          setLoading={setLoading}
        />

        {isConnected && contracts && (
          <>
            <BalanceDisplay 
              balances={balances}
              onRefresh={refreshBalances}
            />
            
            <Faucet
              account={account}
              onSuccess={handleTransactionSuccess}
              setError={setError}
            />
            
            <LockUnlock
              contracts={contracts}
              account={account}
              readyUnlockAmount={balances.readyUnlockAmount}
              onSuccess={handleTransactionSuccess}
              setError={setError}
              setTxResult={setTxResult}
            />
            
            <Staking
              contracts={contracts}
              account={account}
              readyWithdrawAmount={balances.redeemableAmount}
              onSuccess={handleTransactionSuccess}
              setError={setError}
              setTxResult={setTxResult}
            />
            
            <ValidatorNomination
              contracts={contracts}
              account={account}
              txPending={txPending}
            />
          </>
        )}

        {txResult && <TransactionResult txResult={txResult} />}
      </div>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  .evm-interface {
    .header {
      margin-bottom: 2rem;
      text-align: center;
      
      h1 {
        margin-bottom: 0.5rem;
        color: var(--color-summary);
      }
      
      p {
        color: var(--color-text);
        opacity: 0.8;
      }
    }
  }
`;

export default React.memo(EvmInterface);