// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { ethers } from 'ethers';

import { Button } from '@polkadot/react-components';
import { useTranslation } from '../translate.js';
import { PWROKO_PRECOMPILE_ADDRESS } from './constants.js';
import type { ContractInstances, TxResult } from './types.js';

interface Props {
  contracts: ContractInstances;
  account: string;
  readyUnlockAmount: string | null;
  onSuccess: () => void;
  setError: (error: string) => void;
  setTxResult: (result: TxResult | null) => void;
}

function LockUnlock ({ 
  contracts, 
  account,
  readyUnlockAmount, 
  onSuccess, 
  setError, 
  setTxResult 
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [lockAmount, setLockAmount] = useState<string>('');
  const [unlockAmount, setUnlockAmount] = useState<string>('');
  const [txPending, setTxPending] = useState<boolean>(false);

  const handleLock = async () => {
    if (!lockAmount || !contracts) return;
    
    setError('');
    setTxPending(true);
    setTxResult(null);
    
    try {
      const amountBN = ethers.utils.parseEther(lockAmount.toString());
      const hexAmount = amountBN.toHexString().slice(2).padStart(64, '0');
      const data = `0xf83d08ba${hexAmount}`;
      
      const tx = await contracts.signer.sendTransaction({
        to: PWROKO_PRECOMPILE_ADDRESS,
        data: data,
        gasLimit: 1000000,
        gasPrice: ethers.utils.parseUnits('1', 'gwei')
      });
      
      const receipt = await tx.wait();
      
      setTxResult({
        success: true,
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        message: `Successfully locked ${lockAmount} ROKO tokens to receive pwROKO`
      });
      
      setLockAmount('');
      onSuccess();
    } catch (error: any) {
      setError(`Error during lock: ${error.message}`);
      setTxResult({
        success: false,
        error: error.message
      });
    } finally {
      setTxPending(false);
    }
  };

  const handleUnlockRequest = async () => {
    if (!unlockAmount || !contracts) return;
    
    setError('');
    setTxPending(true);
    setTxResult(null);
    
    try {
      const amountBN = ethers.utils.parseEther(unlockAmount.toString());
      const hexAmount = amountBN.toHexString().slice(2).padStart(64, '0');
      const data = `0x8a4b732f${hexAmount}`;
      
      const tx = await contracts.signer.sendTransaction({
        to: PWROKO_PRECOMPILE_ADDRESS,
        data: data,
        gasLimit: 1000000,
        gasPrice: ethers.utils.parseUnits('1', 'gwei')
      });
      
      const receipt = await tx.wait();
      
      setTxResult({
        success: true,
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        message: `Successfully requested unlock for ${unlockAmount} pwROKO tokens`
      });
      
      setUnlockAmount('');
      onSuccess();
    } catch (error: any) {
      setError(`Error during unlock request: ${error.message}`);
      setTxResult({
        success: false,
        error: error.message
      });
    } finally {
      setTxPending(false);
    }
  };

  const handleCompleteUnlock = async () => {
    if (!contracts) return;
    
    setError('');
    setTxPending(true);
    setTxResult(null);
    
    try {
      const maxRequests = 10;
      const hexMaxRequests = maxRequests.toString(16).padStart(64, '0');
      const data = `0x648e94a1${hexMaxRequests}`;
      
      const tx = await contracts.signer.sendTransaction({
        to: PWROKO_PRECOMPILE_ADDRESS,
        data: data,
        gasLimit: 1000000,
        gasPrice: ethers.utils.parseUnits('1', 'gwei')
      });
      
      const receipt = await tx.wait();
      
      setTxResult({
        success: true,
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        message: 'Successfully completed unlock and received ROKO tokens'
      });
      
      onSuccess();
    } catch (error: any) {
      setError(`Error during unlock completion: ${error.message}`);
      setTxResult({
        success: false,
        error: error.message
      });
    } finally {
      setTxPending(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      flexWrap: 'wrap'
    }}>
      {/* Lock ROKO Action Box */}
      <div style={{
        flex: 1,
        minWidth: '300px',
        padding: '1rem',
        backgroundColor: 'var(--bg-table)',
        borderRadius: '0.25rem'
      }}>
        <h3 style={{ margin: '0 0 1rem', textAlign: 'center' }}>{t('Lock ROKO')}</h3>
        <p style={{ 
          marginBottom: '1rem', 
          color: 'var(--color-text)', 
          opacity: 0.8,
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {t('Lock your ROKO tokens to receive pwROKO tokens that can be used for staking and governance.')}
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {t('Lock Amount (ROKO)')}
          </label>
          <input
            type='number'
            value={lockAmount}
            onChange={(e) => setLockAmount(e.target.value)}
            min='0'
            step='0.001'
            placeholder='0.0'
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.25rem',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            icon='lock'
            label={txPending ? t('Transaction in progress...') : t('Lock ROKO')}
            onClick={handleLock}
            isDisabled={txPending || !lockAmount}
          />
        </div>
      </div>
      
      {/* Unlock pwROKO Action Box */}
      <div style={{
        flex: 1,
        minWidth: '300px',
        padding: '1rem',
        backgroundColor: 'var(--bg-table)',
        borderRadius: '0.25rem'
      }}>
        <h3 style={{ margin: '0 0 1rem', textAlign: 'center' }}>{t('Unlock pwROKO')}</h3>
        <p style={{ 
          marginBottom: '1rem', 
          color: 'var(--color-text)', 
          opacity: 0.8,
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {t('Request to unlock your pwROKO tokens back to ROKO. There is a cooldown period before completion.')}
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {t('Unlock Amount (pwROKO)')}
          </label>
          <input
            type='number'
            value={unlockAmount}
            onChange={(e) => setUnlockAmount(e.target.value)}
            min='0'
            step='0.001'
            placeholder='0.0'
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.25rem',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <Button
            icon='clock'
            label={t('Request')}
            onClick={handleUnlockRequest}
            isDisabled={txPending || !unlockAmount}
          />
          <Button
            icon='unlock'
            label={t('Complete')}
            onClick={handleCompleteUnlock}
            isDisabled={txPending || !readyUnlockAmount || parseFloat(readyUnlockAmount) <= 0}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(LockUnlock);