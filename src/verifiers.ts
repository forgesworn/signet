// Verifier Credential (kind 31000, type: verifier)
// Professional verifier registration and cross-verification

import { createAttestation, parseAttestation } from 'nostr-attestations';
import { ATTESTATION_KIND, ATTESTATION_TYPES, VERIFIER_ACTIVATION, DEFAULT_CRYPTO_ALGORITHM } from './constants.js';
import { signEvent, getPublicKey } from './crypto.js';
import { getTagValue } from './validation.js';
import { bondProofToTags, parseBondProof } from './bonds.js';
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
  const signetTags: string[][] = [
    ['profession', params.profession],
    ['jurisdiction', params.jurisdiction],
    ['licence', params.licenceHash],
    ['body', params.professionalBody],
    ['algo', DEFAULT_CRYPTO_ALGORITHM],
  ];

  if (params.bondProof) {
    signetTags.push(...bondProofToTags(params.bondProof));
  }

  const template = createAttestation({
    type: ATTESTATION_TYPES.VERIFIER,
    identifier: verifierPubkey,
    summary: `${params.profession} verifier in ${params.jurisdiction}`,
    tags: signetTags,
    content: params.statement || '',
  });

  return {
    ...template,
    pubkey: verifierPubkey,
    created_at: Math.floor(Date.now() / 1000),
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
  const base = parseAttestation(event);
  if (!base) return null;
  if (base.type !== ATTESTATION_TYPES.VERIFIER) return null;

  const algorithm = (getTagValue(event, 'algo') || DEFAULT_CRYPTO_ALGORITHM) as CryptoAlgorithm;

  return {
    profession: getTagValue(event, 'profession') || '',
    jurisdiction: getTagValue(event, 'jurisdiction') || '',
    licenceHash: getTagValue(event, 'licence') || '',
    professionalBody: getTagValue(event, 'body') || '',
    algorithm,
    bondProof: parseBondProof(event) ?? undefined,
  };
}

/** Check if a verifier has sufficient cross-verification.
 *  Requires vouches from verified professionals in different fields.
 *
 *  The spec also requires each voucher to be an active, non-revoked verifier.
 *  Pass `options.revocations` to skip vouchers that `isVerifierRevoked` reports
 *  as revoked, and `options.isActiveVerifier` to skip vouchers your client does
 *  not treat as activated. Activation is recursive (a voucher's own activation
 *  depends on its vouchers), so the library takes it as a caller-supplied
 *  predicate rather than resolving the chain itself. Without these options a
 *  voucher only needs a `type: verifier` credential with a `profession` tag. */
export function checkCrossVerification(
  verifierPubkey: string,
  vouches: NostrEvent[],
  verifierCredentials: NostrEvent[],
  options?: {
    revocations?: NostrEvent[];
    isActiveVerifier?: (voucherPubkey: string) => boolean;
  }
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
    if (cred.kind !== ATTESTATION_KIND) continue;
    if (getTagValue(cred, 'type') !== ATTESTATION_TYPES.VERIFIER) continue;
    const profession = getTagValue(cred, 'profession');
    if (profession) {
      verifierProfessions.set(cred.pubkey, profession);
    }
  }

  // Count qualifying vouches (from other verified professionals)
  for (const vouch of vouches) {
    if (vouch.kind !== ATTESTATION_KIND) continue;
    if (getTagValue(vouch, 'type') !== ATTESTATION_TYPES.VOUCH) continue;

    const dTag = getTagValue(vouch, 'd') || '';
    const subject = dTag.startsWith('vouch:') ? dTag.slice('vouch:'.length) : dTag;
    if (subject !== verifierPubkey) continue;

    // Voucher must themselves be a verified professional
    const voucherProfession = verifierProfessions.get(vouch.pubkey);
    if (!voucherProfession) continue;

    // Voucher must be active and not revoked, when the caller supplies the evidence
    if (options?.revocations && isVerifierRevoked(vouch.pubkey, options.revocations)) continue;
    if (options?.isActiveVerifier && !options.isActiveVerifier(vouch.pubkey)) continue;

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
    if (rev.kind !== ATTESTATION_KIND) return false;
    if (getTagValue(rev, 'type') !== ATTESTATION_TYPES.REVOCATION) return false;
    const dTag = getTagValue(rev, 'd') || '';
    const target = dTag.startsWith('revocation:') ? dTag.slice('revocation:'.length) : dTag;
    return target === verifierPubkey;
  });
}
