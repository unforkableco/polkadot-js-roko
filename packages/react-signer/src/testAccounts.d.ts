import type { KeyringPair } from '@polkadot/keyring/types';
export declare const TEST_ACCOUNTS: {
    name: string;
    privateKey: string;
    address: string;
}[];
export declare function getTestAccount(address: string): typeof TEST_ACCOUNTS[0] | undefined;
export declare function ensureTestAccountExists(address: string): KeyringPair | null;
