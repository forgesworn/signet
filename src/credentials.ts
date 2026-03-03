// Kind 30470 — Verification Credential
// Create, sign, verify, and parse Signet credentials for all 4 tiers

import { SIGNET_KINDS, SIGNET_LABEL, DEFAULT_CREDENTIAL_EXPIRY_SECONDS } from './constants.js';
import { signEvent, verifyEvent, getPublicKey } from './crypto.js';
import { validateCredential, getTagValue } from './validation.js';
import { ringSign, ringVerify, type RingSignature } from './ring-signature.js';
import { createAgeRangeProof, verifyAgeRangeProof, serializeRangeProof, deserializeRangeProof, type RangeProof } from './range-proof.js';
import type {
  NostrEvent,
  UnsignedEvent,
  CredentialParams,
  ParsedCredential,
  SignetTier,
  VerificationType,
  VerificationScope,
  VerificationMethod,
} from './types.js';

/** Build an unsigned credential event */
export function buildCredentialEvent(
  verifierPubkey: string,
  params: CredentialParams
): UnsignedEvent {
  const tags: string[][] = [
    ['d', params.subjectPubkey],
    ['p', params.subjectPubkey],
    ['tier', String(params.tier)],
    ['type', params.type],
    ['scope', params.scope],
    ['method', params.method],
    ['expires', String(params.expiresAt)],
    ['L', SIGNET_LABEL],
    ['l', 'verification', SIGNET_LABEL],
  ];

  if (params.profession) tags.push(['profession', params.profession]);
  if (params.jurisdiction) tags.push(['jurisdiction', params.jurisdiction]);
  if (params.ageRange) tags.push(['age-range', params.ageRange]);

  return {
    kind: SIGNET_KINDS.CREDENTIAL,
    pubkey: verifierPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: params.content || '',
  };
}

/** Create and sign a Tier 1 (self-declared) credential */
export async function createSelfDeclaredCredential(
  privateKey: string,
  scope: VerificationScope = 'adult',
  expiresAt?: number
): Promise<NostrEvent> {
  const pubkey = getPublicKey(privateKey);
  const event = buildCredentialEvent(pubkey, {
    subjectPubkey: pubkey,
    tier: 1,
    type: 'self',
    scope,
    method: 'self-declaration',
    expiresAt: expiresAt || Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60,
  });
  return signEvent(event, privateKey);
}

/** Create and sign a Tier 2 (web-of-trust vouched) credential.
 *  Typically issued by a community operator or aggregated from vouches. */
export async function createPeerVouchedCredential(
  issuerPrivateKey: string,
  subjectPubkey: string,
  expiresAt?: number
): Promise<NostrEvent> {
  const pubkey = getPublicKey(issuerPrivateKey);
  const event = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 2,
    type: 'peer',
    scope: 'adult',
    method: 'in-person',
    expiresAt: expiresAt || Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60,
  });
  return signEvent(event, issuerPrivateKey);
}

/** Create and sign a Tier 3 (professional verified adult) credential */
export async function createProfessionalCredential(
  verifierPrivateKey: string,
  subjectPubkey: string,
  opts: {
    profession: string;
    jurisdiction: string;
    expiresAt?: number;
    proofBlob?: string;
  }
): Promise<NostrEvent> {
  const pubkey = getPublicKey(verifierPrivateKey);
  const event = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 3,
    type: 'professional',
    scope: 'adult',
    method: 'in-person-id',
    profession: opts.profession,
    jurisdiction: opts.jurisdiction,
    expiresAt: opts.expiresAt || Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60,
    content: opts.proofBlob,
  });
  return signEvent(event, verifierPrivateKey);
}

/** Create and sign a Tier 4 (professional verified adult+child) credential */
export async function createChildSafetyCredential(
  verifierPrivateKey: string,
  subjectPubkey: string,
  opts: {
    profession: string;
    jurisdiction: string;
    ageRange: string;
    expiresAt?: number;
    proofBlob?: string;
  }
): Promise<NostrEvent> {
  const pubkey = getPublicKey(verifierPrivateKey);
  const event = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 4,
    type: 'professional',
    scope: 'adult+child',
    method: 'in-person-id',
    profession: opts.profession,
    jurisdiction: opts.jurisdiction,
    ageRange: opts.ageRange,
    expiresAt: opts.expiresAt || Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60,
    content: opts.proofBlob,
  });
  return signEvent(event, verifierPrivateKey);
}

