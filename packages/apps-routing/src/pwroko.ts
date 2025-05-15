// Copyright 2017-2025 @polkadot/apps-routing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Route, TFunction } from './types.js';

import Component from '@polkadot/app-pwroko';

export default function create (t: TFunction): Route {
  return {
    Component,
    display: {
      needsApi: []
    },
    group: 'governance',
    icon: 'coins',
    name: 'pwroko',
    text: t('nav.pwroko', 'pwROKO', { ns: 'apps-routing' })
  };
} 