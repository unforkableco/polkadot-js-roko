// Copyright 2017-2025 @polkadot/apps-routing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Route, TFunction } from './types.js';

import React from 'react';

// Import the existing EvmInterface component instead of duplicating the code
import EvmInterface from '../../page-pwroko/src/EvmInterface/index.js';

function Component(): React.ReactElement {
  return React.createElement(EvmInterface);
}

export function useCounter() {
  return 0;
}

export default function create (t: TFunction): Route {
  return {
    Component,
    display: {
      needsApi: []
    },
    group: 'evm',
    icon: 'code',
    name: 'evm',
    text: t('nav.evm', 'EVM Interface', { ns: 'apps-routing' }),
    useCounter
  };
}