import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  getPublicKey,
  signEvent,
  verifyEvent,
  getEventId,
  hashString,
} from '../src/crypto.js';
import type { UnsignedEvent, NostrEvent } from '../src/types.js';

describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates a valid keypair', () => {
      const kp = generateKeyPair();
      expect(kp.privateKey).toHaveLength(64);
      expect(kp.publicKey).toHaveLength(64);
    });

    it('generates different keypairs each time', () => {
      const kp1 = generateKeyPair();
      const kp2 = generateKeyPair();
      expect(kp1.privateKey).not.toBe(kp2.privateKey);
    });
  });

  describe('getPublicKey', () => {
    it('derives consistent public key from private key', () => {
      const kp = generateKeyPair();
      const pub = getPublicKey(kp.privateKey);
      expect(pub).toBe(kp.publicKey);
    });
  });

  describe('signEvent / verifyEvent', () => {
    it('signs and verifies an event', async () => {
      const kp = generateKeyPair();
      const unsigned: UnsignedEvent = {
        kind: 1,
        pubkey: kp.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'hello',
      };

      const signed = await signEvent(unsigned, kp.privateKey);
      expect(signed.id).toHaveLength(64);
      expect(signed.sig).toHaveLength(128);

      const valid = await verifyEvent(signed);
      expect(valid).toBe(true);
    });

    it('rejects tampered events', async () => {
      const kp = generateKeyPair();
      const unsigned: UnsignedEvent = {
        kind: 1,
        pubkey: kp.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'hello',
      };

      const signed = await signEvent(unsigned, kp.privateKey);

      // Tamper with content
      const tampered: NostrEvent = { ...signed, content: 'tampered' };
      const valid = await verifyEvent(tampered);
      expect(valid).toBe(false);
    });

    it('rejects events with wrong pubkey', async () => {
      const kp1 = generateKeyPair();
      const kp2 = generateKeyPair();
      const unsigned: UnsignedEvent = {
        kind: 1,
        pubkey: kp1.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'hello',
      };

      const signed = await signEvent(unsigned, kp1.privateKey);
      const wrong: NostrEvent = { ...signed, pubkey: kp2.publicKey };
      const valid = await verifyEvent(wrong);
      expect(valid).toBe(false);
    });
  });

  describe('getEventId', () => {
    it('produces deterministic IDs', () => {
      const event: UnsignedEvent = {
        kind: 1,
        pubkey: 'a'.repeat(64),
        created_at: 1000000,
        tags: [['t', 'test']],
        content: 'hello',
      };

      const id1 = getEventId(event);
      const id2 = getEventId(event);
      expect(id1).toBe(id2);
      expect(id1).toHaveLength(64);
    });
  });

  describe('hashString', () => {
    it('produces deterministic hashes', () => {
      const h1 = hashString('test');
      const h2 = hashString('test');
      expect(h1).toBe(h2);
      expect(h1).toHaveLength(64);
    });

    it('produces different hashes for different inputs', () => {
      const h1 = hashString('hello');
      const h2 = hashString('world');
      expect(h1).not.toBe(h2);
    });
  });
});
