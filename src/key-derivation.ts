// NIP-06 Nostr Key Derivation & NIP-19 nsec/npub encoding
// Derives Nostr keypairs from BIP-39 mnemonics via @scure/bip32
// Also provides nsec/npub bech32 encoding (NIP-19)

import { secp256k1 } from '@noble/curves/secp256k1';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import { zeroBytes } from './utils.js';
import { SignetValidationError, SignetCryptoError } from './errors.js';

// --- Bech32 encoding/decoding (BIP-173) for NIP-19 nsec/npub ---

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

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(values) ^ 1;
  const ret: number[] = [];
  for (let i = 0; i < 6; i++) ret.push((polymod >> (5 * (5 - i))) & 31);
  return ret;
}

function bech32VerifyChecksum(hrp: string, data: number[]): boolean {
  return bech32Polymod(bech32HrpExpand(hrp).concat(data)) === 1;
}

function bech32Encode(hrp: string, data: number[]): string {
  const checksum = bech32CreateChecksum(hrp, data);
  const combined = data.concat(checksum);
  let ret = hrp + '1';
  for (const d of combined) ret += BECH32_CHARSET[d];
  return ret;
}

function bech32Decode(str: string): { hrp: string; data: number[] } {
  const lower = str.toLowerCase();
  if (lower !== str && str.toUpperCase() !== str) {
    throw new SignetValidationError('Mixed-case bech32 string');
  }
  const s = lower;
  const pos = s.lastIndexOf('1');
  if (pos < 1 || pos + 7 > s.length || s.length > 90) {
    throw new SignetValidationError('Invalid bech32 string');
  }
  const hrp = s.slice(0, pos);
  const dataChars = s.slice(pos + 1);
  const data: number[] = [];
  for (const c of dataChars) {
    const idx = BECH32_CHARSET.indexOf(c);
    if (idx === -1) throw new SignetValidationError(`Invalid bech32 character: ${c}`);
    data.push(idx);
  }
  if (!bech32VerifyChecksum(hrp, data)) {
    throw new SignetValidationError('Invalid bech32 checksum');
  }
  return { hrp, data: data.slice(0, data.length - 6) };
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || value >> fromBits !== 0) throw new SignetValidationError('Invalid value for convertBits');
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
    throw new SignetValidationError('Invalid padding in convertBits');
  }
  return ret;
}

/** Encode a 32-byte private key as an nsec bech32 string (NIP-19) */
export function encodeNsec(privateKey: string): string {
  const bytes = hexToBytes(privateKey);
  if (bytes.length !== 32) throw new SignetValidationError('Private key must be 32 bytes');
  const data5bit = convertBits(Array.from(bytes), 8, 5, true);
  return bech32Encode('nsec', data5bit);
}

/** Encode a 32-byte public key as an npub bech32 string (NIP-19) */
export function encodeNpub(publicKey: string): string {
  const bytes = hexToBytes(publicKey);
  if (bytes.length !== 32) throw new SignetValidationError('Public key must be 32 bytes');
  const data5bit = convertBits(Array.from(bytes), 8, 5, true);
  return bech32Encode('npub', data5bit);
}

/** Decode an nsec bech32 string to private + public key hex (NIP-19) */
export function decodeNsec(nsec: string): { privateKey: string; publicKey: string } {
  const { hrp, data } = bech32Decode(nsec);
  if (hrp !== 'nsec') throw new SignetValidationError(`Expected nsec prefix, got ${hrp}`);
  const bytes = convertBits(data, 5, 8, false);
  if (bytes.length !== 32) throw new SignetValidationError('Invalid nsec: decoded to wrong length');
  const privateKey = bytesToHex(new Uint8Array(bytes));
  // Derive x-only public key from private key
  const fullPubkey = secp256k1.getPublicKey(new Uint8Array(bytes), true);
  const publicKey = bytesToHex(fullPubkey.slice(1));
  return { privateKey, publicKey };
}

/** NIP-06 derivation path: m/44'/1237'/0'/0/0 */
export const NIP06_DERIVATION_PATH = "m/44'/1237'/0'/0/0";

/** Maximum derivation path depth — prevents CPU-bound DoS on untrusted paths */
const MAX_PATH_DEPTH = 10;

/** Hardened offset for BIP-32 */
const HARDENED_OFFSET = 0x80000000;

