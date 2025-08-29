// Copyright 2017-2025 @polkadot/apps-routing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Route, TFunction } from './types.js';

// TimeRPC app disabled
const Component = undefined as unknown as React.ComponentType<any>;

export default function create (t: TFunction): Route {
  return {
    Component,
    display: {
      needsApi: []
    },
    group: 'network',
    icon: 'clock',
    name: 'timerpc',
    text: t('nav.timerpc', 'TimeRPC', { ns: 'apps-routing' })
  };
} 