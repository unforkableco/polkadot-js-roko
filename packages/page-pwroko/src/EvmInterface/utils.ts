// Copyright 2017-2025 @polkadot/app-pwroko authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ethers } from 'ethers';
import { BN } from '@polkadot/util';
import type { ApiPromise } from '@polkadot/api';

import { PWROKO_PRECOMPILE_ADDRESS, STAKING_PRECOMPILE_ADDRESS } from './constants.js';

export const getRokoBalance = async (address: string): Promise<string> => {
  try {
    if (!address || !window.ethereum) {
      return '0';
    }
    
    console.log('Getting ROKO balance for address:', address);
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.utils.formatEther(balance);
    
    console.log('ROKO balance raw:', balance.toString());
    console.log('ROKO balance formatted:', formattedBalance);
    
    return formattedBalance;
  } catch (error: any) {
    console.error('Error getting ROKO balance:', error);
    return `Error: ${error.message}`;
  }
};

export const getDetailedRokoBalances = async (address: string, api: ApiPromise | null) => {
  try {
    if (!address || !api) {
      return {
        free: '0',
        reserved: '0',
        total: '0'
      };
    }

    console.log('Getting detailed ROKO balances for address:', address);

    const accountInfo = await api.query.system.account(address);
    
    if (accountInfo && accountInfo.data) {
      const data = accountInfo.data;
      
      const freeBalance = data.free || new BN(0);
      const reservedBalance = data.reserved || new BN(0);
      const totalBalance = freeBalance.add(reservedBalance);
      
      const divisor = new BN('1000000000000000000'); // 10^18
      
      const freeFormatted = freeBalance.div(divisor).toString() + '.' + 
        freeBalance.mod(divisor).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 6);
      const reservedFormatted = reservedBalance.div(divisor).toString() + '.' + 
        reservedBalance.mod(divisor).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 6);
      const totalFormatted = totalBalance.div(divisor).toString() + '.' + 
        totalBalance.mod(divisor).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 6);

      console.log('Detailed balances:');
      console.log('- Free:', freeBalance.toString(), '=>', freeFormatted);
      console.log('- Reserved:', reservedBalance.toString(), '=>', reservedFormatted);
      console.log('- Total:', totalBalance.toString(), '=>', totalFormatted);

      return {
        free: freeFormatted.replace(/\.$/, ''),
        reserved: reservedFormatted.replace(/\.$/, ''),
        total: totalFormatted.replace(/\.$/, '')
      };
    } else {
      console.log('No account data found');
      return {
        free: '0',
        reserved: '0',
        total: '0'
      };
    }
  } catch (error: any) {
    console.error('Error getting detailed ROKO balances:', error);
    return {
      free: `Error: ${error.message}`,
      reserved: `Error: ${error.message}`,
      total: `Error: ${error.message}`
    };
  }
};

