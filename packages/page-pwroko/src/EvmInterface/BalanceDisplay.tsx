// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { Button } from '@polkadot/react-components';
import { useTranslation } from '../translate.js';
import type { Balances } from './types.js';

interface Props {
  balances: Balances;
  onRefresh: () => void;
}

function BalanceDisplay ({ balances, onRefresh }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { 
    rokoFreeBalance, 
    rokoReservedBalance, 
    rokoTotalBalance, 
    pwRokoBalance, 
    
    // Nouvelles balances détaillées
    freeAmount,
    bondedAmount,
    unbondingAmount,
    redeemableAmount,
    pendingConversionAmount,
    readyConversionAmount,
    pendingUnlockAmount,
    readyUnlockAmount,
    totalOwned,
    
    // Informations de nomination
    hasNominations,
    nominatedValidators,
    
    // Legacy
    stakedAmount
  } = balances;

  // Calcul du TOTAL POSSÉDÉ avec les nouveaux champs (utilise totalOwned si disponible)
  const calculatedTotal = totalOwned || (
    parseFloat(freeAmount || '0') + 
    parseFloat(bondedAmount || '0') + 
    parseFloat(unbondingAmount || '0') +
    parseFloat(redeemableAmount || '0') +
    parseFloat(pendingUnlockAmount || '0') +
    parseFloat(readyUnlockAmount || '0')
  ).toFixed(6).replace(/\.?0+$/, '');

  // Calcul des unlock
  const totalUnlockAmount = pendingUnlockAmount || '0'; // Le "total" est en fait le pending
  
  // Calcul des pourcentages
  const calculatePercentage = (amount: string, total: string): string => {
    const amountNum = parseFloat(amount || '0');
    const totalNum = parseFloat(total || '0');
    if (totalNum === 0) return '0.0';
    return ((amountNum / totalNum) * 100).toFixed(1);
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.25rem'
    }}>
      {/* Section ROKO */}
      <div style={{ 
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '0.25rem',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h4 style={{ 
          margin: '0 0 1rem 0', 
          textAlign: 'center', 
          fontSize: '1.1rem', 
          fontWeight: 'bold',
          color: 'var(--color-text)'
        }}>💰 {t('ROKO Balances')}</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem',
          textAlign: 'center'
        }}>
          <BalanceCard
            label={t('🟢 Free')}
            value={rokoFreeBalance || '0'}
            unit="ROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
          />
          <BalanceCard
            label={t('🟠 Reserved')}
            value={rokoReservedBalance || '0'}
            unit="ROKO"
            color="#FF9800"
            backgroundColor="rgba(255, 152, 0, 0.1)"
            borderColor="rgba(255, 152, 0, 0.3)"
          />
          <BalanceCard
            label={t('🔵 Total')}
            value={rokoTotalBalance || '0'}
            unit="ROKO"
            color="#2196F3"
            backgroundColor="rgba(33, 150, 243, 0.1)"
            borderColor="rgba(33, 150, 243, 0.3)"
          />
        </div>
      </div>
      
      {/* Section pwROKO - SIMPLIFIÉE SANS REDONDANCE */}
      <div style={{ 
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '0.25rem',
      }}>
        <h4 style={{ 
          margin: '0 0 1rem 0', 
          textAlign: 'center', 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          color: 'var(--color-text)'
        }}>⚡ {t('pwROKO Balances')}</h4>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem',
          textAlign: 'center'
        }}>
          {/* Balance libre (disponible) */}
          <BalanceCard
            label={t('🆓 Free')}
            value={freeAmount || '0'}
            unit="pwROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
          />
          
          {/* Balance bondée (staking actif) */}
          <BalanceCard
            label={t('🔒 Bonded (Staking)')}
            value={bondedAmount || '0'}
            unit="pwROKO"
            color="#FF5722"
            backgroundColor="rgba(255, 87, 34, 0.1)"
            borderColor="rgba(255, 87, 34, 0.3)"
          />
          
          {/* En unbonding (période d'attente staking) */}
          <BalanceCard
            label={t('⏳ Unbonding pending')}
            value={unbondingAmount || '0'}
            unit="pwROKO"
            color="#FF9800"
            backgroundColor="rgba(255, 152, 0, 0.1)"
            borderColor="rgba(255, 152, 0, 0.3)"
          />
          
          {/* Prêt à récupérer du staking */}
          <BalanceCard
            label={t('✅ Ready to unstake')}
            value={redeemableAmount || '0'}
            unit="pwROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
          />
          
          {/* Unlock en cours (total des requests) */}
          <BalanceCard
            label={t('⏳ Unlock pending')}
            value={totalUnlockAmount || '0'}
            unit="pwROKO"
            color="#FF9800"
            backgroundColor="rgba(255, 152, 0, 0.1)"
            borderColor="rgba(255, 152, 0, 0.3)"
          />
          
          {/* Prêt à unlock */}
          <BalanceCard
            label={t('✅ Ready to unlock')}
            value={readyUnlockAmount || '0'}
            unit="pwROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
          />
          
          {/* Total possédé */}
          <BalanceCard
            label={t('💎 Total Owned')}
            value={calculatedTotal || '0'}
            unit="pwROKO"
            color="#2196F3"
            backgroundColor="rgba(33, 150, 243, 0.1)"
            borderColor="rgba(33, 150, 243, 0.3)"
            percentage={calculatePercentage(readyUnlockAmount || '0', calculatedTotal)}
          />
          
          {/* Total possédé */}
          <BalanceCard
            label={t('💎 Total Owned')}
            value={calculatedTotal || '0'}
            unit="pwROKO"
            color="#2196F3"
            backgroundColor="rgba(33, 150, 243, 0.1)"
            borderColor="rgba(33, 150, 243, 0.3)"
          />
        </div>
      </div>

      {/* Section Informations de Nomination */}
      {parseFloat(bondedAmount || '0') > 0 && (
        <div style={{
          padding: '1rem',
          backgroundColor: hasNominations ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          borderRadius: '0.25rem',
          border: `2px solid ${hasNominations ? '#4CAF50' : '#F44336'}`
        }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            textAlign: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: hasNominations ? '#4CAF50' : '#F44336'
          }}>
            {hasNominations ? '✅ Nominated Validators' : '⚠️ No Nominations'}
          </h4>
          
          {!hasNominations ? (
            <div style={{
              textAlign: 'center',
              color: '#F44336',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              <p style={{ margin: '0 0 0.5rem' }}>
                🚨 {t('Your bonded tokens generate NO rewards!')}
              </p>
              <p style={{ margin: '0', fontSize: '0.8rem', opacity: 0.8 }}>
                {t('You must nominate validators to start earning rewards.')}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: '0 0 1rem',
                color: '#4CAF50',
                fontWeight: '500'
              }}>
                ✅ {t('Your tokens generate rewards via')} {nominatedValidators.length} {t('validator(s)')}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.8rem'
              }}>
                {nominatedValidators.map((validator, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      borderRadius: '0.25rem',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}
                  >
                    {validator}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Button
          icon='sync'
          label={t('🔄 Refresh Balances')}
          onClick={onRefresh}
        />
      </div>
    </div>
  );
}

interface BalanceCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  percentage?: string;
}

function BalanceCard({ label, value, unit, color, backgroundColor, borderColor, percentage }: BalanceCardProps): React.ReactElement {
  return (
    <div style={{ 
      padding: '1rem',
      backgroundColor,
      borderRadius: '0.5rem',
      border: `2px solid ${borderColor}`,
      transition: 'transform 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: '600' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        {unit}
        {percentage && (
          <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.75rem' }}>
            ({percentage}%)
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(BalanceDisplay);