/** Verify a credential event's signature and structure */
export async function verifyCredential(event: NostrEvent): Promise<{
  signatureValid: boolean;
  structureValid: boolean;
  expired: boolean;
  errors: string[];
}> {
  const signatureValid = await verifyEvent(event);
  const validation = validateCredential(event);
  const expiresStr = getTagValue(event, 'expires');
  const expired = expiresStr ? parseInt(expiresStr) < Math.floor(Date.now() / 1000) : false;

  return {
    signatureValid,
    structureValid: validation.valid,
    expired,
    errors: validation.errors,
  };
}

/** Check if a credential is expired */
export function isCredentialExpired(event: NostrEvent): boolean {
  const expiresStr = getTagValue(event, 'expires');
  if (!expiresStr) return false;
  return parseInt(expiresStr) < Math.floor(Date.now() / 1000);
}

/** Parse a credential event into a structured object */
export function parseCredential(event: NostrEvent): ParsedCredential | null {
  if (event.kind !== SIGNET_KINDS.CREDENTIAL) return null;

  const tier = getTagValue(event, 'tier');
  if (!tier) return null;

  return {
    subjectPubkey: getTagValue(event, 'd') || '',
    tier: parseInt(tier) as SignetTier,
    type: (getTagValue(event, 'type') || 'self') as VerificationType,
    scope: (getTagValue(event, 'scope') || 'adult') as VerificationScope,
    method: (getTagValue(event, 'method') || 'self-declaration') as VerificationMethod,
    profession: getTagValue(event, 'profession'),
    jurisdiction: getTagValue(event, 'jurisdiction'),
    ageRange: getTagValue(event, 'age-range'),
    expiresAt: getTagValue(event, 'expires') ? parseInt(getTagValue(event, 'expires')!) : undefined,
  };
}

// --- Ring Signature Enhanced Credentials (Tier 3/4) ---

/** Content structure for ring-signature-protected credentials */
export interface RingProtectedContent {
  ringSignature: RingSignature;
  rangeProof?: RangeProof;
}

/**
 * Create a Tier 3 credential with ring signature issuer privacy.
 * The credential is signed by the verifier's Nostr key (for relay acceptance),
 * but the content includes a ring signature proving "one of N verifiers" issued it.
 */
export async function createRingProtectedCredential(
  verifierPrivateKey: string,
  subjectPubkey: string,
  ring: string[],
  signerIndex: number,
  opts: {
    profession: string;
    jurisdiction: string;
    expiresAt?: number;
  }
): Promise<NostrEvent> {
  const pubkey = getPublicKey(verifierPrivateKey);

  // Build the event first to get its ID
  const event = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 3,
    type: 'professional',
    scope: 'adult',
    method: 'in-person-id',
    profession: opts.profession,
    jurisdiction: opts.jurisdiction,
    expiresAt: opts.expiresAt || Math.floor(Date.now() / 1000) + DEFAULT_CREDENTIAL_EXPIRY_SECONDS,
    content: '', // placeholder
  });

  // Sign the event to get its ID
  const signed = await signEvent(event, verifierPrivateKey);

  // Create ring signature over the event ID + subject
  const ringSig = ringSign(
    `signet:credential:${signed.id}:${subjectPubkey}`,
    ring,
    signerIndex,
    verifierPrivateKey
  );

  const content: RingProtectedContent = { ringSignature: ringSig };

  // Re-sign with the content populated
  const finalEvent = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 3,
    type: 'professional',
    scope: 'adult',
    method: 'in-person-id',
    profession: opts.profession,
    jurisdiction: opts.jurisdiction,
    expiresAt: opts.expiresAt || Math.floor(Date.now() / 1000) + DEFAULT_CREDENTIAL_EXPIRY_SECONDS,
    content: JSON.stringify(content),
  });

  return signEvent(finalEvent, verifierPrivateKey);
}

/**
 * Create a Tier 4 credential with ring signature AND age range proof.
 */
