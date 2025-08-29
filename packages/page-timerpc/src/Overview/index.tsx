// Copyright 2017-2025 @polkadot/app-timerpc authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';

import { Button, Card, CardSummary, styled } from '@polkadot/react-components';
import { useApi } from '@polkadot/react-hooks';

import { useTranslation } from '../translate.js';
import ValidationTest from './ValidationTest.js';

interface Props {
  className?: string;
}

interface TimeRpcHealth {
  status: string;
  timestamp: string;
  isConnected: boolean;
  responseTime?: number;
  error?: string;
}

interface TimeRpcStatus {
  status: 'active' | 'degraded' | 'error';
  activeKey: {
    keyId: number;
    publicKey: string;
    validUntil: string;
  };
  currentTimestamp: string;
  nodeConnection: {
    connected: boolean;
    activeKeysCount: number;
  };
  chainspecEntry: {
    keyId: number;
    publicKey: string;
    isActive: boolean;
    validFrom: string;
    validUntil: string;
    description: string;
  };
}

interface TemporalSupport {
  supported: boolean;
  palletAvailable: boolean;
  rpcAvailable: boolean;
  keyValid: boolean;
  readinessScore: number;
  issues: string[];
}

interface NodeIntrospection {
  success: boolean;
  nodeInfo: {
    chain: string;
    version: string;
    name: string;
  };
  temporalSupport: TemporalSupport;
  temporalPallet: {
    isAvailable: boolean;
    palletName: string;
    methods: string[];
    storage: string[];
    events: string[];
    errors: string[];
  };
  temporalRpcMethods: string[];
  recommendations: string[];
  timestamp: string;
}

const TIMERPC_PORT = '8080';

