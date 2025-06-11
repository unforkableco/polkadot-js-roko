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

export const getFreeAmount = async (address: string): Promise<string> => {
  try {
    if (!address || !window.ethereum) {
      return '0';
    }
    
    console.log('🆓 Getting FREE pwROKO balance for address:', address);
    
    const freeBalanceSelector = '0x70a08231';
    const formattedAddress = '000000000000000000000000' + address.slice(2);
    const data = `${freeBalanceSelector}${formattedAddress}`;
    
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
    
    console.log('🆓 Free pwROKO balance:', formattedBalance);
    return formattedBalance;
  } catch (error: any) {
    console.error('Error getting free pwROKO amount:', error);
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
    
    console.log('🔍 DEBUG unlock amounts for:', address);
    console.log('🔍 Pending unlock data:', pendingUnlockData);
    console.log('🔍 Ready unlock data:', readyUnlockData);
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const pendingUnlockResult = await provider.call({
      to: PWROKO_PRECOMPILE_ADDRESS,
      data: pendingUnlockData
    });
    const readyUnlockResult = await provider.call({
      to: PWROKO_PRECOMPILE_ADDRESS,
      data: readyUnlockData
    });
    
    console.log('🔍 Raw pending unlock result:', pendingUnlockResult);
    console.log('🔍 Raw ready unlock result:', readyUnlockResult);
    
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
    
    console.log('⏳ Final pending unlock:', pending);
    console.log('✅ Final ready unlock:', ready);
    
    return { pending, ready };
  } catch (error: any) {
    console.error('Error in getUnlockAmounts:', error);
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
    
    console.log('🔒 Debug: Attempting to get staked amount for address:', address);
    
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
        console.log('🔒 Debug: stakedBalanceOf from pwroko precompile:', formattedBalance);
        if (parseFloat(formattedBalance) > 0) {
          return formattedBalance;
        }
      }
    } catch (e) {
      console.log('🔒 Debug: stakedBalanceOf failed:', e);
    }
    
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
        console.log('🔒 Debug: staked_balance_of from staking precompile:', formattedBalance);
        if (parseFloat(formattedBalance) > 0) {
          return formattedBalance;
        }
      }
    } catch (e) {
      console.log('🔒 Debug: staked_balance_of failed:', e);
    }
    
    console.log('🔒 Debug: No staked amount found, returning 0');
    return '0';
    
  } catch (error: any) {
    console.error('🔒 Debug: getStakedAmount error:', error);
    return `Error: ${error.message}`;
  }
};

export const getStakedAmountSubstrate = async (address: string, api: ApiPromise | null): Promise<string> => {
  try {
    if (!address || !api) {
      return '0';
    }
    
    console.log('🔒 Debug: Attempting to get staked amount via Substrate API for address:', address);
    
    try {
      const lockedBalance = await api.query.pwRoko?.lockedBalances(address);
      const rewardLocked = await api.query.pwRoko?.rewardLockedBalances(address);
      
      const locked = new BN((lockedBalance as any)?.toString() || '0');
      const reward = new BN((rewardLocked as any)?.toString() || '0');
      const totalLocked = locked.add(reward);
      
      console.log('🔒 Debug: Substrate API results:');
      console.log('- lockedBalance:', locked.toString());
      console.log('- rewardLocked:', reward.toString());
      console.log('- totalLocked:', totalLocked.toString());
      
      const divisor = new BN('1000000000000000000'); // 10^18
      const formattedBalance = totalLocked.div(divisor).toString() + '.' + 
        totalLocked.mod(divisor).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 6);
      
      return formattedBalance.replace(/\.$/, '') || '0';
    } catch (e) {
      console.log('🔒 Debug: Substrate API query failed:', e);
      return '0';
    }
  } catch (error: any) {
    console.error('🔒 Debug: getStakedAmountSubstrate error:', error);
    return `Error: ${error.message}`;
  }
};