/** Parse a BIP-32 derivation path into numeric indices.
 *  Retained for backwards compatibility — @scure/bip32 handles paths internally. */
export function parsePath(path: string): number[] {
  if (!path.startsWith('m/')) {
    throw new SignetValidationError('Derivation path must start with m/');
  }
  const segments = path.slice(2).split('/');
  if (segments.length > MAX_PATH_DEPTH) {
    throw new SignetValidationError(`Derivation path too deep: ${segments.length} levels (max ${MAX_PATH_DEPTH})`);
  }
  return segments
    .map((segment) => {
      const hardened = segment.endsWith("'") || segment.endsWith('h');
      const index = parseInt(hardened ? segment.slice(0, -1) : segment, 10);
      if (isNaN(index) || index < 0) {
        throw new SignetValidationError(`Invalid path segment: ${segment}`);
      }
      return hardened ? index + HARDENED_OFFSET : index;
    });
}

/** Derive a private key at the given BIP-32 path from a seed.
 *  Uses @scure/bip32 (audited BIP-32 implementation by paulmillr). */
export function deriveKeyFromSeed(seed: Uint8Array, path: string): Uint8Array {
  // Validate path depth before delegating to @scure/bip32
  parsePath(path);
  const master = HDKey.fromMasterSeed(seed);
  const child = master.derive(path);
  if (!child.privateKey) {
    throw new SignetCryptoError('Key derivation produced no private key');
  }
  // Return a copy — HDKey owns its internal buffer
  return Uint8Array.from(child.privateKey);
}

/** Derive a Nostr keypair from a BIP-39 mnemonic using NIP-06 path.
 *
 *  SECURITY NOTE: Intermediate Uint8Arrays (seed, key bytes) are zeroed after use,
 *  but the returned hex strings are JS primitives and cannot be wiped from memory.
 *  This is a fundamental limitation of the JavaScript runtime. */
export function deriveNostrKeyPair(
  mnemonic: string,
  passphrase?: string
): { privateKey: string; publicKey: string } {
  const seed = mnemonicToSeedSync(mnemonic, passphrase);
  const privateKeyBytes = deriveKeyFromSeed(seed, NIP06_DERIVATION_PATH);
  zeroBytes(seed);
  const privateKey = bytesToHex(privateKeyBytes);

  // x-only public key (BIP-340 / Nostr convention)
  const fullPubkey = secp256k1.getPublicKey(privateKeyBytes, true); // 33 bytes compressed
  // Drop the prefix byte to get x-only (32 bytes)
  const publicKey = bytesToHex(fullPubkey.slice(1));
  zeroBytes(privateKeyBytes);

  return { privateKey, publicKey };
}

/** Create a full Signet identity from a mnemonic.
 *
 * WARNING: The returned object contains the mnemonic alongside the private key.
 * Do not serialise, log, or persist this object without first removing the
 * mnemonic. The caller is responsible for discarding the mnemonic as quickly
 * as possible. Mnemonics must never be stored in plaintext (use crypto-store.ts). */
export function createIdentityFromMnemonic(
  mnemonic: string,
  passphrase?: string
): { mnemonic: string; privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = deriveNostrKeyPair(mnemonic, passphrase);
  return { mnemonic, privateKey, publicKey };
}

/** Derive a child account keypair (e.g., for a child's account) at a given account index */
export function deriveChildAccount(
  mnemonic: string,
  accountIndex: number,
  passphrase?: string
): { privateKey: string; publicKey: string } {
  if (!Number.isSafeInteger(accountIndex) || accountIndex < 0 || accountIndex > 0x7fffffff) {
    throw new SignetValidationError('accountIndex must be an integer in [0, 2^31 - 1]');
  }
  const seed = mnemonicToSeedSync(mnemonic, passphrase);
  const path = `m/44'/1237'/${accountIndex}'/0/0`;
  const privateKeyBytes = deriveKeyFromSeed(seed, path);
  zeroBytes(seed);
  const privateKey = bytesToHex(privateKeyBytes);

  const fullPubkey = secp256k1.getPublicKey(privateKeyBytes, true);
  const publicKey = bytesToHex(fullPubkey.slice(1));
  zeroBytes(privateKeyBytes);

  return { privateKey, publicKey };
}
