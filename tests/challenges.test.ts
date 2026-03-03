import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  createChallenge,
  parseChallenge,
  createRevocation,
  parseRevocation,
  hasReachedRevocationThreshold,
  SIGNET_KINDS,
} from '../src/index.js';
import { verifyEvent } from '../src/crypto.js';
import { getTagValue } from '../src/validation.js';

describe('challenges', () => {
  it('creates a valid challenge event', async () => {
    const reporter = generateKeyPair();
    const verifier = generateKeyPair();

    const challenge = await createChallenge(reporter.privateKey, {
      verifierPubkey: verifier.publicKey,
      reason: 'anomalous-volume',
      evidenceType: 'issuance-data',
      reporterTier: 3,
      evidence: 'Issued 200 verifications in one week',
    });

    expect(challenge.kind).toBe(SIGNET_KINDS.CHALLENGE);
    expect(challenge.pubkey).toBe(reporter.publicKey);
    expect(getTagValue(challenge, 'd')).toBe(verifier.publicKey);
    expect(getTagValue(challenge, 'reason')).toBe('anomalous-volume');
    expect(getTagValue(challenge, 'evidence-type')).toBe('issuance-data');
    expect(getTagValue(challenge, 'reporter-tier')).toBe('3');
    expect(challenge.content).toBe('Issued 200 verifications in one week');

    const valid = await verifyEvent(challenge);
    expect(valid).toBe(true);
  });

  describe('parseChallenge', () => {
    it('parses challenge fields', async () => {
      const reporter = generateKeyPair();
      const verifier = generateKeyPair();

      const challenge = await createChallenge(reporter.privateKey, {
        verifierPubkey: verifier.publicKey,
        reason: 'registry-mismatch',
        evidenceType: 'registry-screenshot',
        reporterTier: 3,
        evidence: 'Licence number not found',
      });

      const parsed = parseChallenge(challenge);
      expect(parsed).not.toBeNull();
      expect(parsed!.verifierPubkey).toBe(verifier.publicKey);
      expect(parsed!.reason).toBe('registry-mismatch');
      expect(parsed!.evidenceType).toBe('registry-screenshot');
      expect(parsed!.reporterTier).toBe(3);
    });
  });
});

describe('revocations', () => {
  it('creates a valid revocation event', async () => {
    const authority = generateKeyPair();
    const verifier = generateKeyPair();
    const now = Math.floor(Date.now() / 1000);

    const revocation = await createRevocation(authority.privateKey, {
      verifierPubkey: verifier.publicKey,
      challengeEventId: 'challenge123',
      confirmations: 7,
      bondAction: 'slashed',
      scope: 'full',
      effectiveAt: now,
      summary: 'Confirmed fraudulent: licence revoked by SRA',
    });

    expect(revocation.kind).toBe(SIGNET_KINDS.REVOCATION);
    expect(getTagValue(revocation, 'd')).toBe(verifier.publicKey);
    expect(getTagValue(revocation, 'challenge')).toBe('challenge123');
    expect(getTagValue(revocation, 'confirmations')).toBe('7');
    expect(getTagValue(revocation, 'bond-action')).toBe('slashed');
    expect(getTagValue(revocation, 'scope')).toBe('full');
    expect(revocation.content).toBe('Confirmed fraudulent: licence revoked by SRA');

    const valid = await verifyEvent(revocation);
    expect(valid).toBe(true);
  });

  describe('parseRevocation', () => {
    it('parses revocation fields', async () => {
      const authority = generateKeyPair();
      const verifier = generateKeyPair();
      const now = Math.floor(Date.now() / 1000);

      const revocation = await createRevocation(authority.privateKey, {
        verifierPubkey: verifier.publicKey,
        challengeEventId: 'ch456',
        confirmations: 5,
        bondAction: 'held',
        scope: 'partial',
        effectiveAt: now,
        summary: 'Under review',
      });

      const parsed = parseRevocation(revocation);
      expect(parsed).not.toBeNull();
      expect(parsed!.verifierPubkey).toBe(verifier.publicKey);
      expect(parsed!.challengeEventId).toBe('ch456');
      expect(parsed!.confirmations).toBe(5);
      expect(parsed!.bondAction).toBe('held');
      expect(parsed!.scope).toBe('partial');
    });
  });

  describe('hasReachedRevocationThreshold', () => {
    it('returns true at default threshold', () => {
      expect(hasReachedRevocationThreshold(5)).toBe(true);
      expect(hasReachedRevocationThreshold(7)).toBe(true);
    });

    it('returns false below threshold', () => {
      expect(hasReachedRevocationThreshold(4)).toBe(false);
      expect(hasReachedRevocationThreshold(0)).toBe(false);
    });

    it('uses custom threshold', () => {
      expect(hasReachedRevocationThreshold(3, 3)).toBe(true);
      expect(hasReachedRevocationThreshold(2, 3)).toBe(false);
    });
  });
});
