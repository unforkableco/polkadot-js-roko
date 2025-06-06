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
    pendingUnlockAmount,
    stakedAmount,
    delegatedAmount
  } = balances;

  // Calcul du montant libre : Total pwROKO - Bonded - Delegated
  const freePwRoko = (
    parseFloat(pwRokoBalance || '0') - 
    parseFloat(stakedAmount || '0') - 
    parseFloat(delegatedAmount || '0')
  ).toFixed(6).replace(/\.?0+$/, '');

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
      
      {/* Section pwROKO */}
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
        }}>⚡ {t('Balances pwROKO')}</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem',
          textAlign: 'center'
        }}>
          <BalanceCard
            label={t('🟢 Bonded (Staked)')}
            value={stakedAmount || '0'}
            unit="pwROKO"
            color="#4CAF50"
            backgroundColor="rgba(76, 175, 80, 0.1)"
            borderColor="rgba(76, 175, 80, 0.3)"
          />
          <BalanceCard
            label={t('🟡 Delegated')}
            value={delegatedAmount || '0'}
            unit="pwROKO"
            color="#FFC107"
            backgroundColor="rgba(255, 193, 7, 0.1)"
            borderColor="rgba(255, 193, 7, 0.3)"
          />
          <BalanceCard
            label={t('🟠 Unlocking')}
            value={pendingUnlockAmount || '0'}
            unit="pwROKO"
            color="#FF9800"
            backgroundColor="rgba(255, 152, 0, 0.1)"
            borderColor="rgba(255, 152, 0, 0.3)"
          />
          <BalanceCard
            label={t('🔵 Total pwROKO')}
            value={pwRokoBalance || '0'}
            unit="pwROKO"
            color="#2196F3"
            backgroundColor="rgba(33, 150, 243, 0.1)"
            borderColor="rgba(33, 150, 243, 0.3)"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Button
          icon='sync'
          label={t('Refresh Balances')}
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
}

function BalanceCard({ label, value, unit, color, backgroundColor, borderColor }: BalanceCardProps): React.ReactElement {
  return (
    <div style={{ 
      padding: '0.75rem',
      backgroundColor,
      borderRadius: '0.25rem',
      border: `1px solid ${borderColor}`
    }}>
      <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
        {unit}
      </div>
    </div>
  );
}

export default React.memo(BalanceDisplay);