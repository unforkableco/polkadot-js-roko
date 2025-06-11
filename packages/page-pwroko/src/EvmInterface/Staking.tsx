// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { ethers } from 'ethers';

import { Button, Dropdown } from '@polkadot/react-components';
import { useTranslation } from '../translate.js';
import { STAKING_PRECOMPILE_ADDRESS } from './constants.js';
import type { ContractInstances, TxResult } from './types.js';

interface Props {
  contracts: ContractInstances;
  account: string;
  readyWithdrawAmount: string | null;
  onSuccess: () => void;
  setError: (error: string) => void;
  setTxResult: (result: TxResult | null) => void;
}

function Staking ({ 
  contracts, 
  account, 
  readyWithdrawAmount,
  onSuccess, 
  setError, 
  setTxResult 
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [bondAmount, setBondAmount] = useState<string>('');
  const [unbondAmount, setUnbondAmount] = useState<string>('');
  const [payeeType, setPayeeType] = useState<number>(0); // Default: Staked
  const [txPending, setTxPending] = useState<boolean>(false);

  // Options pour le type de récompense basées sur le code Rust
  const payeeOptions = [
    { text: t('Staked - Rewards automatically staked'), value: 0 },
    { text: t('Stash - Rewards to stash account'), value: 1 },
    { text: t('Account - Rewards to controller account'), value: 2 }
  ];

  const handleBond = async () => {
    if (!bondAmount || !contracts) return;
    
    setError('');
    setTxPending(true);
    setTxResult(null);
    
    try {
      const amountBN = ethers.utils.parseEther(bondAmount.toString());
      const hexAmount = amountBN.toHexString().slice(2).padStart(64, '0');
      const hexPayeeType = payeeType.toString(16).padStart(2, '0'); // Convert payeeType to hex with 2 chars
      
      // Construction correcte: selector (8) + amount (64) + payeeType (2) = 74 chars total
      const bondData = `0x00000001${hexAmount}${hexPayeeType}`;
      
      console.log('Bond data length:', bondData.length); // Should be 74
      console.log('Bond data:', bondData);
      console.log('Amount:', bondAmount, 'PayeeType:', payeeType);
      
      const tx = await contracts.signer.sendTransaction({
        to: STAKING_PRECOMPILE_ADDRESS,
        data: bondData,
        gasLimit: 2000000, // Increased gas limit
        gasPrice: ethers.utils.parseUnits('10', 'gwei') // Increased gas price
      });
      
      const receipt = await tx.wait();
      
      setTxResult({
        success: true,
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        message: `Successfully bonded ${bondAmount} ROKO tokens for staking with ${payeeOptions[payeeType].text}`
      });
      
      setBondAmount('');
      onSuccess();
    } catch (error: any) {
      setError(`Error during bond: ${error.message}`);
      setTxResult({
        success: false,
        error: error.message
      });
    } finally {
      setTxPending(false);
    }
  };

  const handleUnbond = async () => {
    if (!unbondAmount || !contracts) return;
    
    setError('');
    setTxPending(true);
    setTxResult(null);
    
    try {
      const amountBN = ethers.utils.parseEther(unbondAmount.toString());
      const hexAmount = amountBN.toHexString().slice(2).padStart(64, '0');
      
      // Pour unbond, pas de payeeType requis - selector (8) + amount (64) = 72 chars total
      const data = `0x00000002${hexAmount}`;
      
      console.log('Unbond data length:', data.length); // Should be 72
      console.log('Unbond data:', data);
      
      const tx = await contracts.signer.sendTransaction({
        to: STAKING_PRECOMPILE_ADDRESS,
        data: data,
        gasLimit: 2000000, // Increased gas limit
        gasPrice: ethers.utils.parseUnits('10', 'gwei') // Increased gas price
      });
      
      const receipt = await tx.wait();
      
      setTxResult({
        success: true,
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        message: `Successfully unbonded ${unbondAmount} pwROKO tokens`
      });
      
      setUnbondAmount('');
      onSuccess();
    } catch (error: any) {
      setError(`Error during unbond: ${error.message}`);
      setTxResult({
        success: false,
        error: error.message
      });
    } finally {
      setTxPending(false);
    }
  };

  const handleWithdrawUnbonded = async () => {
    if (!contracts) return;
    
    setError('');
    setTxPending(true);
    setTxResult(null);
    
    try {
      // WITHDRAW_UNBONDED selector - pas de paramètres requis
      const data = `0x00000004`;
      
      console.log('Withdraw unbonded data:', data);
      
      const tx = await contracts.signer.sendTransaction({
        to: STAKING_PRECOMPILE_ADDRESS,
        data: data,
        gasLimit: 2000000, // Increased gas limit
        gasPrice: ethers.utils.parseUnits('10', 'gwei') // Increased gas price
      });
      
      const receipt = await tx.wait();
      
      setTxResult({
        success: true,
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        message: 'Successfully withdrew unbonded pwROKO tokens'
      });
      
      onSuccess();
    } catch (error: any) {
      setError(`Error during withdraw unbonded: ${error.message}`);
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
      {/* Bond pwROKO Action Box */}
      <div style={{
        flex: 1,
        minWidth: '300px',
        padding: '1rem',
        backgroundColor: 'var(--bg-table)',
        borderRadius: '0.25rem'
      }}>
        <h3 style={{ margin: '0 0 1rem', textAlign: 'center' }}>{t('Bond pwROKO')}</h3>
        <p style={{ 
          marginBottom: '1rem', 
          color: 'var(--color-text)', 
          opacity: 0.8,
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {t('Bond pwROKO tokens to participate in network staking and earn rewards as a validator or nominator.')}
        </p>
        
        {/* Amount Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {t('Amount to bond:')}
          </label>
          <input
            type='number'
            value={bondAmount}
            onChange={(e) => setBondAmount(e.target.value)}
            min='0'
            step='0.000001'
            placeholder={t("Enter amount in pwROKO")}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--color-text)'
            }}
          />
        </div>

        {/* Payee Type Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {t('Reward Destination')}
          </label>
          <Dropdown
            options={payeeOptions}
            value={payeeType}
            onChange={setPayeeType}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            icon='lock'
            label={txPending ? t('Transaction in progress...') : t('Bond')}
            onClick={handleBond}
            isDisabled={txPending || !bondAmount || parseFloat(bondAmount) <= 0}
          />
        </div>
      </div>
      
      {/* Unbond Action Box */}
      <div style={{
        flex: 1,
        minWidth: '300px',
        padding: '1rem',
        backgroundColor: 'var(--bg-table)',
        borderRadius: '0.25rem'
      }}>
        <h3 style={{ margin: '0 0 1rem', textAlign: 'center' }}>{t('Unbond pwROKO')}</h3>
        <p style={{ 
          marginBottom: '1rem', 
          color: 'var(--color-text)', 
          opacity: 0.8,
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {t('Unbond your staked tokens. There is a waiting period before you can withdraw your tokens.')}
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {t('Amount to unbond:')}
          </label>
          <input
            type='number'
            value={unbondAmount}
            onChange={(e) => setUnbondAmount(e.target.value)}
            min='0'
            step='0.000001'
            placeholder={t("Enter amount in pwROKO")}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--color-text)'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <Button
            icon='unlock'
            label={txPending ? t('Transaction in progress...') : t('Unbond')}
            onClick={handleUnbond}
            isDisabled={txPending || !unbondAmount || parseFloat(unbondAmount) <= 0}
            style={{ flex: 1, minWidth: '120px' }}
          />
          
          {readyWithdrawAmount && parseFloat(readyWithdrawAmount) > 0 && (
            <Button
              icon='check'
              label={t('Complete')}
              onClick={handleWithdrawUnbonded}
              isDisabled={txPending}
              style={{ 
                flex: 1, 
                minWidth: '120px',
                backgroundColor: '#4CAF50',
                borderColor: '#4CAF50'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Staking);