// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { ethers } from 'ethers';

import { Button, Card } from '@polkadot/react-components';
import { useTranslation } from '../translate.js';
import { PWROKO_NETWORK_CONFIG, STAKING_PRECOMPILE_ADDRESS, PWROKO_PRECOMPILE_ADDRESS, stakingAbi, pwRokoAbi } from './constants.js';
import type { ContractInstances } from './types.js';

interface Props {
  account: string;
  isConnected: boolean;
  onWalletConnected: (account: string, contracts: ContractInstances, networkInfo: any) => void;
  onWalletDisconnected: () => void;
  error: string;
  loading: boolean;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

function WalletConnection ({ 
  account, 
  isConnected, 
  onWalletConnected, 
  onWalletDisconnected, 
  error, 
  loading,
  setError,
  setLoading 
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const addOrSwitchToNetwork = async () => {
    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PWROKO_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [PWROKO_NETWORK_CONFIG],
          });
        } catch (addError: any) {
          throw new Error(`Failed to add pwROKO network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch to pwROKO network: ${switchError.message}`);
      }
    }
  };

  const connectWallet = async () => {
    setError('');
    setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask extension.');
      }

      await addOrSwitchToNetwork();
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      if (network.chainId !== parseInt(PWROKO_NETWORK_CONFIG.chainId, 16)) {
        throw new Error(`Please switch to pwROKO network (Chain ID: ${parseInt(PWROKO_NETWORK_CONFIG.chainId, 16)})`);
      }

      // Create contract instances
      const stakingContract = new ethers.Contract(
        STAKING_PRECOMPILE_ADDRESS,
        stakingAbi,
        signer
      );
      
      const pwRokoContract = new ethers.Contract(
        PWROKO_PRECOMPILE_ADDRESS,
        pwRokoAbi,
        signer
      );
      
      const contractInstances: ContractInstances = {
        staking: stakingContract,
        pwRoko: pwRokoContract,
        provider,
        signer
      };

      onWalletConnected(address, contractInstances, network);
      
    } catch (error: any) {
      setError(`Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>{t('Wallet Connection')}</h3>
      
      {!isConnected ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text)', opacity: 0.8 }}>
            {t('Connect your MetaMask wallet to access EVM functionality')}
          </p>
          <Button
            icon='plug'
            isBusy={loading}
            label={t('Connect MetaMask')}
            onClick={connectWallet}
          />
        </div>
      ) : (
        <div>
          <div style={{ 
            marginBottom: '1rem',
            padding: '1.5rem', 
            backgroundColor: 'var(--bg-table)', 
            borderRadius: '0.25rem',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{t('Connected Account: ')}</strong>
              <span style={{ fontFamily: 'monospace' }}>{account}</span>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button
              icon='times'
              label={t('Disconnect')}
              onClick={onWalletDisconnected}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: 'var(--color-error)', 
          marginTop: '1rem',
          padding: '0.5rem',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '0.25rem',
          textAlign: 'center'
        }}>
          <p>{error}</p>
        </div>
      )}
    </Card>
  );
}

export default React.memo(WalletConnection);