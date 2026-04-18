/**
 * Relay Event Builders for Signet Presentation Protocol
 *
 * Builds unsigned kind 29999 event templates for verification responses,
 * rejections, and auth responses. The consuming application signs these
 * with the user's signing backend and publishes to relays.
 */

import type { NostrEvent, UnsignedEvent } from './types.js';
import type { VerifyResponse } from './presentation.js';

/**
 * Auth response payload published via relay (cross-device flow).
 *
 * Contains the full signed Kind-21236 auth event rather than a raw signature,
 * so the ceremony is compatible with every Nostr signer backend — local,
 * NIP-46 bunker, and NIP-07 browser-extension — each of which exposes
 * `signEvent` but never raw-byte signing.
 *
 * Consumers verify by:
 *   1. Recomputing `authEvent.id` from its canonical serialisation.
 *   2. Checking the recomputed id matches `authEvent.id`.
 *   3. Schnorr-verifying `authEvent.sig` over `authEvent.id` with `authEvent.pubkey`.
 *   4. Asserting `authEvent.kind === 21236`.
 *   5. Asserting `authEvent.tags` contains the expected `challenge` and `origin`.
 */
export interface AuthResponse {
  type: 'signet-auth-response';
  /** The challenge issued by the consumer. Also the correlation key on the relay subscription. */
  requestId: string;
  /** The signed Kind-21236 auth event — this is the cryptographic proof. */
  authEvent: NostrEvent;
  /** Optional credential (included for signet-login-request flows) */
  credential?: {
    id: string;
    kind: number;
    pubkey: string;
    tags: string[][];
    content: string;
    sig: string;
    created_at: number;
  };
}

/**
 * Build an unsigned kind 29999 event carrying a verification response.
 * The caller must sign this event before publishing.
 */
export function buildVerifyEventTemplate(
  response: VerifyResponse,
  pubkey: string,
): UnsignedEvent {
  const credTags = response.credential.tags;
  const ageRange = credTags.find(t => t[0] === 'age-range')?.[1] ?? '';
  const tier = credTags.find(t => t[0] === 'tier')?.[1] ?? '';
  const entityType = credTags.find(t => t[0] === 'entity-type')?.[1] ?? '';

  return {
    kind: 29999,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['session', response.requestId],
      ['credential', JSON.stringify(response.credential)],
      ['status', 'approved'],
      ['age-range', ageRange],
      ['tier', tier],
      ['entity-type', entityType],
    ],
    content: '',
  };
}

/**
 * Build an unsigned kind 29999 event for a verification rejection.
 * The caller must sign this event before publishing.
 */
export function buildRejectionEventTemplate(
  requestId: string,
  pubkey: string,
): UnsignedEvent {
  return {
    kind: 29999,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['session', requestId],
      ['status', 'rejected'],
    ],
    content: '',
  };
}

/**
 * Build an unsigned kind 29999 event for an auth response.
 * The caller must sign this event before publishing.
 */
export function buildAuthResponseEventTemplate(
  response: AuthResponse,
  pubkey: string,
): UnsignedEvent {
  return {
    kind: 29999,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['session', response.requestId],
      ['status', 'approved'],
    ],
    content: JSON.stringify(response),
  };
}
