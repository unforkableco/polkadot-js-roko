// Copyright 2017-2025 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { BN } from '@polkadot/util';

import React, { useRef, useState } from 'react';

import useAmountError from '@polkadot/app-staking2/Pools/useAmountError';
import { Dropdown, InputBalance, Modal, TxButton } from '@polkadot/react-components';
import { useApi, useCall } from '@polkadot/react-hooks';
import { BalanceFree, FormatBalance } from '@polkadot/react-query';
import { BN_ZERO } from '@polkadot/util';

import { useTranslation } from '../../translate.js';
import PoolInfo from '../partials/PoolInfo.js';

interface Props {
  className?: string;
  controllerId: string;
  onClose: () => void;
  poolId: BN;
}

const DEFAULT_TYPE = 'rewards';

function BondExtra ({ className, controllerId, onClose, poolId }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api } = useApi();
  const [type, setType] = useState(DEFAULT_TYPE);
  const [amount, setAmount] = useState<BN | undefined>();
  const isAmountError = useAmountError(controllerId, amount, BN_ZERO);
  const controllerBalance = useCall<DeriveBalancesAll>(api.derive.balances?.all, [controllerId]);
  const controllerPwRokoBalance = useCall<any>(api.query.pwRoko?.balances, [controllerId]);

  const typeRef = useRef([
    { text: t('Free balance'), value: 'free' },
    { text: t('Pool rewards'), value: 'rewards' }
  ]);

  return (
    <Modal
      className={className}
      header={t('Bond extra into pool')}
      onClose={onClose}
      size='large'
    >
      <Modal.Content>
        <PoolInfo
          controllerId={controllerId}
          poolId={poolId}
        />
        <Modal.Columns hint={t('You can either bond a specific amount from your free balance, or all of the accumulated rewards.')}>
          <Dropdown
            defaultValue={DEFAULT_TYPE}
            label={t('type of funds to bond')}
            onChange={setType}
            options={typeRef.current}
          />
          {type === 'free' && (
            <InputBalance
              autoFocus
              isError={isAmountError}
              label={t('additional free funds to bond')}
              labelExtra={
                <FormatBalance
                  label={<span className='label'>{t('balance (pwROKO)')}</span>}
                  formatIndex={1}
                  value={controllerPwRokoBalance}
                />
              }
              onChange={setAmount}
              siSymbol='pwROKO'
            />
          )}
        </Modal.Columns>
      </Modal.Content>
      <Modal.Actions>
        <TxButton
          accountId={controllerId}
          icon='sign-in-alt'
          isDisabled={type === 'free' && isAmountError}
          label={t('Bond Extra')}
          onStart={onClose}
          params={[
            type === 'free'
              ? { FreeBalance: amount }
              : 'Rewards'
          ]}
          tx={api.tx.nominationPools.bondExtra}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default React.memo(BondExtra);
