// Copyright 2017-2025 @polkadot/app-timerpc authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AppProps as Props } from '@polkadot/react-components/types';

import React from 'react';

import { TemporalPalletDiagnostic } from '@polkadot/react-components';

import Overview from './Overview/index.js';
import { useTranslation } from './translate.js';

function TimeRpcApp ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <main className={className}>
      <TemporalPalletDiagnostic />
      <div style={{ marginTop: '1.5rem' }}>
        <Overview />
      </div>
    </main>
  );
}

export default React.memo(TimeRpcApp); 