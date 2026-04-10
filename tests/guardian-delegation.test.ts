import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  createGuardianDelegation,
  getTagValue,
  ATTESTATION_KIND,
  ATTESTATION_TYPES,
  signEvent,
  verifyEvent,
} from '../src/index.js';

describe('Guardian Delegation', () => {
  describe('End-to-end delegation flow', () => {
    it('creates parent and child identities', () => {
      const parent = generateKeyPair();
      const child = generateKeyPair();

      expect(parent.publicKey).toBeDefined();
      expect(parent.privateKey).toBeDefined();
      expect(child.publicKey).toBeDefined();
      expect(child.privateKey).toBeDefined();
      expect(parent.publicKey).not.toBe(child.publicKey);
    });

    it('issues a guardian delegation from parent to delegate with activity-approval scope', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      expect(delegation.kind).toBe(ATTESTATION_KIND);
      expect(delegation.pubkey).toBe(parent.publicKey);
      expect(getTagValue(delegation, 'type')).toBe(ATTESTATION_TYPES.DELEGATION);
    });

    it('delegation event includes required tags', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      expect(getTagValue(delegation, 'type')).toBe(ATTESTATION_TYPES.DELEGATION);
      expect(getTagValue(delegation, 'child')).toBe(child.publicKey);
      expect(getTagValue(delegation, 'scope')).toBe('activity-approval');
      expect(getTagValue(delegation, 'delegation-type')).toBe('guardian-delegate');
      expect(getTagValue(delegation, 'p')).toBe(delegate.publicKey);
      expect(getTagValue(delegation, 'algo')).toBe('secp256k1');
    });

    it('delegation passes signature verification', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      // Verify signature using verifyEvent (not verifyCredential, which checks credential-specific fields)
      const signatureValid = await verifyEvent(delegation);
      expect(signatureValid).toBe(true);

      // Verify basic structure
      expect(delegation.kind).toBe(ATTESTATION_KIND);
      expect(delegation.pubkey).toBe(parent.publicKey);
      expect(delegation.sig).toBeDefined();
    });

    it('consumer can extract and verify the delegation scope', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      // Consumer receives delegation event
      const delegateScope = getTagValue(delegation, 'scope');
      const delegateChild = getTagValue(delegation, 'child');
      const delegatePubkey = getTagValue(delegation, 'p');

      expect(delegateScope).toBe('activity-approval');
      expect(delegateChild).toBe(child.publicKey);
      expect(delegatePubkey).toBe(delegate.publicKey);

      // Verify the delegation is signed by the parent
      expect(delegation.pubkey).toBe(parent.publicKey);
      const signatureValid = await verifyEvent(delegation);
      expect(signatureValid).toBe(true);
    });

    it('delegation includes expiration that can be checked', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();
      const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt,
      });

      const expiresTag = getTagValue(delegation, 'expiration');
      expect(expiresTag).toBe(String(expiresAt));
      expect(Number(expiresTag)).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('revocation can be issued by the parent', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      // Parent issues a revocation (another kind 31000 event with type: revocation)
      // The revocation references the delegation's d tag
      const delegationId = getTagValue(delegation, 'd');
      expect(delegationId).toBeDefined();

      // Create revocation event template
      const revocation = {
        kind: ATTESTATION_KIND,
        pubkey: parent.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['type', ATTESTATION_TYPES.REVOCATION],
          ['d', delegationId!],
          ['reason', 'parent-revoked'],
        ],
        content: '',
      };

      // Sign the revocation
      const signed = await signEvent(revocation, parent.privateKey);
      expect(signed.kind).toBe(ATTESTATION_KIND);
      expect(getTagValue(signed, 'type')).toBe(ATTESTATION_TYPES.REVOCATION);

      // Verify the revocation signature is valid
      const signatureValid = await verifyEvent(signed);
      expect(signatureValid).toBe(true);
    });

    it('delegation with different scopes', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();

      // Test 'full' scope
      const fullDelegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'full',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      expect(getTagValue(fullDelegation, 'scope')).toBe('full');

      // Test 'activity-approval' scope
      const approvalDelegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      expect(getTagValue(approvalDelegation, 'scope')).toBe('activity-approval');
    });

    it('multiple delegates can be granted authority over same child', async () => {
      const parent = generateKeyPair();
      const delegate1 = generateKeyPair();
      const delegate2 = generateKeyPair();
      const child = generateKeyPair();

      const delegation1 = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate1.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      const delegation2 = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate2.publicKey,
        scope: 'full',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      });

      expect(getTagValue(delegation1, 'p')).toBe(delegate1.publicKey);
      expect(getTagValue(delegation2, 'p')).toBe(delegate2.publicKey);
      expect(getTagValue(delegation1, 'child')).toBe(child.publicKey);
      expect(getTagValue(delegation2, 'child')).toBe(child.publicKey);
    });

    it('occurredAt timestamp is included when provided', async () => {
      const parent = generateKeyPair();
      const delegate = generateKeyPair();
      const child = generateKeyPair();
      const occurredAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const delegation = await createGuardianDelegation(parent.privateKey, {
        childPubkey: child.publicKey,
        delegatePubkey: delegate.publicKey,
        scope: 'activity-approval',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        occurredAt,
      });

      expect(getTagValue(delegation, 'occurred_at')).toBe(String(occurredAt));
    });
  });
});