export async function createRingProtectedChildCredential(
  verifierPrivateKey: string,
  subjectPubkey: string,
  ring: string[],
  signerIndex: number,
  opts: {
    profession: string;
    jurisdiction: string;
    ageRange: string;
    actualAge: number;
    expiresAt?: number;
  }
): Promise<NostrEvent> {
  const pubkey = getPublicKey(verifierPrivateKey);

  // Create the age range proof
  const rangeProof = createAgeRangeProof(opts.actualAge, opts.ageRange);

  // Build and sign to get event ID
  const event = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 4,
    type: 'professional',
    scope: 'adult+child',
    method: 'in-person-id',
    profession: opts.profession,
    jurisdiction: opts.jurisdiction,
    ageRange: opts.ageRange,
    expiresAt: opts.expiresAt || Math.floor(Date.now() / 1000) + DEFAULT_CREDENTIAL_EXPIRY_SECONDS,
    content: '', // placeholder
  });

  const signed = await signEvent(event, verifierPrivateKey);

  // Ring signature over event
  const ringSig = ringSign(
    `signet:credential:${signed.id}:${subjectPubkey}`,
    ring,
    signerIndex,
    verifierPrivateKey
  );

  const content: RingProtectedContent = {
    ringSignature: ringSig,
    rangeProof,
  };

  const finalEvent = buildCredentialEvent(pubkey, {
    subjectPubkey,
    tier: 4,
    type: 'professional',
    scope: 'adult+child',
    method: 'in-person-id',
    profession: opts.profession,
    jurisdiction: opts.jurisdiction,
    ageRange: opts.ageRange,
    expiresAt: opts.expiresAt || Math.floor(Date.now() / 1000) + DEFAULT_CREDENTIAL_EXPIRY_SECONDS,
    content: JSON.stringify(content),
  });

  return signEvent(finalEvent, verifierPrivateKey);
}

/**
 * Verify the ring signature and optional range proof inside a credential's content.
 */
export function verifyRingProtectedContent(event: NostrEvent): {
  hasRingSignature: boolean;
  ringValid: boolean;
  hasRangeProof: boolean;
  rangeProofValid: boolean;
} {
  const result = {
    hasRingSignature: false,
    ringValid: false,
    hasRangeProof: false,
    rangeProofValid: false,
  };

  if (!event.content) return result;

  try {
    const content = JSON.parse(event.content) as RingProtectedContent;

    if (content.ringSignature) {
      result.hasRingSignature = true;
      result.ringValid = ringVerify(content.ringSignature);
    }

    if (content.rangeProof) {
      result.hasRangeProof = true;
      result.rangeProofValid = verifyAgeRangeProof(content.rangeProof);
    }
  } catch {
    // Content is not JSON or not a RingProtectedContent — that's OK for Tier 1/2
  }

  return result;
}

// --- Credential Renewal ---

/**
 * Renew an expiring credential. Creates a new credential with the same parameters
 * but a fresh expiry. Must be issued by the same verifier (or a new one for re-verification).
 */
export async function renewCredential(
  verifierPrivateKey: string,
  existingCredential: NostrEvent,
  newExpiresAt?: number
): Promise<NostrEvent> {
  const parsed = parseCredential(existingCredential);
  if (!parsed) throw new Error('Invalid credential to renew');

  const pubkey = getPublicKey(verifierPrivateKey);
  const expiresAt = newExpiresAt || Math.floor(Date.now() / 1000) + DEFAULT_CREDENTIAL_EXPIRY_SECONDS;

  const event = buildCredentialEvent(pubkey, {
    subjectPubkey: parsed.subjectPubkey,
    tier: parsed.tier,
    type: parsed.type,
    scope: parsed.scope,
    method: parsed.method,
    profession: parsed.profession,
    jurisdiction: parsed.jurisdiction,
    ageRange: parsed.ageRange,
    expiresAt,
  });

  return signEvent(event, verifierPrivateKey);
}

/**
 * Check if a credential needs renewal (within N days of expiry).
 */
export function needsRenewal(event: NostrEvent, withinDays: number = 30): boolean {
  const expiresStr = getTagValue(event, 'expires');
  if (!expiresStr) return false;

  const expiresAt = parseInt(expiresStr);
  const now = Math.floor(Date.now() / 1000);
  const threshold = now + withinDays * 24 * 60 * 60;

  return expiresAt <= threshold;
}
