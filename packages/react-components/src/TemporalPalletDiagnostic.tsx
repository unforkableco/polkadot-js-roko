// Copyright 2017-2025 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { useTemporalPalletCheck } from '@polkadot/react-hooks';

import { styled } from './styled.js';

interface Props {
  className?: string;
}

function TemporalPalletDiagnostic ({ className }: Props): React.ReactElement<Props> {
  const { isAvailable, availableMethods, availableQueries, rpcSections, querySections, error, checkTemporalPallet } = useTemporalPalletCheck();

  return (
    <StyledDiv className={className}>
      <div className='diagnostic-header'>
        <h3>🔍 Temporal Pallet Diagnostic</h3>
        <button onClick={checkTemporalPallet}>Re-check</button>
      </div>
      
      <div className='diagnostic-content'>
        <div className='status-section'>
          <h4>Overall Status</h4>
          <div className={`status ${isAvailable ? 'available' : 'unavailable'}`}>
            {isAvailable ? '✅ Temporal pallet is available' : '❌ Temporal pallet is NOT available'}
          </div>
          {error && (
            <div className='error'>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className='details-grid'>
          <div className='detail-section'>
            <h4>Available RPC Sections ({rpcSections.length})</h4>
            <div className='item-list'>
              {rpcSections.map(section => (
                <span key={section} className={section === 'temporal' ? 'highlight' : 'item'}>
                  {section}
                </span>
              ))}
            </div>
          </div>

          <div className='detail-section'>
            <h4>Available Query Sections ({querySections.length})</h4>
            <div className='item-list'>
              {querySections.map(section => (
                <span key={section} className={section.includes('temporal') ? 'highlight' : 'item'}>
                  {section}
                </span>
              ))}
            </div>
          </div>

          <div className='detail-section'>
            <h4>Temporal RPC Methods ({availableMethods.length})</h4>
            <div className='item-list'>
              {availableMethods.length > 0 ? (
                availableMethods.map(method => (
                  <span key={method} className='item'>
                    {method}
                  </span>
                ))
              ) : (
                <span className='empty'>No temporal RPC methods found</span>
              )}
            </div>
          </div>

          <div className='detail-section'>
            <h4>Temporal Query Methods ({availableQueries.length})</h4>
            <div className='item-list'>
              {availableQueries.length > 0 ? (
                availableQueries.map(method => (
                  <span key={method} className='item'>
                    {method}
                  </span>
                ))
              ) : (
                <span className='empty'>No temporal query methods found</span>
              )}
            </div>
          </div>
        </div>

        <div className='required-methods'>
          <h4>Required Methods Check</h4>
          <div className='methods-grid'>
            <div className='method-check'>
              <span>temporal_getBlockMetadata</span>
              <span className={availableMethods.includes('temporal_getBlockMetadata') ? 'available' : 'missing'}>
                {availableMethods.includes('temporal_getBlockMetadata') ? '✅' : '❌'}
              </span>
            </div>
            <div className='method-check'>
              <span>temporal_getBlockTransactions</span>
              <span className={availableMethods.includes('temporal_getBlockTransactions') ? 'available' : 'missing'}>
                {availableMethods.includes('temporal_getBlockTransactions') ? '✅' : '❌'}
              </span>
            </div>
            <div className='method-check'>
              <span>temporal_getBlocksMetadata</span>
              <span className={availableMethods.includes('temporal_getBlocksMetadata') ? 'available' : 'missing'}>
                {availableMethods.includes('temporal_getBlocksMetadata') ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </div>

        <div className='help-section'>
          <h4>💡 Troubleshooting</h4>
          <ul>
            <li>If temporal pallet is not available, check that your node includes the temporal transactions pallet</li>
            <li>Ensure the temporal pallet RPC methods are exposed in your node configuration</li>
            <li>Verify that the node is running the latest version with temporal support</li>
            <li>Check the node logs for any temporal pallet initialization errors</li>
          </ul>
        </div>
      </div>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-page);

  .diagnostic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      color: var(--color-text);
    }

    button {
      padding: 0.5rem 1rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .status-section {
    margin-bottom: 1.5rem;

    .status {
      padding: 0.75rem;
      border-radius: 0.25rem;
      font-weight: bold;
      margin-bottom: 0.5rem;

      &.available {
        background: #e8f5e8;
        border: 1px solid #c3e6c3;
        color: #155724;
      }

      &.unavailable {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
    }

    .error {
      color: #721c24;
      background: #f8d7da;
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid #f5c6cb;
    }
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .detail-section {
    h4 {
      margin: 0 0 0.5rem 0;
      color: var(--color-summary);
      font-size: 0.9rem;
    }

    .item-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;

      .item {
        padding: 0.25rem 0.5rem;
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: 0.25rem;
        font-size: 0.8rem;
        font-family: monospace;
      }

      .highlight {
        padding: 0.25rem 0.5rem;
        background: #e8f5e8;
        border: 1px solid #c3e6c3;
        border-radius: 0.25rem;
        font-size: 0.8rem;
        font-family: monospace;
        color: #155724;
        font-weight: bold;
      }

      .empty {
        color: #6c757d;
        font-style: italic;
        font-size: 0.8rem;
      }
    }
  }

  .required-methods {
    margin-bottom: 1.5rem;

    h4 {
      margin: 0 0 0.5rem 0;
      color: var(--color-summary);
    }

    .methods-grid {
      display: grid;
      gap: 0.5rem;

      .method-check {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: var(--bg-input);
        border-radius: 0.25rem;
        border: 1px solid var(--border-color);

        span:first-child {
          font-family: monospace;
          font-size: 0.9rem;
        }

        .available {
          color: #155724;
        }

        .missing {
          color: #721c24;
        }
      }
    }
  }

  .help-section {
    h4 {
      margin: 0 0 0.5rem 0;
      color: var(--color-summary);
    }

    ul {
      margin: 0;
      padding-left: 1.5rem;

      li {
        margin-bottom: 0.5rem;
        color: var(--color-text);
        font-size: 0.9rem;
        line-height: 1.4;
      }
    }
  }

  @media (max-width: 768px) {
    .details-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default React.memo(TemporalPalletDiagnostic); 