export const getDelegatedAmount = async (address: string): Promise<string> => {
  try {
    if (!address) {
      return 'Missing address';
    }
    
    return '0';
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
};

export const getAllPwRokoBalances = async (address: string) => {
  try {
    console.log('💰 Getting ALL pwROKO balances for address:', address);
    
    const [freeAmount, stakedAmount, unlockAmounts] = await Promise.all([
      getFreeAmount(address),
      getStakedAmount(address),
      getUnlockAmounts(address)
    ]);
    
    const pendingUnlockAmount = unlockAmounts.pending;
    const readyUnlockAmount = unlockAmounts.ready;
    
    const totalOwned = (
      parseFloat(freeAmount || '0') + 
      parseFloat(stakedAmount || '0') + 
      parseFloat(pendingUnlockAmount || '0') +
      parseFloat(readyUnlockAmount || '0')
    ).toFixed(6).replace(/\.?0+$/, '');
    
    console.log('💰 Complete pwROKO balance breakdown:');
    console.log('🆓 Free:', freeAmount);
    console.log('🔒 Staked:', stakedAmount);
    console.log('⏳ Pending unlock:', pendingUnlockAmount);
    console.log('✅ Ready unlock:', readyUnlockAmount);
    console.log('💎 TOTAL OWNED:', totalOwned);
    
    return {
      freeAmount,
      stakedAmount,
      pendingUnlockAmount,
      readyUnlockAmount,
      totalOwned
    };
  } catch (error: any) {
    console.error('Error getting all pwROKO balances:', error);
    return {
      freeAmount: `Error: ${error.message}`,
      stakedAmount: `Error: ${error.message}`,
      pendingUnlockAmount: `Error: ${error.message}`,
      readyUnlockAmount: `Error: ${error.message}`,
      totalOwned: '0'
    };
  }
};

export const buildNominateData = (validators: string[]): string => {
  console.log("Building nominate data for validators:", validators);
  
  const selector = '00000003';
  
  const count = ethers.utils.hexZeroPad(`0x${validators.length.toString(16)}`, 32).slice(2);
  
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
    
    const data = buildNominateData(validators);
    
    const transaction = {
      to: STAKING_PRECOMPILE_ADDRESS,
      data: data,
      from: fromAddress,
      gasLimit: ethers.utils.hexlify(500000),
    };
    
    console.log('Transaction prepared:', transaction);
    
    const tx = await signer.sendTransaction(transaction);
    console.log('Transaction sent:', tx.hash);
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error nominating validators:', error);
    throw error;
  }
};

// Nouvelle fonction pour récupérer les détails du staking via l'API Substrate
export const getStakingDetails = async (address: string, api: ApiPromise | null) => {
  try {
    if (!address || !api) {
      return {
        bonded: '0',
        unbonding: '0',
        redeemable: '0',
        staked: '0'
      };
    }

    console.log('🔍 Getting staking details via api.derive.staking.account for:', address);

    // Récupérer les informations de staking via l'API derive
    const stakingInfo = await api.derive.staking.account(address);
    
    if (!stakingInfo) {
      console.log('No staking info found');
      return {
        bonded: '0',
        unbonding: '0',
        redeemable: '0',
        staked: '0'
      };
    }

    const divisor = new BN('1000000000000000000'); // 10^18

    // Balance bondée (active dans le ledger)
    const bondedBalance = stakingInfo.stakingLedger?.active?.unwrap() || new BN(0);
    const bondedFormatted = formatBN(bondedBalance, divisor);

    // Balance en unbonding (somme de tous les unlocking)
    const unbondingBalance = (stakingInfo.unlocking || [])
      .filter(({ remainingEras, value }) => value.gt(new BN(0)) && remainingEras.gt(new BN(0)))
      .reduce((acc, { value }) => acc.add(value), new BN(0));
    const unbondingFormatted = formatBN(unbondingBalance, divisor);

    // Balance redeemable (prête à être récupérée)
    const redeemableBalance = stakingInfo.redeemable || new BN(0);
    const redeemableFormatted = formatBN(redeemableBalance, divisor);

    // Total staké = bonded + unbonding
    const totalStaked = bondedBalance.add(unbondingBalance);
    const stakedFormatted = formatBN(totalStaked, divisor);

    console.log('🔍 Staking details breakdown:');
    console.log('- Bonded (active):', bondedFormatted);
    console.log('- Unbonding:', unbondingFormatted);
    console.log('- Redeemable:', redeemableFormatted);
    console.log('- Total Staked:', stakedFormatted);

    return {
      bonded: bondedFormatted,
      unbonding: unbondingFormatted,
      redeemable: redeemableFormatted,
      staked: stakedFormatted
    };

  } catch (error: any) {
    console.error('Error getting staking details:', error);
    return {
      bonded: `Error: ${error.message}`,
      unbonding: `Error: ${error.message}`,
      redeemable: `Error: ${error.message}`,
      staked: `Error: ${error.message}`
    };
  }
};

// Helper pour formater les BN
const formatBN = (balance: BN, divisor: BN): string => {
  const formatted = balance.div(divisor).toString() + '.' + 
    balance.mod(divisor).toString().padStart(18, '0').replace(/0+$/, '').slice(0, 6);
  return formatted.replace(/\.$/, '') || '0';
};

