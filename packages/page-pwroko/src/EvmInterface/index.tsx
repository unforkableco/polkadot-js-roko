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
import { getRokoBalance, getDetailedRokoBalances, getPwRokoBalance, getUnlockAmounts, getStakedAmount, getStakedAmountSubstrate, getDelegatedAmount } from './utils.js';
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
  
  // Balances
  const [balances, setBalances] = useState<Balances>({
    rokoBalance: null,
    rokoFreeBalance: null,
    rokoReservedBalance: null,
    rokoTotalBalance: null,
    pwRokoBalance: null,
    pendingUnlockAmount: null,
    readyUnlockAmount: null,
    stakedAmount: null,
    delegatedAmount: null
  });

  const refreshBalances = useCallback(async () => {
    if (!account || !isConnected) return;
    
    console.log('Refreshing all balances...');
    
    const rokoBalance = await getRokoBalance(account);
    const detailedBalances = await getDetailedRokoBalances(account, api);
    const pwRokoBalance = await getPwRokoBalance(account);
    const unlockAmounts = await getUnlockAmounts(account);
    
    // Essaye les deux méthodes pour récupérer les montants stakés
    let stakedAmount = await getStakedAmount(account);
    
    // Si la méthode EVM ne fonctionne pas, essaye la méthode Substrate
    if (stakedAmount === '0' || stakedAmount.startsWith('Error:')) {
      stakedAmount = await getStakedAmountSubstrate(account, api);
      console.log('Debug: Using Substrate API for staked amount:', stakedAmount);
    } else {
      console.log('Debug: Using EVM precompile for staked amount:', stakedAmount);
    }
    
    const delegatedAmount = await getDelegatedAmount(account);
    
    setBalances({
      rokoBalance,
      rokoFreeBalance: detailedBalances.free,
      rokoReservedBalance: detailedBalances.reserved,
      rokoTotalBalance: detailedBalances.total,
      pwRokoBalance,
      pendingUnlockAmount: unlockAmounts.pending,
      readyUnlockAmount: unlockAmounts.ready,
      stakedAmount,
      delegatedAmount
    });
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
      pendingUnlockAmount: null,
      readyUnlockAmount: null,
      stakedAmount: null,
      delegatedAmount: null
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
          <h1>{t('EVM Interface - Ethereum Wallet')}</h1>
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