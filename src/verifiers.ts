// Kind 30473 — Verifier Credential
// Professional verifier registration and cross-verification

import { SIGNET_KINDS, SIGNET_LABEL, VERIFIER_ACTIVATION, DEFAULT_CRYPTO_ALGORITHM } from './constants.js';
import { signEvent, getPublicKey } from './crypto.js';
import { getTagValue } from './validation.js';
import type {
  NostrEvent,
  UnsignedEvent,
  VerifierParams,
  ParsedVerifier,
  CryptoAlgorithm,
} from './types.js';

/** Build an unsigned verifier credential event */
export function buildVerifierEvent(
  verifierPubkey: string,
  params: VerifierParams
): UnsignedEvent {
  return {
    kind: SIGNET_KINDS.VERIFIER,
    pubkey: verifierPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', 'verifier-credential'],
      ['profession', params.profession],
      ['jurisdiction', params.jurisdiction],
      ['licence', params.licenceHash],
      ['body', params.professionalBody],
      ['algo', DEFAULT_CRYPTO_ALGORITHM],
      ['L', SIGNET_LABEL],
      ['l', 'verifier', SIGNET_LABEL],
    ],
    content: params.statement || '',
  };
}

/** Create and sign a verifier credential */
export async function createVerifierCredential(
  privateKey: string,
  params: VerifierParams
): Promise<NostrEvent> {
  const pubkey = getPublicKey(privateKey);
  const event = buildVerifierEvent(pubkey, params);
  return signEvent(event, privateKey);
}

/** Parse a verifier credential event */
export function parseVerifier(event: NostrEvent): ParsedVerifier | null {
  if (event.kind !== SIGNET_KINDS.VERIFIER) return null;

  const algorithm = (getTagValue(event, 'algo') || DEFAULT_CRYPTO_ALGORITHM) as CryptoAlgorithm;

  return {
    profession: getTagValue(event, 'profession') || '',
    jurisdiction: getTagValue(event, 'jurisdiction') || '',
    licenceHash: getTagValue(event, 'licence') || '',
    professionalBody: getTagValue(event, 'body') || '',
    algorithm,
  };
}

/** Check if a verifier has sufficient cross-verification.
 *  Requires vouches from verified professionals in different fields. */
export function checkCrossVerification(
  verifierPubkey: string,
  vouches: NostrEvent[],
  verifierCredentials: NostrEvent[]
): {
  activated: boolean;
  vouchCount: number;
  professions: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const professionsSet = new Set<string>();
  const vouchersSeen = new Set<string>();
  let vouchCount = 0;

  // Build a map of verifier pubkey -> profession
  const verifierProfessions = new Map<string, string>();
  for (const cred of verifierCredentials) {
    if (cred.kind !== SIGNET_KINDS.VERIFIER) continue;
    const profession = getTagValue(cred, 'profession');
    if (profession) {
      verifierProfessions.set(cred.pubkey, profession);
    }
  }

  // Count qualifying vouches (from other verified professionals)
  for (const vouch of vouches) {
    if (vouch.kind !== SIGNET_KINDS.VOUCH) continue;

    const subject = getTagValue(vouch, 'd');
    if (subject !== verifierPubkey) continue;

    // Voucher must themselves be a verified professional
    const voucherProfession = verifierProfessions.get(vouch.pubkey);
    if (!voucherProfession) continue;

    // One vouch per voucher
    if (vouchersSeen.has(vouch.pubkey)) continue;
    vouchersSeen.add(vouch.pubkey);

    professionsSet.add(voucherProfession);
    vouchCount++;
  }

  const professions = Array.from(professionsSet);
  const activated =
    vouchCount >= VERIFIER_ACTIVATION.MIN_VOUCHES &&
    professions.length >= VERIFIER_ACTIVATION.MIN_PROFESSIONS;

  if (vouchCount < VERIFIER_ACTIVATION.MIN_VOUCHES) {
    errors.push(
      `Need ${VERIFIER_ACTIVATION.MIN_VOUCHES} vouches from verified professionals, have ${vouchCount}`
    );
  }
  if (professions.length < VERIFIER_ACTIVATION.MIN_PROFESSIONS) {
    errors.push(
      `Need vouches from ${VERIFIER_ACTIVATION.MIN_PROFESSIONS} different professions, have ${professions.length}`
    );
  }

  return { activated, vouchCount, professions, errors };
}

/** Check if a verifier credential has been revoked */
export function isVerifierRevoked(
  verifierPubkey: string,
  revocations: NostrEvent[]
): boolean {
  return revocations.some((rev) => {
    if (rev.kind !== SIGNET_KINDS.REVOCATION) return false;
    const target = getTagValue(rev, 'd');
    return target === verifierPubkey;
  });
}
