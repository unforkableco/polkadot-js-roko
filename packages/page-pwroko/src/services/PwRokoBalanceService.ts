// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';

export interface PwRokoBalances {
  free: bigint;           // Balance libre/disponible
  staked: bigint;         // Balance stakée  
  pendingUnlock: bigint;  // En période d'unlock
  readyUnlock: bigint;    // Prêt à unlock
  totalOwned: bigint;     // TOTAL réel = free + staked + unlocks
}

// Constantes pour le precompile (à ajuster selon votre configuration)
const PWROKO_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000800';

const SELECTORS = {
  BALANCE_OF: '0x70a08231',           // balanceOf(address)
  STAKED_BALANCE: '0x1234abcd',      // getStakedBalance(address) - à définir
  PENDING_UNLOCK: '0x5678efgh',      // getPendingUnlock(address) - à définir
  READY_UNLOCK: '0x9abc1234'         // getReadyUnlock(address) - à définir
};

export class PwRokoBalanceService {
  constructor(private api: ApiPromise) {}

  // Helper pour encoder l'adresse
  private encodeAddress(userAddress: string): string {
    // Conversion d'adresse SS58 vers format EVM si nécessaire
    // Cette implémentation dépend de votre setup spécifique
    return userAddress;
  }

  // Helper pour appeler le precompile
  private async callPrecompile(
    precompileAddress: string,
    selector: string,
    params: string
  ): Promise<bigint> {
    try {
      // Utilisation de l'API Polkadot.js pour appeler le precompile
      // Cette implémentation dépend de votre configuration spécifique
      const result = await this.api.rpc.eth.call({
        to: precompileAddress,
        data: selector + params.slice(2) // Enlever le 0x du params
      });
      
      return BigInt(result.toString());
    } catch (error) {
      console.error('Erreur lors de l\'appel precompile:', error);
      return BigInt(0);
    }
  }

  // Récupérer la balance LIBRE (pas totale !)
  async getFreeBalance(userAddress: string): Promise<bigint> {
    try {
      const params = this.encodeAddress(userAddress);
      return this.callPrecompile(
        PWROKO_PRECOMPILE_ADDRESS, 
        SELECTORS.BALANCE_OF,  // Cette fonction retourne SEULEMENT les tokens libres !
        params
      );
    } catch (error) {
      console.error('Erreur getFreeBalance:', error);
      return BigInt(0);
    }
  }

  // Récupérer la balance stakée
  async getStakedBalance(userAddress: string): Promise<bigint> {
    try {
      const params = this.encodeAddress(userAddress);
      return this.callPrecompile(
        PWROKO_PRECOMPILE_ADDRESS,
        SELECTORS.STAKED_BALANCE,
        params
      );
    } catch (error) {
      console.error('Erreur getStakedBalance:', error);
      return BigInt(0);
    }
  }

  // Récupérer les tokens en attente d'unlock
  async getPendingUnlockBalance(userAddress: string): Promise<bigint> {
    try {
      const params = this.encodeAddress(userAddress);
      return this.callPrecompile(
        PWROKO_PRECOMPILE_ADDRESS,
        SELECTORS.PENDING_UNLOCK,
        params
      );
    } catch (error) {
      console.error('Erreur getPendingUnlockBalance:', error);
      return BigInt(0);
    }
  }

  // Récupérer les tokens prêts à unlock
  async getReadyUnlockBalance(userAddress: string): Promise<bigint> {
    try {
      const params = this.encodeAddress(userAddress);
      return this.callPrecompile(
        PWROKO_PRECOMPILE_ADDRESS,
        SELECTORS.READY_UNLOCK,
        params
      );
    } catch (error) {
      console.error('Erreur getReadyUnlockBalance:', error);
      return BigInt(0);
    }
  }

  // Calculer le VRAI total et récupérer toutes les balances
  async getAllBalances(userAddress: string): Promise<PwRokoBalances> {
    try {
      const [free, staked, pendingUnlock, readyUnlock] = await Promise.all([
        this.getFreeBalance(userAddress),        // Tokens libres seulement
        this.getStakedBalance(userAddress),      // Tokens stakés
        this.getPendingUnlockBalance(userAddress), // En unlock
        this.getReadyUnlockBalance(userAddress)    // Prêts à unlock
      ]);

      // LE VRAI TOTAL = tous les états combinés
      const totalOwned = free + staked + pendingUnlock + readyUnlock;

      return {
        free,           // Renommé pour éviter la confusion
        staked,
        pendingUnlock,
        readyUnlock,
        totalOwned      // Le vrai total de vos pwROKO
      };
    } catch (error) {
      console.error('Erreur getAllBalances:', error);
      return {
        free: BigInt(0),
        staked: BigInt(0),
        pendingUnlock: BigInt(0),
        readyUnlock: BigInt(0),
        totalOwned: BigInt(0)
      };
    }
  }

  // Helper pour formater les balances pour l'affichage
  formatBalance(balance: bigint): string {
    // Conversion en format d'affichage avec décimales
    // Assumant 18 décimales pour pwROKO
    const divisor = BigInt(10 ** 18);
    const whole = balance / divisor;
    const fractional = balance % divisor;
    
    if (fractional === BigInt(0)) {
      return whole.toString();
    }
    
    const fractionalStr = fractional.toString().padStart(18, '0');
    const trimmed = fractionalStr.replace(/0+$/, '');
    
    return `${whole}.${trimmed}`;
  }

  // Calculer le pourcentage d'un composant par rapport au total
  calculatePercentage(amount: bigint, total: bigint): number {
    if (total === BigInt(0)) return 0;
    return (Number(amount * BigInt(10000)) / Number(total)) / 100;
  }
} 