// Fonction pour récupérer les détails de conversion pwROKO -> ROKO
export const getConversionDetails = async (address: string, api: ApiPromise | null) => {
  try {
    if (!address || !api) {
      return {
        pendingConversion: '0',
        readyConversion: '0'
      };
    }

    console.log('🔄 Getting conversion details for:', address);

    // Récupérer les informations de conversion via les storage du pallet pwRoko
    try {
      const conversionQueue = await api.query.pwRoko?.conversionQueue(address);
      const readyConversions = await api.query.pwRoko?.readyConversions(address);

      const divisor = new BN('1000000000000000000'); // 10^18

      const pendingConversion = new BN((conversionQueue as any)?.toString() || '0');
      const readyConversion = new BN((readyConversions as any)?.toString() || '0');

      const pendingFormatted = formatBN(pendingConversion, divisor);
      const readyFormatted = formatBN(readyConversion, divisor);

      console.log('🔄 Conversion details:');
      console.log('- Pending conversion:', pendingFormatted);
      console.log('- Ready conversion:', readyFormatted);

      return {
        pendingConversion: pendingFormatted,
        readyConversion: readyFormatted
      };

    } catch (e) {
      console.log('🔄 Conversion queries failed, trying alternative approach:', e);
      return {
        pendingConversion: '0',
        readyConversion: '0'
      };
    }

  } catch (error: any) {
    console.error('Error getting conversion details:', error);
    return {
      pendingConversion: `Error: ${error.message}`,
      readyConversion: `Error: ${error.message}`
    };
  }
};

// Fonction mise à jour pour récupérer toutes les balances pwROKO avec staking
export const getAllPwRokoBalancesWithStaking = async (address: string, api: ApiPromise | null) => {
  try {
    console.log('💰 Getting ALL pwROKO balances with staking for address:', address);
    
    const [
      totalAmount,
      stakingDetails,
      unlockAmounts
    ] = await Promise.all([
      getPwRokoBalance(address), // Utiliser le total au lieu de getFreeAmount
      getStakingDetails(address, api),
      getUnlockAmounts(address)
    ]);
    
    // Utiliser les détails du staking pour avoir des informations précises
    const bondedAmount = stakingDetails.bonded;
    const unbondingAmount = stakingDetails.unbonding;
    const redeemableAmount = stakingDetails.redeemable;
    
    // Utiliser les vraies valeurs d'unlock (pwROKO -> ROKO)
    const pendingUnlockAmount = unlockAmounts.pending;
    const readyUnlockAmount = unlockAmounts.ready;
    
    // Calculer le montant libre = Total - tous les autres montants
    const totalParsed = parseFloat(totalAmount || '0');
    const bondedParsed = parseFloat(bondedAmount || '0');
    const unbondingParsed = parseFloat(unbondingAmount || '0');
    const redeemableParsed = parseFloat(redeemableAmount || '0');
    const pendingUnlockParsed = parseFloat(pendingUnlockAmount || '0');
    const readyUnlockParsed = parseFloat(readyUnlockAmount || '0');
    
    // CORRECTION: "Prêt à unlock" ne doit PAS être soustrait du libre
    // Libre = Total - (Bondé + Unbonding + Redeemable + Unlock en cours)
    // "Prêt à unlock" est disponible pour le calcul du libre
    const calculatedFree = Math.max(0, totalParsed - bondedParsed - unbondingParsed - redeemableParsed - pendingUnlockParsed);
    const freeAmount = calculatedFree.toFixed(6).replace(/\.?0+$/, '') || '0';
    
    const totalOwned = totalAmount; // Le total est déjà calculé correctement
    
    console.log('💰 Complete pwROKO balance breakdown with staking:');
    console.log('💎 TOTAL OWNED:', totalOwned);
    console.log('🆓 Free (calculated):', freeAmount);
    console.log('🔒 Bonded (active staking):', bondedAmount);
    console.log('⏳ Unbonding (staking):', unbondingAmount);
    console.log('✅ Redeemable (staking):', redeemableAmount);
    console.log('⏳ Pending unlock (pwROKO->ROKO):', pendingUnlockAmount);
    console.log('✅ Ready unlock (pwROKO->ROKO):', readyUnlockAmount);
    console.log('🧮 Calculation check:', totalParsed, '=', calculatedFree, '+', bondedParsed, '+', unbondingParsed, '+', redeemableParsed, '+', pendingUnlockParsed, '+ [readyUnlock not subtracted:', readyUnlockParsed, ']');
    
    return {
      freeAmount,
      bondedAmount,
      unbondingAmount,
      redeemableAmount,
      pendingUnlockAmount,
      readyUnlockAmount,
      // Garder les conversions pour compatibilité avec valeurs par défaut
      pendingConversionAmount: '0',
      readyConversionAmount: '0',
      totalOwned
    };
  } catch (error: any) {
    console.error('Error getting all pwROKO balances with staking:', error);
    return {
      freeAmount: `Error: ${error.message}`,
      bondedAmount: `Error: ${error.message}`,
      unbondingAmount: `Error: ${error.message}`,
      redeemableAmount: `Error: ${error.message}`,
      pendingUnlockAmount: `Error: ${error.message}`,
      readyUnlockAmount: `Error: ${error.message}`,
      pendingConversionAmount: '0',
      readyConversionAmount: '0',
      totalOwned: '0'
    };
  }
};