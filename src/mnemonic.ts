import { sha256 } from '@noble/hashes/sha256';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes } from '@noble/hashes/utils';
import { BIP39_WORDLIST, wordIndex } from './wordlist.js';

const VALID_ENTROPY_BITS = [128, 160, 192, 224, 256] as const;

/**
 * Generate random entropy for mnemonic generation.
 * @param bits - Number of entropy bits. Must be 128, 160, 192, 224, or 256. Default 128.
 * @returns Uint8Array of random bytes (bits / 8 length).
 */
export function generateEntropy(bits: number = 128): Uint8Array {
  if (!(VALID_ENTROPY_BITS as readonly number[]).includes(bits)) {
    throw new Error(
      `Invalid entropy bits: ${bits}. Must be one of ${VALID_ENTROPY_BITS.join(', ')}.`
    );
  }
  return randomBytes(bits / 8);
}

/**
 * Convert entropy bytes to a BIP-39 mnemonic sentence.
 *
 * Process:
 * 1. SHA-256 hash the entropy to derive the checksum.
 * 2. Take the first (entropyBits / 32) bits of the hash as the checksum.
 * 3. Concatenate entropy bits + checksum bits.
 * 4. Split into 11-bit groups; each group indexes into BIP39_WORDLIST.
 * 5. Return space-separated words.
 */
export function entropyToMnemonic(entropy: Uint8Array): string {
  const entropyBits = entropy.length * 8;
  if (!(VALID_ENTROPY_BITS as readonly number[]).includes(entropyBits)) {
    throw new Error(
      `Invalid entropy length: ${entropy.length} bytes (${entropyBits} bits). Must be one of ${VALID_ENTROPY_BITS.join(', ')} bits.`
    );
  }

  const checksumBits = entropyBits / 32;
  const hash = sha256(entropy);

  // Build a single bit string from entropy + checksum bits
  const totalBits = entropyBits + checksumBits;
  const bits = new Uint8Array(totalBits);

  // Copy entropy bits
  for (let i = 0; i < entropyBits; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    bits[i] = (entropy[byteIdx] >> bitIdx) & 1;
  }

  // Copy checksum bits
  for (let i = 0; i < checksumBits; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    bits[entropyBits + i] = (hash[byteIdx] >> bitIdx) & 1;
  }

  // Split into 11-bit groups and map to words
  const wordCount = totalBits / 11;
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    let index = 0;
    for (let j = 0; j < 11; j++) {
      index = (index << 1) | bits[i * 11 + j];
    }
    words.push(BIP39_WORDLIST[index]);
  }

  return words.join(' ');
}

/**
 * Convert a BIP-39 mnemonic sentence back to the original entropy bytes.
 * Verifies the embedded checksum and throws on any mismatch.
 */
export function mnemonicToEntropy(mnemonic: string): Uint8Array {
  const words = mnemonic.trim().split(/\s+/);
  const wordCount = words.length;

  // Valid word counts: 12, 15, 18, 21, 24
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    throw new Error(
      `Invalid mnemonic: expected 12, 15, 18, 21, or 24 words but got ${wordCount}.`
    );
  }

  // Look up each word's index
  const indices: number[] = [];
  for (const word of words) {
    const idx = wordIndex(word);
    if (idx === -1) {
      throw new Error(`Invalid mnemonic: word "${word}" is not in the BIP-39 wordlist.`);
    }
    indices.push(idx);
  }

  // Reconstruct bit array from 11-bit indices
  const totalBits = wordCount * 11;
  const bits = new Uint8Array(totalBits);

  for (let i = 0; i < wordCount; i++) {
    const idx = indices[i];
    for (let j = 0; j < 11; j++) {
      bits[i * 11 + j] = (idx >> (10 - j)) & 1;
    }
  }

  // Separate entropy bits from checksum bits
  const checksumBits = totalBits / 33; // totalBits = entropyBits + checksumBits = entropyBits * 33/32
  const entropyBits = totalBits - checksumBits;

  // Reconstruct entropy bytes
  const entropy = new Uint8Array(entropyBits / 8);
  for (let i = 0; i < entropyBits; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    entropy[byteIdx] |= bits[i] << bitIdx;
  }

  // Verify checksum
  const hash = sha256(entropy);
  for (let i = 0; i < checksumBits; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    const expected = (hash[byteIdx] >> bitIdx) & 1;
    if (bits[entropyBits + i] !== expected) {
      throw new Error('Invalid mnemonic: checksum verification failed.');
    }
  }

  return entropy;
}

/**
 * Validate a BIP-39 mnemonic sentence.
 * Returns true if the mnemonic has a valid word count, all words are in the
 * BIP-39 wordlist, and the embedded checksum is correct. Never throws.
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    mnemonicToEntropy(mnemonic);
    return true;
  } catch {
    return false;
  }
}

/**
 * Derive a 64-byte seed from a BIP-39 mnemonic using PBKDF2-SHA512.
 *
 * @param mnemonic - The mnemonic sentence.
 * @param passphrase - Optional passphrase (default empty string).
 * @returns 64-byte seed as Uint8Array.
 */
export function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Uint8Array {
  const password = mnemonic.trim().split(/\s+/).join(' ');
  const salt = 'mnemonic' + passphrase;

  const encoder = new TextEncoder();

  return pbkdf2(sha512, encoder.encode(password), encoder.encode(salt), {
    c: 2048,
    dkLen: 64,
  });
}

/**
 * Convenience function: generate entropy and convert to a mnemonic sentence.
 * @param bits - Number of entropy bits. Default 128 (12 words).
 */
export function generateMnemonic(bits: number = 128): string {
  const entropy = generateEntropy(bits);
  return entropyToMnemonic(entropy);
}