export const getPwRokoBalance = async (address: string): Promise<string> => {
  try {
    if (!address || !window.ethereum) {
      return 'Missing address or ethereum provider';
    }
    
    const functionSelector = '0x70a08231';
    const formattedAddress = '000000000000000000000000' + address.slice(2);
    const data = `${functionSelector}${formattedAddress}`;
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const result = await provider.call({
      to: PWROKO_PRECOMPILE_ADDRESS,
      data: data
    });
    
    if (result === '0x' || !result) {
      return '0';
    }
    
    const balance = ethers.BigNumber.from(result);
    const formattedBalance = ethers.utils.formatEther(balance);
    return formattedBalance;
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
};

export const getUnlockAmounts = async (address: string) => {
  try {
    if (!address || !window.ethereum) {
      return {
        pending: 'Missing address or ethereum provider',
        ready: 'Missing address or ethereum provider'
      };
    }
    
    const pendingUnlockSelector = '0xb52c8714';
    const readyUnlockSelector = '0x719f25e8';
    const formattedAddress = '000000000000000000000000' + address.slice(2);
    
    const pendingUnlockData = `${pendingUnlockSelector}${formattedAddress}`;
    const readyUnlockData = `${readyUnlockSelector}${formattedAddress}`;
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const pendingUnlockResult = await provider.call({
      to: PWROKO_PRECOMPILE_ADDRESS,
      data: pendingUnlockData
    });
    const readyUnlockResult = await provider.call({
      to: PWROKO_PRECOMPILE_ADDRESS,
      data: readyUnlockData
    });
    
    let pending = '0';
    let ready = '0';
    
    if (pendingUnlockResult !== '0x' && pendingUnlockResult) {
      const pendingUnlockBalance = ethers.BigNumber.from(pendingUnlockResult);
      pending = ethers.utils.formatEther(pendingUnlockBalance);
    }
    
    if (readyUnlockResult !== '0x' && readyUnlockResult) {
      const readyUnlockBalance = ethers.BigNumber.from(readyUnlockResult);
      ready = ethers.utils.formatEther(readyUnlockBalance);
    }
    
    return { pending, ready };
  } catch (error: any) {
    return {
      pending: `Error: ${error.message}`,
      ready: `Error: ${error.message}`
    };
  }
};

export const getStakedAmount = async (address: string): Promise<string> => {
  try {
    if (!address || !window.ethereum) {
      return 'Missing address or ethereum provider';
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const formattedAddress = '000000000000000000000000' + address.slice(2);
    
    // Essaie plusieurs méthodes pour trouver les montants stakés
    console.log('Debug: Attempting to get staked amount for address:', address);
    
    // Méthode 1: stakedBalanceOf du precompile pwroko (0x821f56a5)
    try {
      const stakedBalanceSelector = '0x821f56a5';
      const data1 = `${stakedBalanceSelector}${formattedAddress}`;
      
      const result1 = await provider.call({
        to: PWROKO_PRECOMPILE_ADDRESS,
        data: data1
      });
      
      if (result1 && result1 !== '0x') {
        const balance = ethers.BigNumber.from(result1);
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log('Debug: stakedBalanceOf from pwroko precompile:', formattedBalance);
        if (parseFloat(formattedBalance) > 0) {
          return formattedBalance;
        }
      }
    } catch (e) {
      console.log('Debug: stakedBalanceOf failed:', e);
    }
    
    // Méthode 2: staked_balance_of du precompile staking (0x00000005)
    try {
      const stakingBalanceSelector = '0x00000005';
      const data2 = `${stakingBalanceSelector}${formattedAddress}`;
      
      const result2 = await provider.call({
        to: STAKING_PRECOMPILE_ADDRESS,
        data: data2
      });
      
      if (result2 && result2 !== '0x') {
        const balance = ethers.BigNumber.from(result2);
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log('Debug: staked_balance_of from staking precompile:', formattedBalance);
        if (parseFloat(formattedBalance) > 0) {
          return formattedBalance;
        }
      }
    } catch (e) {
      console.log('Debug: staked_balance_of failed:', e);
    }
    
    // Méthode 3: Vérifier les balances verrouillées directement
    // TODO: Cela nécessiterait d'accéder aux storage du pallet pwroko via Substrate API
    
    console.log('Debug: No staked amount found, returning 0');
    return '0';
    
  } catch (error: any) {
    console.error('Debug: getStakedAmount error:', error);
    return `Error: ${error.message}`;
  }
};

export const getStakedAmountSubstrate = async (address: string, api: ApiPromise | null): Promise<string> => {
  try {
    if (!address || !api) {
      return '0';
    }
    
    console.log('Debug: Attempting to get staked amount via Substrate API for address:', address);
    
    // Récupère les montants verrouillés du pallet pwroko
    try {
      const lockedBalance = await api.query.pwRoko?.lockedBalances(address);
      const rewardLocked = await api.query.pwRoko?.rewardLockedBalances(address);
      
      const locked = new BN((lockedBalance as any)?.toString() || '0');
      const reward = new BN((rewardLocked as any)?.toString() || '0');
      const totalLocked = locked.add(reward);
      
      console.log('Debug: Substrate API results:');
      console.log('- lockedBalance:', locked.toString());
      console.log('- rewardLocked:', reward.toString());
      console.log('- totalLocked:', totalLocked.toString());
      
      // Convertir en format lisible (18 decimales)
      const divisor = new BN('1000000000000000000'); // 10^18
      const formattedBalance = totalLocked.div(divisor).toString() + '.' + 
        totalLocked.mod(divisor).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 6);
      
      return formattedBalance.replace(/\.$/, '') || '0';
    } catch (e) {
      console.log('Debug: Substrate API query failed:', e);
      return '0';
    }
  } catch (error: any) {
    console.error('Debug: getStakedAmountSubstrate error:', error);
    return `Error: ${error.message}`;
  }
};

export const getDelegatedAmount = async (address: string): Promise<string> => {
  try {
    if (!address) {
      return 'Missing address';
    }
    
    // TODO: Implémenter la récupération du montant délégué quand le precompile sera disponible
    // Pour l'instant, retourner 0 car la délégation n'est pas encore implémentée en EVM
    return '0';
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
};

export const buildNominateData = (validators: string[]): string => {
  console.log("Building nominate data for validators:", validators);
  
  // Format simple: selector (4 bytes) + count (32 bytes) + addresses (32 bytes each, left-padded)
  const selector = '00000003';
  
  // Count en format uint256 (32 bytes) avec ethers.utils.hexZeroPad
  const count = ethers.utils.hexZeroPad(`0x${validators.length.toString(16)}`, 32).slice(2);
  
  // Chaque adresse doit être paddée à 32 bytes avec ethers.utils.hexZeroPad
  const paddedAddresses = validators.map(addr => {
    return ethers.utils.hexZeroPad(addr, 32).slice(2);
  }).join('');
  
  const data = '0x' + selector + count + paddedAddresses;
  
  console.log("Nominate data breakdown:");
  console.log("- Selector:", selector);
  console.log("- Count:", count, "(", validators.length, "validators )");
  console.log("- Addresses:", paddedAddresses);
  console.log("- Final data:", data);
  console.log("- Data length:", data.length, "characters (", (data.length - 2) / 2, "bytes )");
  
  return data;
};

export const nominateValidators = async (validators: string[], fromAddress: string): Promise<string> => {
  try {
    if (!validators.length) {
      throw new Error('No validators provided');
    }
    
    if (!fromAddress) {
      throw new Error('No from address provided');
    }
    
    if (!window.ethereum) {
      throw new Error('Ethereum provider not available');
    }
    
    console.log('Nominating validators:', validators);
    console.log('From address:', fromAddress);
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Construire les données de la transaction
    const data = buildNominateData(validators);
    
    // Préparer la transaction
    const transaction = {
      to: STAKING_PRECOMPILE_ADDRESS,
      data: data,
      from: fromAddress,
      gasLimit: ethers.utils.hexlify(500000), // Limite de gas généreuse
    };
    
    console.log('Transaction prepared:', transaction);
    
    // Envoyer la transaction
    const tx = await signer.sendTransaction(transaction);
    console.log('Transaction sent:', tx.hash);
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error nominating validators:', error);
    throw error;
  }
};