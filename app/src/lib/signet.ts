// Simplified protocol library wrapper for My Signet

import {
  generateMnemonic as _generateMnemonic,
  validateMnemonic as _validateMnemonic,
  BIP39_WORDLIST,
  deriveNostrKeyPair,
  computeSharedSecret,
  createQRPayload,
  serializeQRPayload,
  parseQRPayload,
  getSignetDisplay,
  verifySignetWords,
  encodeNpub,
  createVouch,
  computeBadge,
  buildBadgeFilters,
} from 'signet-protocol';
import type { FamilyIdentity } from '../types';

// Wrap @scure/bip39 functions that require a wordlist parameter
function generateMnemonic(): string {
  return _generateMnemonic(BIP39_WORDLIST);
}

export function validateMnemonic(mnemonic: string): boolean {
  return _validateMnemonic(mnemonic, BIP39_WORDLIST);
}

export {
  computeSharedSecret,
  createQRPayload,
  serializeQRPayload,
  parseQRPayload,
  getSignetDisplay,
  verifySignetWords,
  encodeNpub,
  createVouch,
  computeBadge,
  buildBadgeFilters,
};

/** Create a new identity from a fresh mnemonic */
export function createNewIdentity(displayName: string, isChild: boolean, guardianPubkey?: string): FamilyIdentity {
  const mnemonic = generateMnemonic();
  const { privateKey, publicKey } = deriveNostrKeyPair(mnemonic);

  return {
    id: publicKey,
    publicKey,
    privateKey,
    mnemonic,
    displayName,
    isChild,
    guardianPubkey,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

/** Restore an identity from an existing mnemonic */
export function importFromMnemonic(mnemonic: string, displayName: string, isChild: boolean, guardianPubkey?: string): FamilyIdentity {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid backup words');
  }
  const { privateKey, publicKey } = deriveNostrKeyPair(mnemonic);

  return {
    id: publicKey,
    publicKey,
    privateKey,
    mnemonic,
    displayName,
    isChild,
    guardianPubkey,
    createdAt: Math.floor(Date.now() / 1000),
  };
}
