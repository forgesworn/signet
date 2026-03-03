import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '../src/crypto.js';
import {
  ringSign,
  ringVerify,
  signCredentialRing,
  verifyCredentialRing,
} from '../src/ring-signature.js';

describe('ring-signature', () => {
  function makeRing(size: number) {
    const keys = Array.from({ length: size }, () => generateKeyPair());
    return {
      keys,
      pubkeys: keys.map((k) => k.publicKey),
    };
  }

  describe('ringSign / ringVerify', () => {
    it('signs and verifies with ring size 2', () => {
      const { keys, pubkeys } = makeRing(2);
      const sig = ringSign('hello', pubkeys, 0, keys[0].privateKey);
      expect(ringVerify(sig)).toBe(true);
    });

    it('signs and verifies with ring size 5', () => {
      const { keys, pubkeys } = makeRing(5);
      const sig = ringSign('test message', pubkeys, 3, keys[3].privateKey);
      expect(ringVerify(sig)).toBe(true);
    });

    it('signs and verifies with ring size 10', () => {
      const { keys, pubkeys } = makeRing(10);
      const sig = ringSign('larger ring', pubkeys, 7, keys[7].privateKey);
      expect(ringVerify(sig)).toBe(true);
    });

    it('any position in the ring can be the signer', () => {
      const { keys, pubkeys } = makeRing(5);
      for (let i = 0; i < 5; i++) {
        const sig = ringSign(`position-${i}`, pubkeys, i, keys[i].privateKey);
        expect(ringVerify(sig)).toBe(true);
      }
    });

    it('rejects tampered message', () => {
      const { keys, pubkeys } = makeRing(3);
      const sig = ringSign('original', pubkeys, 1, keys[1].privateKey);
      sig.message = 'tampered';
      expect(ringVerify(sig)).toBe(false);
    });

    it('rejects tampered responses', () => {
      const { keys, pubkeys } = makeRing(3);
      const sig = ringSign('test', pubkeys, 0, keys[0].privateKey);
      // Flip a byte in one response
      const r = sig.responses[1];
      sig.responses[1] = 'ff' + r.slice(2);
      expect(ringVerify(sig)).toBe(false);
    });

    it('rejects wrong ring member', () => {
      const { keys, pubkeys } = makeRing(3);
      const outsider = generateKeyPair();
      // Replace one ring member
      const modifiedRing = [...pubkeys];
      modifiedRing[2] = outsider.publicKey;

      const sig = ringSign('test', pubkeys, 0, keys[0].privateKey);
      sig.ring = modifiedRing;
      expect(ringVerify(sig)).toBe(false);
    });

    it('rejects ring size 1', () => {
      const keys = generateKeyPair();
      expect(() => ringSign('test', [keys.publicKey], 0, keys.privateKey)).toThrow('at least 2');
    });
  });

  describe('signCredentialRing / verifyCredentialRing', () => {
    it('creates and verifies a credential ring signature', () => {
      const { keys, pubkeys } = makeRing(5);
      const eventId = 'a'.repeat(64);
      const subjectPubkey = 'b'.repeat(64);

      const sig = signCredentialRing(eventId, subjectPubkey, pubkeys, 2, keys[2].privateKey);
      expect(verifyCredentialRing(sig, eventId, subjectPubkey)).toBe(true);
    });

    it('rejects wrong event ID', () => {
      const { keys, pubkeys } = makeRing(3);
      const eventId = 'a'.repeat(64);
      const subjectPubkey = 'b'.repeat(64);

      const sig = signCredentialRing(eventId, subjectPubkey, pubkeys, 0, keys[0].privateKey);
      expect(verifyCredentialRing(sig, 'c'.repeat(64), subjectPubkey)).toBe(false);
    });

    it('rejects wrong subject', () => {
      const { keys, pubkeys } = makeRing(3);
      const eventId = 'a'.repeat(64);
      const subjectPubkey = 'b'.repeat(64);

      const sig = signCredentialRing(eventId, subjectPubkey, pubkeys, 0, keys[0].privateKey);
      expect(verifyCredentialRing(sig, eventId, 'c'.repeat(64))).toBe(false);
    });
  });
});
