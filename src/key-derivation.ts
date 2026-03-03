// BIP-32 HD Key Derivation & NIP-06 Nostr Key Derivation
// Derives Nostr keypairs from BIP-39 mnemonics

import { secp256k1 } from '@noble/curves/secp256k1';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { mnemonicToSeed } from './mnemonic.js';

/** NIP-06 derivation path: m/44'/1237'/0'/0/0 */
export const NIP06_DERIVATION_PATH = "m/44'/1237'/0'/0/0";

/** Hardened offset for BIP-32 */
const HARDENED_OFFSET = 0x80000000;

interface ExtendedKey {
  key: Uint8Array;    // 32 bytes — private key or public key
  chainCode: Uint8Array; // 32 bytes
}

/** Parse a BIP-32 derivation path into numeric indices */
export function parsePath(path: string): number[] {
  if (!path.startsWith('m/')) {
    throw new Error('Derivation path must start with m/');
  }
  return path
    .slice(2)
    .split('/')
    .map((segment) => {
      const hardened = segment.endsWith("'") || segment.endsWith('h');
      const index = parseInt(hardened ? segment.slice(0, -1) : segment, 10);
      if (isNaN(index) || index < 0) {
        throw new Error(`Invalid path segment: ${segment}`);
      }
      return hardened ? index + HARDENED_OFFSET : index;
    });
}

/** Derive master key from seed (BIP-32) */
function masterKeyFromSeed(seed: Uint8Array): ExtendedKey {
  const I = hmac(sha512, utf8ToBytes('Bitcoin seed'), seed);
  return {
    key: I.slice(0, 32),
    chainCode: I.slice(32),
  };
}

/** Derive a child key (BIP-32 hardened or normal) */
function deriveChild(parent: ExtendedKey, index: number): ExtendedKey {
  const data = new Uint8Array(37);

  if (index >= HARDENED_OFFSET) {
    // Hardened: 0x00 || ser256(kpar) || ser32(index)
    data[0] = 0;
    data.set(parent.key, 1);
  } else {
    // Normal: serP(point(kpar)) || ser32(index)
    const pubkey = secp256k1.getPublicKey(parent.key, true); // 33 bytes compressed
    data.set(pubkey, 0);
    // data is 37 bytes but pubkey is 33, so indices 0-32 are set
    // We need to recalculate — normal child uses 33 + 4 = 37 bytes
  }

  // Write index as big-endian 32-bit
  data[33] = (index >>> 24) & 0xff;
  data[34] = (index >>> 16) & 0xff;
  data[35] = (index >>> 8) & 0xff;
  data[36] = index & 0xff;

  const I = hmac(sha512, parent.chainCode, data);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);

  // Child key = (IL + kpar) mod n
  const parentKeyBigInt = BigInt('0x' + bytesToHex(parent.key));
  const ILBigInt = BigInt('0x' + bytesToHex(IL));
  const childKey = (ILBigInt + parentKeyBigInt) % secp256k1.CURVE.n;

  if (childKey === 0n) {
    throw new Error('Derived key is zero — astronomically unlikely, try next index');
  }

  // Convert back to 32-byte Uint8Array
  const childKeyHex = childKey.toString(16).padStart(64, '0');
  return {
    key: hexToBytes(childKeyHex),
    chainCode: IR,
  };
}

/** Derive a private key at the given BIP-32 path from a seed */
export function deriveKeyFromSeed(seed: Uint8Array, path: string): Uint8Array {
  const indices = parsePath(path);
  let current = masterKeyFromSeed(seed);
  for (const index of indices) {
    current = deriveChild(current, index);
  }
  return current.key;
}

/** Derive a Nostr keypair from a BIP-39 mnemonic using NIP-06 path */
export function deriveNostrKeyPair(
  mnemonic: string,
  passphrase?: string
): { privateKey: string; publicKey: string } {
  const seed = mnemonicToSeed(mnemonic, passphrase);
  const privateKeyBytes = deriveKeyFromSeed(seed, NIP06_DERIVATION_PATH);
  const privateKey = bytesToHex(privateKeyBytes);

  // x-only public key (BIP-340 / Nostr convention)
  const fullPubkey = secp256k1.getPublicKey(privateKeyBytes, true); // 33 bytes compressed
  // Drop the prefix byte to get x-only (32 bytes)
  const publicKey = bytesToHex(fullPubkey.slice(1));

  return { privateKey, publicKey };
}

/** Create a full Signet identity from a mnemonic */
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
  const seed = mnemonicToSeed(mnemonic, passphrase);
  const path = `m/44'/1237'/${accountIndex}'/0/0`;
  const privateKeyBytes = deriveKeyFromSeed(seed, path);
  const privateKey = bytesToHex(privateKeyBytes);

  const fullPubkey = secp256k1.getPublicKey(privateKeyBytes, true);
  const publicKey = bytesToHex(fullPubkey.slice(1));

  return { privateKey, publicKey };
}
