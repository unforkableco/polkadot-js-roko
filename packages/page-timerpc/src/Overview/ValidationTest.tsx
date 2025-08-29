// Copyright 2017-2025 @polkadot/app-timerpc authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import { Button, Card, Input, styled } from '@polkadot/react-components';

import { useTranslation } from '../translate.js';

interface Props {
  className?: string;
  baseUrl: string;
}

interface ValidationResult {
  valid: boolean;
  decodedLength?: number;
  estimatedTimestamp?: string;
  error?: string;
  message?: string;
  timestamp?: string;
}

function ValidationTest ({ baseUrl, className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [transaction, setTransaction] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const sampleTransactions = [
    {
      name: 'Sample Transfer',
      hex: '0x4502840012a4f1234567890abcdef0123456789abcdef0123456789abcdef0123456789a'
    },
    {
      name: 'Sample Balance Call',
      hex: '0xe10184798d4ba9baf0064ec19eb4f0a1a45785ae9d6dfc'
    }
  ];

  const validateTransaction = useCallback(async (): Promise<void> => {
    if (!transaction.trim()) {
      setResult({
        valid: false,
        error: 'EMPTY_TRANSACTION',
        message: 'Please enter a transaction hex'
      });
      return;
    }

    setIsValidating(true);
    setResult(null);

    try {
      const response = await fetch(`${baseUrl}/api/v1/temporal/validate`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: transaction.trim() }),
        signal: AbortSignal.timeout(10000)
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        valid: false,
        error: 'NETWORK_ERROR',
        message: error.message || 'Failed to validate transaction'
      });
    } finally {
      setIsValidating(false);
    }
  }, [baseUrl, transaction]);

  const loadSample = useCallback((hex: string) => {
    setTransaction(hex);
    setResult(null);
  }, []);

  const formatTimestamp = (timestamp: string | number): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const timestampStr = String(timestamp);
      
      // Handle nanosecond timestamps (19 digits)
      if (timestampStr.length === 19) {
        // Convert nanoseconds to milliseconds by dividing by 1,000,000
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
  };

  return (
    <StyledDiv className={className}>
      <Card>
        <h3>{t('Transaction Validation Test')}</h3>
        
        <div className='validation-form'>
          <div className='input-section'>
            <Input
              label={t('Transaction Hex')}
              onChange={setTransaction}
              placeholder={t('Enter hex-encoded transaction (e.g., 0x4502840012a4f1...)')}
              value={transaction}
            />
            
            <div className='sample-buttons'>
              <span className='sample-label'>{t('Load Sample:')}</span>
              {sampleTransactions.map((sample, index) => (
                <Button
                  key={index}
                  isBasic
                  label={sample.name}
                  onClick={() => loadSample(sample.hex)}
                />
              ))}
            </div>
          </div>

          <div className='validate-button'>
            <Button
              icon='check-circle'
              isDisabled={isValidating || !transaction.trim()}
              label={isValidating ? t('Validating...') : t('Validate Transaction')}
              onClick={validateTransaction}
            />
          </div>
        </div>

        {result && (
          <div className='validation-result'>
            <div className={`result-status ${result.valid ? 'valid' : 'invalid'}`}>
              {result.valid ? (
                <>
                  <span className='status-icon'>✅</span>
                  <span className='status-text'>{t('Transaction is VALID')}</span>
                </>
              ) : (
                <>
                  <span className='status-icon'>❌</span>
                  <span className='status-text'>{t('Transaction is INVALID')}</span>
                </>
              )}
            </div>

            <div className='result-details'>
              {result.valid && (
                <>
                  {result.decodedLength && (
                    <div className='detail-row'>
                      <strong>{t('Decoded Length:')}</strong>
                      <span>{result.decodedLength} bytes</span>
                    </div>
                  )}
                  {result.estimatedTimestamp && (
                    <div className='detail-row'>
                      <strong>{t('Estimated Timestamp:')}</strong>
                      <span>{formatTimestamp(result.estimatedTimestamp)}</span>
                    </div>
                  )}
                </>
              )}

              {!result.valid && (
                <>
                  {result.error && (
                    <div className='detail-row error'>
                      <strong>{t('Error Code:')}</strong>
                      <span>{result.error}</span>
                    </div>
                  )}
                  {result.message && (
                    <div className='detail-row error'>
                      <strong>{t('Error Message:')}</strong>
                      <span>{result.message}</span>
                    </div>
                  )}
                </>
              )}

              {result.timestamp && (
                <div className='detail-row'>
                  <strong>{t('Validation Time:')}</strong>
                  <span>{formatTimestamp(result.timestamp)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className='validation-info'>
          <h4>{t('About Transaction Validation')}</h4>
          <p>{t('This feature validates transaction format and structure without submitting to the blockchain.')}</p>
          <ul>
            <li>{t('Checks hex encoding validity')}</li>
            <li>{t('Verifies transaction structure')}</li>
            <li>{t('Estimates temporal processing timestamp')}</li>
            <li>{t('Does not consume gas or affect blockchain state')}</li>
          </ul>
        </div>
      </Card>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  .validation-form {
    margin-bottom: 1.5rem;
    
    .input-section {
      margin-bottom: 1rem;
    }
    
    .sample-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
      
      .sample-label {
        color: var(--color-summary);
        font-size: 0.9rem;
        margin-right: 0.5rem;
      }
    }
    
    .validate-button {
      text-align: center;
    }
  }

  .validation-result {
    margin: 1.5rem 0;
    padding: 1rem;
    border-radius: 0.5rem;
    background: var(--bg-input);
    
    .result-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      font-weight: bold;
      
      &.valid {
        color: #28a745;
      }
      
      &.invalid {
        color: #dc3545;
      }
      
      .status-icon {
        font-size: 1.2rem;
      }
    }
    
    .result-details {
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        padding: 0.25rem 0;
        
        strong {
          color: var(--color-label);
        }
        
        span {
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        &.error {
          strong, span {
            color: #dc3545;
          }
        }
      }
    }
  }

  .validation-info {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    
    h4 {
      margin-bottom: 0.5rem;
      color: var(--color-summary);
    }
    
    p {
      margin-bottom: 0.75rem;
      color: var(--color-text);
    }
    
    ul {
      list-style: none;
      padding: 0;
      
      li {
        padding: 0.25rem 0;
        color: var(--color-summary);
        
        &:before {
          content: '•';
          color: #007bff;
          margin-right: 0.5rem;
        }
      }
    }
  }
`;

export default React.memo(ValidationTest); 