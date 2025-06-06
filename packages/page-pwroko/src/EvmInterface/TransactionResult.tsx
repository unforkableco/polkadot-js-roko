// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import type { TxResult } from './types.js';

interface Props {
  txResult: TxResult;
}

function TransactionResult ({ txResult }: Props): React.ReactElement<Props> {
  return (
    <div style={{ 
      marginTop: '2rem',
      padding: '1rem',
      borderRadius: '0.5rem',
      backgroundColor: txResult.success ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
      border: `1px solid ${txResult.success ? 'green' : 'red'}`
    }}>
      {txResult.success ? (
        <div>
          <p style={{ fontWeight: '600', color: 'green', marginBottom: '0.5rem' }}>
            {txResult.message || 'Transaction successful!'}
          </p>
          {txResult.hash && (
            <p style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
              Hash: {txResult.hash.slice(0, 10)}...{txResult.hash.slice(-8)}
            </p>
          )}
          {txResult.blockNumber && (
            <p style={{ fontSize: '0.875rem' }}>
              Block: {txResult.blockNumber}
            </p>
          )}
        </div>
      ) : (
        <p style={{ fontWeight: '600', color: 'red' }}>
          Failed: {txResult.error}
        </p>
      )}
    </div>
  );
}

export default React.memo(TransactionResult);