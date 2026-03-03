import { describe, it, expect } from 'vitest';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { BIP39_WORDLIST } from '../src/wordlist.js';
import {
  SIGNET_EPOCH_SECONDS,
  SIGNET_WORD_COUNT,
  getEpoch,
  deriveWords,
  getSignetWords,
  verifySignetWords,
  formatSignetWords,
  getSignetDisplay,
} from '../src/signet-words.js';

// Deterministic test secret
const testSecret = bytesToHex(sha256(utf8ToBytes('test-shared-secret')));

// A second, different secret for comparison
const otherSecret = bytesToHex(sha256(utf8ToBytes('other-shared-secret')));

// Fixed timestamp aligned to the start of an epoch so +10s stays within the same window
const fixedTimestamp = 1700000010000; // 10ms into an epoch (1700000010000 % 30000 == 10000)

describe('signet-words', () => {
  describe('getSignetWords', () => {
    it('returns exactly 3 words', () => {
      const words = getSignetWords(testSecret, fixedTimestamp);
      expect(words).toHaveLength(SIGNET_WORD_COUNT);
    });

    it('all 3 words are in the BIP-39 wordlist', () => {
      const words = getSignetWords(testSecret, fixedTimestamp);
      for (const word of words) {
        expect(BIP39_WORDLIST).toContain(word);
      }
    });

    it('same shared secret + same timestamp produces same words (deterministic)', () => {
      const words1 = getSignetWords(testSecret, fixedTimestamp);
      const words2 = getSignetWords(testSecret, fixedTimestamp);
      expect(words1).toEqual(words2);
    });

    it('different shared secrets produce different words', () => {
      const words1 = getSignetWords(testSecret, fixedTimestamp);
      const words2 = getSignetWords(otherSecret, fixedTimestamp);
      expect(words1).not.toEqual(words2);
    });

    it('same secret at different epochs produces different words', () => {
      const words1 = getSignetWords(testSecret, fixedTimestamp);
      // Move forward by more than one epoch (31 seconds)
      const words2 = getSignetWords(testSecret, fixedTimestamp + 31_000);
      expect(words1).not.toEqual(words2);
    });
  });

  describe('verifySignetWords', () => {
    it('returns true for current epoch words', () => {
      const words = getSignetWords(testSecret, fixedTimestamp);
      expect(verifySignetWords(testSecret, words, fixedTimestamp)).toBe(true);
    });

    it('returns true for previous epoch (tolerance)', () => {
      // Get words from the previous epoch
      const prevEpochTime = fixedTimestamp - SIGNET_EPOCH_SECONDS * 1000;
      const words = getSignetWords(testSecret, prevEpochTime);
      // Verify against current epoch — should pass due to ±1 tolerance
      expect(verifySignetWords(testSecret, words, fixedTimestamp)).toBe(true);
    });

    it('returns true for next epoch (tolerance)', () => {
      // Get words from the next epoch
      const nextEpochTime = fixedTimestamp + SIGNET_EPOCH_SECONDS * 1000;
      const words = getSignetWords(testSecret, nextEpochTime);
      // Verify against current epoch — should pass due to ±1 tolerance
      expect(verifySignetWords(testSecret, words, fixedTimestamp)).toBe(true);
    });

    it('returns false for words from 2 epochs ago', () => {
      // Get words from 2 epochs ago
      const oldTime = fixedTimestamp - SIGNET_EPOCH_SECONDS * 1000 * 2;
      const words = getSignetWords(testSecret, oldTime);
      expect(verifySignetWords(testSecret, words, fixedTimestamp)).toBe(false);
    });

    it('returns false for random/wrong words', () => {
      const wrongWords = ['abandon', 'abandon', 'abandon'];
      // Use a timestamp where the correct words are certainly not abandon x3
      expect(verifySignetWords(testSecret, wrongWords, fixedTimestamp)).toBe(false);
    });
  });

  describe('both parties see same words', () => {
    it('two parties with the same secret at the same time get identical words', () => {
      const aliceWords = getSignetWords(testSecret, fixedTimestamp);
      const bobWords = getSignetWords(testSecret, fixedTimestamp);
      expect(aliceWords).toEqual(bobWords);
    });
  });

  describe('formatSignetWords', () => {
    it('joins words with " \u00b7 " (middle dot separator)', () => {
      const words = ['ocean', 'tiger', 'marble'];
      expect(formatSignetWords(words)).toBe('ocean \u00b7 tiger \u00b7 marble');
    });
  });

  describe('getSignetDisplay', () => {
    it('returns words, formatted string, and expiresIn > 0', () => {
      const display = getSignetDisplay(testSecret, fixedTimestamp);
      expect(display.words).toHaveLength(SIGNET_WORD_COUNT);
      expect(display.formatted).toContain(' \u00b7 ');
      expect(display.expiresIn).toBeGreaterThan(0);
      expect(display.expiresIn).toBeLessThanOrEqual(SIGNET_EPOCH_SECONDS);
    });
  });

  describe('getEpoch', () => {
    it('returns same value within the same 30-second window', () => {
      const epoch1 = getEpoch(fixedTimestamp);
      const epoch2 = getEpoch(fixedTimestamp + 10_000); // +10s, still within window
      expect(epoch1).toBe(epoch2);
    });

    it('returns different values 31 seconds apart', () => {
      const epoch1 = getEpoch(fixedTimestamp);
      const epoch2 = getEpoch(fixedTimestamp + 31_000);
      expect(epoch1).not.toBe(epoch2);
    });
  });

  describe('word index range', () => {
    it('word indices are always in valid range (0-2047) across several secrets', () => {
      const secrets = [
        bytesToHex(sha256(utf8ToBytes('secret-a'))),
        bytesToHex(sha256(utf8ToBytes('secret-b'))),
        bytesToHex(sha256(utf8ToBytes('secret-c'))),
        bytesToHex(sha256(utf8ToBytes('secret-d'))),
        bytesToHex(sha256(utf8ToBytes('secret-e'))),
      ];

      for (const secret of secrets) {
        for (let epochOffset = 0; epochOffset < 10; epochOffset++) {
          const words = deriveWords(secret, epochOffset);
          expect(words).toHaveLength(SIGNET_WORD_COUNT);
          for (const word of words) {
            const idx = BIP39_WORDLIST.indexOf(word);
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThanOrEqual(2047);
          }
        }
      }
    });
  });
});