function Overview ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { isApiReady } = useApi();
  const [health, setHealth] = useState<TimeRpcHealth>({
    status: 'unknown',
    timestamp: 'Never',
    isConnected: false
  });
  const [status, setStatus] = useState<TimeRpcStatus | null>(null);
  const [introspection, setIntrospection] = useState<NodeIntrospection | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('Never');

  const getBaseUrl = useCallback(() => {
    return window.location.protocol === 'https:' 
      ? `https://${window.location.hostname}:${TIMERPC_PORT}`
      : `http://${window.location.hostname}:${TIMERPC_PORT}`;
  }, []);

  const fetchHealth = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${getBaseUrl()}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setHealth({
          status: data.status || 'healthy',
          timestamp: data.timestamp || new Date().toISOString(),
          isConnected: true,
          responseTime
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      setHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        isConnected: false,
        error: error.message || 'Connection failed'
      });
      return false;
    }
  }, [getBaseUrl]);

  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/temporal/status`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
             if (response.ok) {
         const data = await response.json();
         setStatus(data);
       } else {
        console.error('Failed to fetch status:', response.status, response.statusText);
        setStatus(null);
      }
    } catch (error) {
      console.error('Status fetch error:', error);
      setStatus(null);
    }
  }, [getBaseUrl]);

  const fetchIntrospection = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/temporal/introspection`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        const data = await response.json();
        setIntrospection(data);
      } else {
        console.error('Failed to fetch introspection:', response.status, response.statusText);
        setIntrospection(null);
      }
    } catch (error) {
      console.error('Introspection fetch error:', error);
      setIntrospection(null);
    }
  }, [getBaseUrl]);

  const performFullCheck = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    
    try {
      const healthOk = await fetchHealth();
      
      if (healthOk) {
        await Promise.all([
          fetchStatus(),
          fetchIntrospection()
        ]);
      } else {
        setStatus(null);
        setIntrospection(null);
      }
      
      setLastUpdateTime(new Date().toLocaleTimeString());
    } finally {
      setIsChecking(false);
    }
  }, [fetchHealth, fetchStatus, fetchIntrospection]);

  // Auto-check every 30 seconds
  useEffect(() => {
    performFullCheck();
    const interval = setInterval(performFullCheck, 30000);
    
    return () => clearInterval(interval);
  }, [performFullCheck]);

  const formatTimestamp = (timestamp: string | number): string => {
    if (!timestamp || timestamp === 'Never') return String(timestamp);
    
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

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
        return '#28a745';
      case 'degraded':
        return '#ffc107';
      case 'unhealthy':
      case 'error':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getReadinessScoreColor = (score: number): string => {
    if (score >= 90) return '#28a745';
    if (score >= 70) return '#ffc107';
    return '#dc3545';
  };

  return (
    <StyledDiv className={className}>
      <h1>{t('TimeRPC Monitor')}</h1>
      
      {/* Basic Health Status */}
      <div className='status-cards'>
        <Card>
          <CardSummary label={t('Service Health')}>
            <div className='status-indicator' style={{ color: getStatusColor(health.status) }}>
              {health.isConnected ? '🟢' : '🔴'} {health.status}
              {health.responseTime && <span className='response-time'> ({health.responseTime}ms)</span>}
            </div>
          </CardSummary>
        </Card>
        
        <Card>
          <CardSummary label={t('Endpoint')}>
            <div className='endpoint'>
              {getBaseUrl()}
            </div>
          </CardSummary>
        </Card>
        
        <Card>
          <CardSummary label={t('Last Updated')}>
            <div className='last-check'>
              {lastUpdateTime}
            </div>
          </CardSummary>
        </Card>
        
        <Card>
          <CardSummary label={t('Substrate API')}>
            <div className='status-indicator' style={{ color: isApiReady ? '#28a745' : '#dc3545' }}>
              {isApiReady ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </CardSummary>
        </Card>
      </div>

      <div className='actions'>
        <Button
          icon='sync-alt'
          isDisabled={isChecking}
          label={isChecking ? t('Checking...') : t('Refresh All')}
          onClick={performFullCheck}
        />
      </div>

      {health.error && (
        <Card>
          <div className='error-message'>
            <strong>{t('Connection Error:')}</strong> {health.error}
            <div className='error-help'>
              {t('Make sure TimeRPC service is running on port 8080 and accessible from this domain.')}
            </div>
          </div>
        </Card>
      )}

      {/* Temporal Service Status */}
      {status && (
        <div className='temporal-status'>
          <h2>{t('Temporal Service Status')}</h2>
          
          <div className='status-grid'>
            <Card>
              <CardSummary label={t('Service Status')}>
                <div className='status-indicator' style={{ color: getStatusColor(status.status) }}>
                  {status.status.toUpperCase()}
                </div>
              </CardSummary>
            </Card>
            
            <Card>
              <CardSummary label={t('Node Connection')}>
                <div className='status-indicator' style={{ color: status.nodeConnection.connected ? '#28a745' : '#dc3545' }}>
                  {status.nodeConnection.connected ? '🟢 Connected' : '🔴 Disconnected'}
                  <div className='sub-info'>Active Keys: {status.nodeConnection.activeKeysCount}</div>
                </div>
              </CardSummary>
            </Card>
            
                         <Card>
               <CardSummary label={t('Current Timestamp')}>
                 <div className='timestamp-info'>
                   {formatTimestamp(status.currentTimestamp)}
                   <div className='sub-info'>Nanosecond precision</div>
                 </div>
               </CardSummary>
             </Card>
          </div>

                     {/* Active Key Information */}
           <Card>
             <h3>{t('Active TimeRPC Key')}</h3>
             <div className='key-info'>
               <div className='key-row'>
                 <strong>{t('Key ID:')}</strong> {status.activeKey.keyId}
               </div>
               <div className='key-row'>
                 <strong>{t('Public Key:')}</strong> 
                 <code className='key-value'>{status.activeKey.publicKey}</code>
               </div>
               <div className='key-row'>
                 <strong>{t('Valid Until:')}</strong> {formatTimestamp(status.activeKey.validUntil)}
               </div>
             </div>
           </Card>

                     {/* Chainspec Entry */}
           <Card>
             <h3>{t('Chainspec Configuration')}</h3>
             <div className='chainspec-info'>
               <div className='key-row'>
                 <strong>{t('Description:')}</strong> {status.chainspecEntry.description}
               </div>
               <div className='key-row'>
                 <strong>{t('Active:')}</strong> 
                 <span style={{ color: status.chainspecEntry.isActive ? '#28a745' : '#dc3545' }}>
                   {status.chainspecEntry.isActive ? '✅ Yes' : '❌ No'}
                 </span>
               </div>
               <div className='key-row'>
                 <strong>{t('Valid From:')}</strong> {formatTimestamp(status.chainspecEntry.validFrom)}
               </div>
               <div className='key-row'>
                 <strong>{t('Valid Until:')}</strong> {formatTimestamp(status.chainspecEntry.validUntil)}
               </div>
             </div>
           </Card>
        </div>
      )}

      {/* Node Introspection */}
      {introspection && (
        <div className='introspection'>
          <h2>{t('Node Introspection')}</h2>
          
          <div className='status-grid'>
            <Card>
              <CardSummary label={t('Chain Info')}>
                <div className='chain-info'>
                  <div><strong>{introspection.nodeInfo.name}</strong></div>
                  <div>{introspection.nodeInfo.chain} v{introspection.nodeInfo.version}</div>
                </div>
              </CardSummary>
            </Card>
            
            <Card>
              <CardSummary label={t('Temporal Support')}>
                <div className='readiness-score' style={{ color: getReadinessScoreColor(introspection.temporalSupport.readinessScore) }}>
                  {introspection.temporalSupport.readinessScore}% Ready
                  <div className='sub-info'>
                    {introspection.temporalSupport.supported ? '✅ Supported' : '❌ Not Supported'}
                  </div>
                </div>
              </CardSummary>
            </Card>
          </div>

          {/* Temporal Pallet Info */}
          <Card>
            <h3>{t('Temporal Pallet Details')}</h3>
            <div className='pallet-grid'>
              <div className='pallet-section'>
                <h4>{t('Methods')}</h4>
                <ul className='method-list'>
                  {introspection.temporalPallet.methods.map((method, index) => (
                    <li key={index}><code>{method}</code></li>
                  ))}
                </ul>
              </div>
              
              <div className='pallet-section'>
                <h4>{t('Storage')}</h4>
                <ul className='method-list'>
                  {introspection.temporalPallet.storage.map((storage, index) => (
                    <li key={index}><code>{storage}</code></li>
                  ))}
                </ul>
              </div>
              
              <div className='pallet-section'>
                <h4>{t('Events')}</h4>
                <ul className='method-list'>
                  {introspection.temporalPallet.events.map((event, index) => (
                    <li key={index}><code>{event}</code></li>
                  ))}
                </ul>
              </div>
              
              <div className='pallet-section'>
                <h4>{t('Errors')}</h4>
                <ul className='method-list'>
                  {introspection.temporalPallet.errors.map((error, index) => (
                    <li key={index}><code>{error}</code></li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* RPC Methods */}
          <Card>
            <h3>{t('Temporal RPC Methods')}</h3>
            <div className='rpc-methods'>
              {introspection.temporalRpcMethods.map((method, index) => (
                <div key={index} className='rpc-method'>
                  <code>{method}</code>
                </div>
              ))}
            </div>
          </Card>

          {/* Issues and Recommendations */}
          {introspection.temporalSupport.issues.length > 0 && (
            <Card>
              <h3 style={{ color: '#dc3545' }}>{t('Issues')}</h3>
              <ul className='issue-list'>
                {introspection.temporalSupport.issues.map((issue, index) => (
                  <li key={index} style={{ color: '#dc3545' }}>⚠️ {issue}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h3 style={{ color: '#28a745' }}>{t('Recommendations')}</h3>
            <ul className='recommendation-list'>
              {introspection.recommendations.map((rec, index) => (
                <li key={index} style={{ color: '#28a745' }}>✅ {rec}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

             {/* Transaction Validation */}
       {health.isConnected && (
         <div className='validation-section'>
           <h2>{t('Transaction Validation')}</h2>
           <ValidationTest baseUrl={getBaseUrl()} />
         </div>
       )}

       {/* API Documentation */}
       <div className='api-docs'>
         <Card>
           <h3>{t('Available API Endpoints')}</h3>
           <div className='endpoint-list'>
             <div className='endpoint-item'>
               <code>GET /health</code>
               <span>{t('Basic health check')}</span>
             </div>
             <div className='endpoint-item'>
               <code>POST /api/v1/temporal/submit</code>
               <span>{t('Submit temporal transaction')}</span>
             </div>
             <div className='endpoint-item'>
               <code>GET /api/v1/temporal/status</code>
               <span>{t('Get service status')}</span>
             </div>
             <div className='endpoint-item'>
               <code>POST /api/v1/temporal/validate</code>
               <span>{t('Validate transaction')}</span>
             </div>
             <div className='endpoint-item'>
               <code>GET /api/v1/temporal/introspection</code>
               <span>{t('Node introspection')}</span>
             </div>
           </div>
         </Card>
       </div>
    </StyledDiv>
  );
}

const StyledDiv = styled.div`
  .status-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .status-indicator {
    font-weight: bold;
    font-size: 1.1rem;
    
    .response-time {
      color: var(--color-summary);
      font-size: 0.9rem;
      font-weight: normal;
    }
    
    .sub-info {
      font-size: 0.8rem;
      font-weight: normal;
      color: var(--color-summary);
      margin-top: 0.25rem;
    }
  }

  .endpoint {
    font-family: monospace;
    font-size: 0.9rem;
    background: var(--bg-input);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .actions {
    margin-bottom: 2rem;
    text-align: center;
  }

  .error-message {
    background: var(--bg-input);
    border: 1px solid #dc3545;
    border-radius: 0.25rem;
    padding: 1rem;
    color: #dc3545;
    margin: 1rem 0;
    
    .error-help {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: var(--color-summary);
    }
  }

     .temporal-status, .introspection, .validation-section, .api-docs {
    margin-top: 2rem;
    
    h2 {
      margin-bottom: 1rem;
    }
    
    h3 {
      margin: 1rem 0 0.5rem 0;
    }
  }

  .timestamp-info, .chain-info {
    .sub-info {
      font-size: 0.8rem;
      color: var(--color-summary);
      margin-top: 0.25rem;
    }
  }

  .readiness-score {
    font-weight: bold;
    font-size: 1.1rem;
  }

  .key-info, .chainspec-info {
    .key-row {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 0.5rem;
      
      strong {
        min-width: 120px;
      }
      
      .key-value {
        font-family: monospace;
        font-size: 0.85rem;
        background: var(--bg-input);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        word-break: break-all;
      }
    }
  }

  .pallet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    
    .pallet-section {
      h4 {
        margin-bottom: 0.5rem;
        color: var(--color-summary);
      }
      
      .method-list {
        list-style: none;
        padding: 0;
        
        li {
          margin-bottom: 0.25rem;
          
          code {
            font-size: 0.85rem;
            background: var(--bg-input);
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
          }
        }
      }
    }
  }

  .rpc-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.5rem;
    
    .rpc-method {
      code {
        font-size: 0.9rem;
        background: var(--bg-input);
        padding: 0.375rem 0.75rem;
        border-radius: 0.25rem;
        display: block;
      }
    }
  }

  .issue-list, .recommendation-list {
    list-style: none;
    padding: 0;
    
    li {
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-input);
      border-radius: 0.25rem;
    }
  }

  .endpoint-list {
    .endpoint-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: var(--bg-input);
      border-radius: 0.25rem;
      
      code {
        font-weight: bold;
        color: #007bff;
      }
      
      span {
        color: var(--color-summary);
      }
    }
  }
`;

export default React.memo(Overview); 