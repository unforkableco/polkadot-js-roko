// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { useAccounts } from '@polkadot/react-hooks';
import { FormatBalance } from '@polkadot/react-query';
import { styled } from '@polkadot/react-components/styled';
import { useTranslation } from '../translate.js';
import { useApi } from '@polkadot/react-hooks';
import { useCall } from '@polkadot/react-hooks';
import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { AddressSmall } from '@polkadot/react-components';

interface Props {
  className?: string;
}

function Overview ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { allAccounts } = useAccounts();
  const { api } = useApi();

  return (
    <StyledDiv className={className}>
      <div className='pwroko--App-accounts'>
        <div className='header'>
          <h1>{t('Account Balances')}</h1>
        </div>
        <div className='accounts'>
          {allAccounts.map((accountId) => {
            const balances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [accountId]);

            return (
              <div className='account' key={accountId}>
                <AddressSmall value={accountId} />
                <div className='balances'>
                  <div className='balance'>
                    <label>{t('ROKO')}:</label>
                    <FormatBalance
                      formatIndex={0}
                      value={balances?.freeBalance}
                    />
                  </div>
                  <div className='balance'>
                    <label>{t('pwROKO')}:</label>
                    <FormatBalance
                      formatIndex={1}
                      value={balances?.freeBalance}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  .pwroko--App-accounts {
    width: 100%;
    padding: 1rem;

    .header {
      margin-bottom: 1rem;

      h1 {
        margin: 0;
        font-size: 1.5rem;
      }
    }

    .accounts {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .account {
        background: var(--bg-table);
        padding: 1rem;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .balances {
          display: flex;
          gap: 2rem;

          .balance {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            label {
              font-weight: var(--font-weight-normal);
              color: var(--color-label);
            }
          }
        }
      }
    }
  }
`;

export default React.memo(Overview); 