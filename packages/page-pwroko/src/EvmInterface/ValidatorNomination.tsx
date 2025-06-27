// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';

import { Button, Card, Input } from '@polkadot/react-components';
import { useTranslation } from '../translate.js';
import { nominateValidators } from './utils.js';
import type { ContractInstances } from './types.js';

interface Props {
  contracts: ContractInstances;
  account: string;
  txPending: boolean;
}

function ValidatorNomination ({ contracts, account, txPending }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [validatorList, setValidatorList] = useState<string[]>([]);
  const [isNominating, setIsNominating] = useState<boolean>(false);
  const [nominationError, setNominationError] = useState<string>('');
  const [nominationSuccess, setNominationSuccess] = useState<string>('');

  const handleAddValidator = () => {
    const trimmedAddress = currentAddress.trim();
    if (trimmedAddress && !validatorList.includes(trimmedAddress)) {
      setValidatorList([...validatorList, trimmedAddress]);
      setCurrentAddress('');
      // Réinitialiser les messages d'état
      setNominationError('');
      setNominationSuccess('');
    }
  };

  const handleRemoveValidator = (addressToRemove: string) => {
    setValidatorList(validatorList.filter(addr => addr !== addressToRemove));
    // Réinitialiser les messages d'état
    setNominationError('');
    setNominationSuccess('');
  };

  const handleNominate = async () => {
    if (validatorList.length === 0) {
      setNominationError(t('Please add at least one validator'));
      return;
    }

    if (!account) {
      setNominationError(t('No account selected'));
      return;
    }

    setIsNominating(true);
    setNominationError('');
    setNominationSuccess('');

    try {
      console.log('Starting nomination process...');
      const txHash = await nominateValidators(validatorList, account);
      
      setNominationSuccess(t('Nomination transaction sent! Hash: {{hash}}', { replace: { hash: txHash.slice(0, 10) + '...' } }));
      console.log('Nomination successful, transaction hash:', txHash);
      
      // Optionnel: réinitialiser la liste après succès
      // setValidatorList([]);
    } catch (error: any) {
      console.error('Nomination failed:', error);
      setNominationError(t('Nomination failed: {{error}}', { replace: { error: error.message || 'Unknown error' } }));
    } finally {
      setIsNominating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValidator();
    }
  };

  return (
    <Card>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {t('Validator Nomination')}
      </h3>
      <p style={{ 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        color: 'var(--color-text)', 
        opacity: 0.8 
      }}>
        {t('Nominate trusted validators to support the network and earn staking rewards. You must have staked tokens to nominate.')}
      </p>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Messages d'état */}
        {nominationError && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'var(--bg-tabs)', 
            border: '1px solid #e74c3c', 
            borderRadius: '0.25rem',
            color: '#e74c3c'
          }}>
            {nominationError}
          </div>
        )}
        
        {nominationSuccess && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'var(--bg-tabs)', 
            border: '1px solid #27ae60', 
            borderRadius: '0.25rem',
            color: '#27ae60'
          }}>
            {nominationSuccess}
          </div>
        )}

        {/* Add Validator Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            {t('Validator Address')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <Input
                value={currentAddress}
                onChange={setCurrentAddress}
                onKeyPress={handleKeyPress}
                placeholder='0x1234...'
              />
            </div>
            <Button
              icon='plus'
              label={t('Add')}
              onClick={handleAddValidator}
              isDisabled={!currentAddress.trim() || validatorList.includes(currentAddress.trim())}
            />
          </div>
        </div>

        {/* Validator List */}
        {validatorList.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              {t('Selected Validators')} ({validatorList.length})
            </label>
            <div style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: '0.25rem',
              padding: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {validatorList.map((validator, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    borderRadius: '0.125rem'
                  }}
                >
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.9rem',
                    wordBreak: 'break-all',
                    marginRight: '0.5rem'
                  }}>
                    {validator}
                  </span>
                  <Button
                    icon='times'
                    onClick={() => handleRemoveValidator(validator)}
                    isBasic
                    isDisabled={isNominating}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nominate Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            icon='user-check'
            label={isNominating ? t('Nominating...') : t('Nominate Validators')}
            onClick={handleNominate}
            isDisabled={txPending || validatorList.length === 0 || isNominating || !account}
            isBusy={isNominating}
          />
        </div>
      </div>
    </Card>
  );
}

export default React.memo(ValidatorNomination);