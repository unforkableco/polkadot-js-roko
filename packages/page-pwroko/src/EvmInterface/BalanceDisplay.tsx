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
        }}>💰 {t('Balances ROKO')}</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem',
          textAlign: 'center'
        }}>
          <BalanceCard
            label={t('🟢 Libre')}
            value={rokoFreeBalance || '0'}
            unit="ROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
          />
          <BalanceCard
            label={t('🟠 Réservé')}
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
        border: '2px solid #4ecdc4'
      }}>
        <h4 style={{ 
          margin: '0 0 1rem 0', 
          textAlign: 'center', 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          color: '#ff6b6b'
        }}>⚡ {t('Balances pwROKO Détaillées')}</h4>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem',
          textAlign: 'center'
        }}>
          {/* Balance libre (disponible) */}
          <BalanceCard
            label={t('🆓 Libre')}
            value={freeAmount || '0'}
            unit="pwROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
            percentage={calculatePercentage(freeAmount || '0', calculatedTotal)}
          />
          
          {/* Balance bondée (staking actif) */}
          <BalanceCard
            label={t('🔒 Bondé (Staking)')}
            value={bondedAmount || '0'}
            unit="pwROKO"
            color="#FF5722"
            backgroundColor="rgba(255, 87, 34, 0.1)"
            borderColor="rgba(255, 87, 34, 0.3)"
            percentage={calculatePercentage(bondedAmount || '0', calculatedTotal)}
          />
          
          {/* En unbonding (période d'attente staking) */}
          <BalanceCard
            label={t('⏳ Unbonding')}
            value={unbondingAmount || '0'}
            unit="pwROKO"
            color="#FF9800"
            backgroundColor="rgba(255, 152, 0, 0.1)"
            borderColor="rgba(255, 152, 0, 0.3)"
            percentage={calculatePercentage(unbondingAmount || '0', calculatedTotal)}
          />
          
          {/* Prêt à récupérer du staking */}
          <BalanceCard
            label={t('✅ Prêt à récupérer')}
            value={redeemableAmount || '0'}
            unit="pwROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
            percentage={calculatePercentage(redeemableAmount || '0', calculatedTotal)}
          />
          
          {/* Unlock en attente pwROKO -> ROKO */}
          <BalanceCard
            label={t('⏳ Unlock en cours')}
            value={pendingUnlockAmount || '0'}
            unit="pwROKO"
            color="#9C27B0"
            backgroundColor="rgba(156, 39, 176, 0.1)"
            borderColor="rgba(156, 39, 176, 0.3)"
            percentage={calculatePercentage(pendingUnlockAmount || '0', calculatedTotal)}
          />
          
          {/* Prêt à unlock */}
          <BalanceCard
            label={t('✅ Prêt à unlock')}
            value={readyUnlockAmount || '0'}
            unit="pwROKO"
            color="#2196F3"
            backgroundColor="rgba(33, 150, 243, 0.1)"
            borderColor="rgba(33, 150, 243, 0.3)"
            percentage={calculatePercentage(readyUnlockAmount || '0', calculatedTotal)}
          />
          
          {/* Total possédé */}
          <BalanceCard
            label={t('💎 Total Possédé')}
            value={calculatedTotal || '0'}
            unit="pwROKO"
            color="#E91E63"
            backgroundColor="rgba(233, 30, 99, 0.1)"
            borderColor="rgba(233, 30, 99, 0.3)"
            percentage="100.0"
          />
        </div>
      </div>

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