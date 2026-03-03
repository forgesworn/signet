// Signet Words — Time-based 3-word verification ("signet me")
// Uses HMAC-SHA256 to derive rotating word triples from a shared secret

import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { BIP39_WORDLIST } from './wordlist.js';

/** Words rotate every 30 seconds */
export const SIGNET_EPOCH_SECONDS = 30;

/** 3 words per signet */
export const SIGNET_WORD_COUNT = 3;

/** Accept +/-1 epoch window for clock skew tolerance */
export const SIGNET_TOLERANCE = 1;

/** Return the current epoch index (30-second window). */
export function getEpoch(timestampMs?: number): number {
  return Math.floor((timestampMs ?? Date.now()) / (SIGNET_EPOCH_SECONDS * 1000));
}

/** Derive 3 BIP-39 words from a shared secret and epoch number.
 *  Uses HMAC-SHA256 and extracts 3 x 11-bit indices from the first 5 bytes. */
export function deriveWords(sharedSecret: string, epoch: number): string[] {
  const key = hexToBytes(sharedSecret);
  const message = utf8ToBytes(epoch.toString());
  const mac = hmac(sha256, key, message);

  // Extract 3 x 11-bit word indices from the first 5 bytes (33 bits total)
  const word1 = ((mac[0] << 3) | (mac[1] >> 5)) & 0x7FF;   // bits 0-10
  const word2 = ((mac[1] << 6) | (mac[2] >> 2)) & 0x7FF;   // bits 11-21
  const word3 = ((mac[2] << 9) | (mac[3] << 1) | (mac[4] >> 7)) & 0x7FF; // bits 22-32

  return [BIP39_WORDLIST[word1], BIP39_WORDLIST[word2], BIP39_WORDLIST[word3]];
}

/** Get the current 3-word signet for a shared secret. */
export function getSignetWords(sharedSecret: string, timestampMs?: number): string[] {
  return deriveWords(sharedSecret, getEpoch(timestampMs));
}

/** Verify that the given words match the current epoch (+/-1 tolerance).
 *  Returns true if the words match any of: epoch-1, epoch, epoch+1. */
export function verifySignetWords(
  sharedSecret: string,
  words: string[],
  timestampMs?: number,
): boolean {
  const currentEpoch = getEpoch(timestampMs);

  for (let offset = -SIGNET_TOLERANCE; offset <= SIGNET_TOLERANCE; offset++) {
    const candidate = deriveWords(sharedSecret, currentEpoch + offset);
    if (
      candidate[0] === words[0] &&
      candidate[1] === words[1] &&
      candidate[2] === words[2]
    ) {
      return true;
    }
  }

  return false;
}

/** Format words with middle-dot separator: "ocean · tiger · marble" */
export function formatSignetWords(words: string[]): string {
  return words.join(' \u00b7 ');
}

/** Get everything needed for UI display: words, formatted string, and countdown. */
export function getSignetDisplay(
  sharedSecret: string,
  timestampMs?: number,
): { words: string[]; formatted: string; expiresIn: number } {
  const now = timestampMs ?? Date.now();
  const words = getSignetWords(sharedSecret, now);
  const formatted = formatSignetWords(words);

  // Seconds until the next epoch boundary
  const epochMs = SIGNET_EPOCH_SECONDS * 1000;
  const msIntoEpoch = now % epochMs;
  const expiresIn = (epochMs - msIntoEpoch) / 1000;

  return { words, formatted, expiresIn };
}
