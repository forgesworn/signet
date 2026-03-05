// Simplified protocol library wrapper for My Signet

import {
  generateMnemonic,
  validateMnemonic,
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
  validateMnemonic,
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
    throw new Error('Invalid recovery phrase');
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
