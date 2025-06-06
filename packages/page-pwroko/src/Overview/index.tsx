// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

// import { useAccounts } from '@polkadot/react-hooks';
import { FormatBalance } from '@polkadot/react-query';
import { styled } from '@polkadot/react-components/styled';
import { useTranslation } from '../translate.js';
import { useApi } from '@polkadot/react-hooks';
import { useCall } from '@polkadot/react-hooks';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { InputAddress, InputBalance, TxButton } from '@polkadot/react-components';
import { BN, BN_ZERO } from '@polkadot/util';

interface Props {
  className?: string;
}

function Overview ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api } = useApi();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [lockAmount, setLockAmount] = useState<BN>(BN_ZERO);
  const [unlockAmount, setUnlockAmount] = useState<BN>(BN_ZERO);

  // Query native ROKO balance
  const rokoBalance = useCall<DeriveBalancesAll>(api.derive.balances?.all, [selectedAccount]);
  
  // Query pwROKO balance
  const pwrokoBalance = useCall<any>(api.query.pwRoko?.balances, [selectedAccount]);
  
  // Query staking info (bonded amount)
  const stakingLedger = useCall<any>(api.query.staking?.ledger, [selectedAccount]);
  const bondedAmount = stakingLedger?.active || BN_ZERO;
  
  // Query delegated amount (if delegation pallet exists)
  const delegatedAmount = useCall<any>(api.query.delegation?.delegations, [selectedAccount]);
  const totalDelegated = delegatedAmount?.amount || BN_ZERO;
  
  // Calculate free pwROKO (total - bonded - delegated)
  const freePwRoko = pwrokoBalance ? 
    BN.max(BN_ZERO, pwrokoBalance.sub(bondedAmount).sub(totalDelegated)) : 
    BN_ZERO;

  const hasLockValue = lockAmount.gt(BN_ZERO);
  const isLockValid = hasLockValue && lockAmount.lte(rokoBalance?.freeBalance || BN_ZERO);

  const hasUnlockValue = unlockAmount.gt(BN_ZERO);
  const isUnlockValid = hasUnlockValue && unlockAmount.lte(pwrokoBalance || BN_ZERO);

  const _setLockAmount = useCallback(
    (value?: BN) => setLockAmount(value || BN_ZERO),
    []
  );

  const _setUnlockAmount = useCallback(
    (value?: BN) => setUnlockAmount(value || BN_ZERO),
    []
  );

  return (
    <StyledDiv className={className}>
      <div className='pwroko--App-accounts'>
        <div className='header'>
          <h1>{t('Account Balances')}</h1>
        </div>
        <div className='selector'>
          <InputAddress
            label={t('select account')}
            onChange={setSelectedAccount}
            type='account'
          />
        </div>
        {selectedAccount && (
          <>
            <div className='balances'>
              <div className='balance'>
                <span className='label'>{t('ROKO')}:</span>
                <FormatBalance
                  value={rokoBalance?.freeBalance}
                  withCurrency={false}
                  withSi
                />
              </div>
              <div className='balance-section'>
                <h3>⚡ {t('Balances pwROKO')}</h3>
                <div className='pwroko-balances'>
                  <div className='balance-item'>
                    <span className='label'>{t('Total pwROKO')}:</span>
                    <FormatBalance
                      value={pwrokoBalance}
                      withCurrency={false}
                      withSi
                    />
                  </div>
                  <div className='balance-item'>
                    <span className='label'>{t('Bonded (Staked)')}:</span>
                    <FormatBalance
                      value={bondedAmount}
                      withCurrency={false}
                      withSi
                    />
                  </div>
                  <div className='balance-item'>
                    <span className='label'>{t('Delegated')}:</span>
                    <FormatBalance
                      value={totalDelegated}
                      withCurrency={false}
                      withSi
                    />
                  </div>
                  <div className='balance-item free-balance'>
                    <span className='label'>{t('Free pwROKO')}:</span>
                    <FormatBalance
                      value={freePwRoko}
                      withCurrency={false}
                      withSi
                    />
                    <span className='calculation'>({t('Total')} - {t('Bonded')} - {t('Delegated')})</span>
                  </div>
                </div>
              </div>
            </div>
            <div className='actions-section'>
              <div className='action-box'>
                <h3>{t('Lock ROKO')}</h3>
                <div className='input-section'>
                  <InputBalance
                    autoFocus
                    isError={!isLockValid}
                    label={t('lock amount')}
                    onChange={_setLockAmount}
                    siSymbol='ROKO'
                  />
                </div>
                <div className='button-section'>
                  <TxButton
                    accountId={selectedAccount}
                    icon='lock'
                    isDisabled={!isLockValid}
                    label={t('Lock ROKO')}
                    params={[lockAmount]}
                    tx={api.tx.pwRoko.lock}
                  />
                </div>
              </div>
              <div className='action-box'>
                <h3>{t('Unlock pwROKO')}</h3>
                <div className='input-section'>
                  <InputBalance
                    isError={!isUnlockValid}
                    label={t('unlock amount')}
                    onChange={_setUnlockAmount}
                    siSymbol='pwROKO'
                  />
                </div>
                <div className='button-section'>
                  <TxButton
                    accountId={selectedAccount}
                    icon='unlock'
                    isDisabled={!isUnlockValid}
                    label={t('Unlock pwROKO')}
                    params={[unlockAmount]}
                    tx={api.tx.pwRoko.unlock}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  .pwroko--App-accounts {
    .header {
      margin-bottom: 1em;
      text-align: center;
    }

    .selector {
      margin-bottom: 1em;
    }

    .balances {
      display: flex;
      flex-direction: column;
      gap: 1.5em;
      margin-top: 1em;
      padding: 1em;
      background: var(--bg-table);
      border-radius: 0.25rem;

      .balance {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5em;

        .label {
          font-weight: var(--font-weight-normal);
          opacity: 0.66;
        }
      }

      .balance-section {
        h3 {
          text-align: center;
          margin-bottom: 1em;
          color: var(--color-summary);
          font-size: 1.1em;
        }

        .pwroko-balances {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1em;

          .balance-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75em;
            background: var(--bg-input);
            border-radius: 0.25rem;

            .label {
              font-weight: var(--font-weight-normal);
              opacity: 0.8;
              margin-bottom: 0.5em;
              font-size: 0.9em;
            }

            &.free-balance {
              grid-column: 1 / -1;
              background: var(--bg-button);
              border: 1px solid var(--border-input);

              .calculation {
                font-size: 0.8em;
                opacity: 0.7;
                margin-top: 0.25em;
                font-style: italic;
              }
            }
          }
        }
      }
    }

    .actions-section {
      margin-top: 1em;
      display: flex;
      gap: 1em;

      .action-box {
        flex: 1;
        padding: 1em;
        background: var(--bg-table);
        border-radius: 0.25rem;

        h3 {
          margin: 0 0 1em;
          text-align: center;
        }

        .input-section {
          margin-bottom: 1em;
        }

        .button-section {
          display: flex;
          justify-content: center;
        }
      }
    }
  }
`;

export default React.memo(Overview); 