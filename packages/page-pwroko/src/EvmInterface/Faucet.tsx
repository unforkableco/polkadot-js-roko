// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { Card, TxButton } from '@polkadot/react-components';
import { useApi } from '@polkadot/react-hooks';
import { BN } from '@polkadot/util';
import { keyring } from '@polkadot/ui-keyring';
import { useTranslation } from '../translate.js';
import { TEST_ACCOUNTS } from './constants.js';

interface Props {
  account: string;
  onSuccess: () => void;
  setError: (error: string) => void;
}

function Faucet ({ account, onSuccess, setError }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api } = useApi();

  const createTestAccountIfNeeded = (testAccount: typeof TEST_ACCOUNTS[0]) => {
    try {
      if (!keyring.isAvailable) {
        console.error('Keyring is not available');
        return null;
      }

      try {
        const existingPair = keyring.getPair(testAccount.address);
        console.log(`Found existing test account ${testAccount.name}`);
        return testAccount.address;
      } catch {
        console.log(`Creating test account ${testAccount.name} from private key`);
        const pair = keyring.addUri(testAccount.privateKey, '', { name: testAccount.name, isLocal: true }, 'ethereum');
        console.log(`Created test account ${testAccount.name} (${testAccount.address})`);
        return testAccount.address;
      }
    } catch (error) {
      console.error(`Failed to create/get test account ${testAccount.name}:`, error);
      return null;
    }
  };

  const createFaucetTx = (amount: string, testAccount: typeof TEST_ACCOUNTS[0]) => {
    const fromAddress = createTestAccountIfNeeded(testAccount);
    
    if (!fromAddress) {
      console.error(`Cannot create test account ${testAccount.name}`);
      return null;
    }

    try {
      if (api?.tx?.balances?.transferKeepAlive) {
        return api.tx.balances.transferKeepAlive(account, new BN(amount).mul(new BN('1000000000000000000')));
      } else if (api?.tx?.balances?.transferAllowDeath) {
        return api.tx.balances.transferAllowDeath(account, new BN(amount).mul(new BN('1000000000000000000')));
      } else if (api?.tx?.balances?.transfer) {
        return api.tx.balances.transfer(account, new BN(amount).mul(new BN('1000000000000000000')));
      }
      
      console.error('No transfer method available from API');
      return null;
    } catch (error) {
      console.error('Error creating faucet transaction:', error);
      return null;
    }
  };

  return (
    <Card>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {t('Faucet - Get Test Tokens')}
      </h3>
      <p style={{ 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        color: 'var(--color-text)', 
        opacity: 0.8 
      }}>
        {t('Get test ROKO tokens from development accounts to use in the network')}
      </p>
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {TEST_ACCOUNTS.map(testAccount => {
          const accountAddress = createTestAccountIfNeeded(testAccount);
          const tx = accountAddress ? createFaucetTx('10', testAccount) : null;
          
          if (tx && accountAddress) {
            return (
              <TxButton
                key={`faucet-${testAccount.name}`}
                accountId={accountAddress}
                extrinsic={tx}
                icon='paper-plane'
                label={`Send from ${testAccount.name} (10 ROKO)`}
                onSuccess={() => {
                  console.log(`Successfully sent 10 ROKO from ${testAccount.name}`);
                  onSuccess();
                }}
                onFailed={() => {
                  console.error(`Failed to send ROKO from ${testAccount.name}`);
                  setError(`Transfer from ${testAccount.name} failed`);
                }}
              />
            );
          } else {
            const hasKeyring = keyring.isAvailable;
            const hasApi = !!api;
            const hasTransferMethod = !!(api && (api.tx?.balances?.transferKeepAlive || api.tx?.balances?.transferAllowDeath || api.tx?.balances?.transfer));
            
            return (
              <div
                key={`faucet-disabled-${testAccount.name}`}
                style={{ 
                  opacity: 0.7,
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-table)',
                  borderRadius: '0.25rem',
                  minWidth: '180px',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)'
                }}
              >
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                  {`${testAccount.name} Faucet`}
                </p>
                <div style={{ fontSize: '0.85rem', textAlign: 'left' }}>
                  <div>{`Keyring: ${hasKeyring ? '✓' : '✗'}`}</div>
                  <div>{`API: ${hasApi ? '✓' : '✗'}`}</div>
                  <div>{`Transfer: ${hasTransferMethod ? '✓' : '✗'}`}</div>
                  <div>{`Account: ${accountAddress ? '✓' : '✗'}`}</div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </Card>
  );
}

export default React.memo(Faucet);