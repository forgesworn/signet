import {
  generateMnemonic,
  validateMnemonic,
  deriveNostrKeyPair,
  mnemonicToEntropy,
  entropyToMnemonic,
  splitSecret,
  reconstructSecret,
  shareToWords,
  wordsToShare,
  computeSharedSecret,
  createQRPayload,
  serializeQRPayload,
  parseQRPayload,
  getSignetWords,
  verifySignetWords,
  formatSignetWords,
  getSignetDisplay,
  getJurisdictionCodes,
  getJurisdiction,
  decodeNsec,
  encodeNsec,
  encodeNpub,
  // Two-credential ceremony
  createTwoCredentialCeremony,
  // Guardian delegation
  createGuardianDelegation,
  // Nullifier utilities
  computeNullifier,
  checkNullifierDuplicate,
  // Credential chains
  resolveCredentialChain,
  supersedeCredential,
  isSuperseded,
  parseCredential,
  // Entity labels
  ENTITY_LABELS,
  type ContactInfo,
  type QRPayload,
  type ShamirShare,
  type EntityType,
  type TwoCredentialResult,
  type GuardianDelegationParams,
  type GuardianDelegationScope,
  type CredentialChain,
  type NostrEvent,
} from 'signet-protocol';
import type { StoredIdentity } from './db';

export {
  generateMnemonic,
  validateMnemonic,
  deriveNostrKeyPair,
  mnemonicToEntropy,
  entropyToMnemonic,
  splitSecret,
  reconstructSecret,
  shareToWords,
  wordsToShare,
  computeSharedSecret,
  createQRPayload,
  serializeQRPayload,
  parseQRPayload,
  getSignetWords,
  verifySignetWords,
  formatSignetWords,
  getSignetDisplay,
  getJurisdictionCodes,
  getJurisdiction,
  decodeNsec,
  encodeNsec,
  encodeNpub,
  createTwoCredentialCeremony,
  createGuardianDelegation,
  computeNullifier,
  checkNullifierDuplicate,
  resolveCredentialChain,
  supersedeCredential,
  isSuperseded,
  parseCredential,
  ENTITY_LABELS,
};

// ── decodeNpub ──
// The protocol library exports encodeNpub and decodeNsec but not decodeNpub.
// Implemented here using the same bech32 logic pattern.

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function bech32VerifyChecksum(hrp: string, data: number[]): boolean {
  return bech32Polymod(bech32HrpExpand(hrp).concat(data)) === 1;
}

function bech32Decode(str: string): { hrp: string; data: number[] } {
  const lower = str.toLowerCase();
  if (lower !== str && str.toUpperCase() !== str) {
    throw new Error('Mixed-case bech32 string');
  }
  const s = lower;
  const pos = s.lastIndexOf('1');
  if (pos < 1 || pos + 7 > s.length || s.length > 90) {
    throw new Error('Invalid bech32 string');
  }
  const hrp = s.slice(0, pos);
  const dataChars = s.slice(pos + 1);
  const data: number[] = [];
  for (const c of dataChars) {
    const idx = BECH32_CHARSET.indexOf(c);
    if (idx === -1) throw new Error(`Invalid bech32 character: ${c}`);
    data.push(idx);
  }
  if (!bech32VerifyChecksum(hrp, data)) {
    throw new Error('Invalid bech32 checksum');
  }
  return { hrp, data: data.slice(0, data.length - 6) };
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || value >> fromBits !== 0) throw new Error('Invalid value for convertBits');
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv) !== 0) {
    throw new Error('Invalid padding in convertBits');
  }
  return ret;
}

/** Decode an npub bech32 string to a hex public key (NIP-19) */
export function decodeNpub(npub: string): string {
  const { hrp, data } = bech32Decode(npub);
  if (hrp !== 'npub') throw new Error(`Expected npub prefix, got ${hrp}`);
  const bytes = convertBits(data, 5, 8, false);
  if (bytes.length !== 32) throw new Error('Invalid npub: decoded to wrong length');
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type {
  ContactInfo,
  QRPayload,
  ShamirShare,
  EntityType,
  TwoCredentialResult,
  GuardianDelegationParams,
  GuardianDelegationScope,
  CredentialChain,
  NostrEvent,
};

export function createNewIdentity(
  role: StoredIdentity['role'],
  displayName: string,
  opts?: {
    entityType?: StoredIdentity['entityType'];
    guardianPubkey?: string;
    isChild?: boolean;
  },
): StoredIdentity {
  const mnemonic = generateMnemonic();
  const { privateKey, publicKey } = deriveNostrKeyPair(mnemonic);
  return {
    id: publicKey,
    mnemonic,
    publicKey,
    privateKey,
    role,
    displayName,
    createdAt: Math.floor(Date.now() / 1000),
    importMethod: 'mnemonic',
    entityType: opts?.entityType,
    guardianPubkey: opts?.guardianPubkey,
    isChild: opts?.isChild,
  };
}

export function importIdentity(
  mnemonic: string,
  role: StoredIdentity['role'],
  displayName: string,
  opts?: {
    entityType?: StoredIdentity['entityType'];
    guardianPubkey?: string;
    isChild?: boolean;
  },
): StoredIdentity {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  const { privateKey, publicKey } = deriveNostrKeyPair(mnemonic);
  return {
    id: publicKey,
    mnemonic,
    publicKey,
    privateKey,
    role,
    displayName,
    createdAt: Math.floor(Date.now() / 1000),
    importMethod: 'mnemonic',
    entityType: opts?.entityType,
    guardianPubkey: opts?.guardianPubkey,
    isChild: opts?.isChild,
  };
}

export function importFromNsec(
  nsec: string,
  role: StoredIdentity['role'],
  displayName: string,
  opts?: {
    entityType?: StoredIdentity['entityType'];
    guardianPubkey?: string;
    isChild?: boolean;
  },
): StoredIdentity {
  const { privateKey, publicKey } = decodeNsec(nsec);
  return {
    id: publicKey,
    publicKey,
    privateKey,
    role,
    displayName,
    createdAt: Math.floor(Date.now() / 1000),
    importMethod: 'nsec',
    entityType: opts?.entityType,
    guardianPubkey: opts?.guardianPubkey,
    isChild: opts?.isChild,
  };
}
