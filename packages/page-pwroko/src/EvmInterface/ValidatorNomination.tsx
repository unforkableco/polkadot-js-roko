// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';

import { Button, Card, Input } from '@polkadot/react-components';
import { useTranslation } from '../translate.js';
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

  const handleAddValidator = () => {
    const trimmedAddress = currentAddress.trim();
    if (trimmedAddress && !validatorList.includes(trimmedAddress)) {
      setValidatorList([...validatorList, trimmedAddress]);
      setCurrentAddress('');
    }
  };

  const handleRemoveValidator = (addressToRemove: string) => {
    setValidatorList(validatorList.filter(addr => addr !== addressToRemove));
  };

  const handleNominate = () => {
    if (validatorList.length > 0) {
      // TODO: Implement nomination logic with precompile
      console.log('Nominating validators:', validatorList);
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
            label={t('Nominate Validators')}
            onClick={handleNominate}
            isDisabled={txPending || validatorList.length === 0}
          />
        </div>
      </div>
    </Card>
  );
}

export default React.memo(ValidatorNomination);