// Copyright 2017-2025 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';

import type { Hash } from '@polkadot/types/interfaces';

import { useBlockTimeMetadata } from '@polkadot/react-hooks';

import { styled } from './styled.js';

interface Props {
  className?: string;
  blockHash: string | Hash;
  blockNumber?: number;
  txHashes?: string[];
  compact?: boolean;
}

interface BlockTimeMetadata {
  blockHash: string;
  blockNumber: number;
  timestamp: string;
  temporalProof?: string;
  timeRpcSignature?: string;
  keyId?: number;
  isTemporalBlock: boolean;
  temporalTransactions: number;
  nonTemporalTransactions: number;
  watermark?: string;
  error?: string;
  temporalTxHashes?: string[];
}

function BlockTimeMetadata ({ className, compact = false }: Props): React.ReactElement<Props> | null {
  const { isLoading } = useBlockTimeMetadata();
  const [metadata] = useState<BlockTimeMetadata | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // RPC-based fetch disabled; mark as checked to render nothing
    if (!hasChecked) {
      setHasChecked(true);
    }
  }, [hasChecked]);

  const formatTimestamp = useCallback((timestamp: string): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const timestampStr = String(timestamp);
      const hexLike = timestampStr.startsWith('0x') ? timestampStr.slice(2) : timestampStr;
      const isHex = /^[0-9a-fA-F]+$/.test(hexLike);
      // Handle 16-byte LE hex u128 (nanoseconds)
      if (isHex && hexLike.length === 32) {
        const bytes: number[] = hexLike.match(/../g)!.map((b) => parseInt(b, 16));
        const beHex = bytes.reverse().map((b) => b.toString(16).padStart(2, '0')).join('');
        const nanos = BigInt('0x' + beHex);
        const millis = nanos / 1_000_000n;
        return new Date(Number(millis)).toLocaleString();
      }
      
      // Handle nanosecond timestamps (19 digits)
      if (timestampStr.length === 19) {
        const nanoseconds = BigInt(timestampStr);
        const milliseconds = Number(nanoseconds / BigInt(1000000));
        return new Date(milliseconds).toLocaleString();
      }
      
      // Handle millisecond timestamps (13 digits)
      if (timestampStr.length === 13) {
        const ms = parseInt(timestampStr);
        return new Date(ms).toLocaleString();
      }
      
      // Handle second timestamps (10 digits)
      if (timestampStr.length === 10) {
        const seconds = parseInt(timestampStr);
        return new Date(seconds * 1000).toLocaleString();
      }
      
      // Try parsing as ISO string or direct Date conversion
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return `Invalid timestamp: ${timestamp}`;
    }
  }, []);

  if (isLoading && !hasChecked) {
    return (
      <StyledDiv className={`${className || ''} ${compact ? 'compact' : ''} loading`}>
        <div className='temporal-status loading'>
          <span className='loading-indicator'>⏳</span>
          <span>Checking temporal data...</span>
        </div>
      </StyledDiv>
    );
  }

  // With RPC disabled, render nothing unless explicit metadata is provided by parent
  if (!metadata) return null;

  if (!metadata.isTemporalBlock) {
    return (
      <StyledDiv className={`${className || ''} ${compact ? 'compact' : ''} standard`}>
        <div className='temporal-status standard'>
          <span className='status-icon'>⏰</span>
          <span>Temporal data inactive</span>
        </div>
      </StyledDiv>
    );
  }

  return (
    <StyledDiv className={`${className || ''} ${compact ? 'compact' : ''} temporal`}>
      <div className='temporal-status temporal'>
        <span className='status-icon'>🕒</span>
        <span>Temporal block</span>
      </div>
      
      {!compact && (
        <div className='temporal-details'>
          <div className='detail-row'>
            <strong>Temporal Timestamp:</strong>
            <span>{formatTimestamp(metadata.timestamp)}</span>
          </div>
          
          <div className='detail-row'>
            <strong>Temporal Transactions:</strong>
            <span>{metadata.temporalTransactions}</span>
          </div>
          
          <div className='detail-row'>
            <strong>Non-Temporal Transactions:</strong>
            <span>{metadata.nonTemporalTransactions}</span>
          </div>
          
          {metadata.watermark && (
            <div className='detail-row'>
              <strong>Temporal Watermark:</strong>
              <span>{formatTimestamp(metadata.watermark)}</span>
            </div>
          )}
          
          {metadata.keyId !== undefined && (
            <div className='detail-row'>
              <strong>Temporal Key ID:</strong>
              <span>{metadata.keyId}</span>
            </div>
          )}
          
          {metadata.timeRpcSignature && (
            <div className='detail-row'>
              <strong>Temporal Signature:</strong>
              <code className='signature'>{metadata.timeRpcSignature.slice(0, 20)}...</code>
            </div>
          )}
          
          {metadata.temporalProof && (
            <div className='detail-row'>
              <strong>Temporal Proof:</strong>
              <code className='proof'>{metadata.temporalProof.slice(0, 20)}...</code>
            </div>
          )}

          {Array.isArray(metadata.temporalTxHashes) && metadata.temporalTxHashes.length > 0 && (
            <div className='detail-row tx-list'>
              <strong>Temporal Transactions:</strong>
              <div className='tx-list-wrap'>
                {metadata.temporalTxHashes.map((h) => (
                  <div key={h} className='tx-item'>
                    <a href={`#/explorer/hash/${h}`} title={h}>{h.slice(0, 16)}…{h.slice(-8)}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  .temporal-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    
    .status-icon {
      font-size: 1rem;
    }
    
    &.loading {
      background: #f0f8ff;
      border: 1px solid #b3d9ff;
      color: #0066cc;
      
      .loading-indicator {
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
    
    &.error {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
    }
    
    &.standard {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #6c757d;
    }
    
    &.temporal {
      background: #e8f5e8;
      border: 1px solid #c3e6c3;
      color: #155724;
      font-weight: 500;
    }
  }
  
  .temporal-details {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--bg-input);
    border-radius: 0.25rem;
    border: 1px solid var(--border-color);
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 1rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      strong {
        color: var(--color-label);
        min-width: 140px;
        flex-shrink: 0;
        font-size: 0.85rem;
      }
      
      span, code {
        flex: 1;
        font-size: 0.85rem;
      }
      
      code {
        font-family: monospace;
        background: var(--bg-table);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        word-break: break-all;
      }

      &.tx-list {
        align-items: flex-start;

        .tx-list-wrap {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.25rem 0.75rem;
          width: 100%;
        }

        .tx-item a {
          font-family: monospace;
          font-size: 0.85rem;
          text-decoration: none;
          color: var(--color-link);
        }
      }
    }
  }
  
  &.compact {
    .temporal-status {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      
      .status-icon {
        font-size: 0.9rem;
      }
    }
  }
  
  .pruned-info {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    color: #856404;
    font-size: 0.85rem;
    
    p {
      margin: 0;
      line-height: 1.4;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

export default React.memo(BlockTimeMetadata); 