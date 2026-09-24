/** Draft bot ownership profile of nostr-attestations. Builders never publish. */
import { createAttestation, createRevocation, buildDTag } from 'nostr-attestations';
import { verifyEventSync } from './crypto.js';
import { isSafeLabel } from './utils.js';
import type { NostrEvent, UnsignedEvent } from './types.js';
export const BOT_OWNERSHIP_TYPE = 'bot-ownership';
export const BOT_OWNERSHIP_POLICY = Object.freeze({ defaultDays: 30, minDays: 1, maxDays: 90,
  renewBeforeDays: 10, retrySeconds: 86400, clockToleranceSeconds: 300 });
const DAY = 86400, HEX = /^[0-9a-f]{64}$/;
const stamp = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const labelOk = (label: unknown): label is string => typeof label === 'string' && !!label.trim() && label.length <= 100
  && isSafeLabel(label);
function validateParties(ownerPubkey: string, botPubkey: string, now: number) {
  if (!HEX.test(ownerPubkey) || !HEX.test(botPubkey) || ownerPubkey === botPubkey || !stamp(now)) throw new Error('Invalid bot ownership parties or time');
}
/** The caller selects a persona, obtains explicit creation consent, and signs
 * this ordinary Nostr event through its existing local or NIP-46 backend. */
export function buildBotOwnership(args: { ownerPubkey: string; botPubkey: string; label: string; now: number; expiresAt?: number }): UnsignedEvent {
  validateParties(args.ownerPubkey, args.botPubkey, args.now);
  const expiresAt = args.expiresAt ?? args.now + BOT_OWNERSHIP_POLICY.defaultDays * DAY;
  if (!labelOk(args.label) || !stamp(expiresAt) || expiresAt < args.now + DAY || expiresAt > args.now + 90 * DAY) throw new Error('Bot ownership requires a label and a lifetime from one to ninety days');
  return { ...createAttestation({ type: BOT_OWNERSHIP_TYPE, subject: args.botPubkey,
    validFrom: args.now, validTo: expiresAt, expiration: expiresAt,
    content: JSON.stringify({ v: 1, label: args.label.trim() }) }), pubkey: args.ownerPubkey, created_at: args.now };
}
export function buildBotOwnershipRevocation(args: { ownerPubkey: string; botPubkey: string; now: number }): UnsignedEvent {
  validateParties(args.ownerPubkey, args.botPubkey, args.now);
  return { ...createRevocation({ type: BOT_OWNERSHIP_TYPE, identifier: args.botPubkey, subject: args.botPubkey,
    effective: args.now }), pubkey: args.ownerPubkey, created_at: args.now };
}
export interface BotOwnershipClaim { ownerPubkey: string; botPubkey: string; label: string; issuedAt: number; expiresAt: number; eventId: string }
export type BotOwnershipResult = { status: 'invalid' } | { status: 'revoked'; ownerPubkey: string; botPubkey: string; eventId: string }
  | { status: 'valid' | 'lapsed'; claim: BotOwnershipClaim };
/** No ownership trust is inherited by the bot. Callers pin the expected persona
 * and bot and separately establish that they selected the newest event. */
export async function readBotOwnership(event: NostrEvent, expected: { ownerPubkey: string; botPubkey: string; now: number; maxLifetimeDays?: number }): Promise<BotOwnershipResult> {
  return readBotOwnershipSync(event, expected);
}
/** Same validation for synchronous transport/storage codecs. */
export function readBotOwnershipSync(event: NostrEvent, expected: { ownerPubkey: string; botPubkey: string; now: number; maxLifetimeDays?: number }): BotOwnershipResult {
  const invalid = { status: 'invalid' } as const;
  const maximum = expected.maxLifetimeDays ?? BOT_OWNERSHIP_POLICY.maxDays;
  if (!stamp(expected.now) || !Number.isSafeInteger(maximum) || maximum < 1 || maximum > 90
    || !event || event.kind !== 31000 || event.pubkey !== expected.ownerPubkey || !HEX.test(expected.ownerPubkey)
    || !HEX.test(expected.botPubkey) || expected.ownerPubkey === expected.botPubkey
    || !stamp(event.created_at) || event.created_at > expected.now + BOT_OWNERSHIP_POLICY.clockToleranceSeconds
    || typeof event.content !== 'string' || event.content.length > 1000 || !Array.isArray(event.tags) || event.tags.length > 16
    || !event.tags.every(tag => Array.isArray(tag) && tag.length >= 2 && tag.length <= 4 && tag.every(value => typeof value === 'string' && value.length <= 256))) return invalid;
  const single = (name: string) => {
    const values = event.tags.filter(tag => tag[0] === name);
    return values.length === 1 ? values[0][1] : undefined;
  };
  if (single('d') !== buildDTag(BOT_OWNERSHIP_TYPE, expected.botPubkey) || single('type') !== BOT_OWNERSHIP_TYPE
    || single('p') !== expected.botPubkey || !verifyEventSync(event)) return invalid;
  const statuses = event.tags.filter(tag => tag[0] === 'status');
  if (statuses.length) {
    if (statuses.length !== 1 || statuses[0][1] !== 'revoked' || event.content !== '') return invalid;
    return { status: 'revoked', ownerPubkey: event.pubkey, botPubkey: expected.botPubkey, eventId: event.id };
  }
  const start = single('valid_from'), end = single('valid_to'), expiration = single('expiration');
  if (start !== String(event.created_at) || !end || !/^\d+$/.test(end) || end !== expiration) return invalid;
  const declared = Number(end);
  if (!stamp(declared) || declared < event.created_at + DAY) return invalid;
  let body: { v?: unknown; label?: unknown };
  try { body = JSON.parse(event.content); } catch { return invalid; }
  if (!body || body.v !== 1 || !labelOk(body.label)) return invalid;
  // A user may choose a stricter ceiling. It never extends the signed expiry.
  const expiresAt = Math.min(declared, event.created_at + maximum * DAY, event.created_at + 90 * DAY);
  return { status: expected.now > expiresAt + BOT_OWNERSHIP_POLICY.clockToleranceSeconds ? 'lapsed' : 'valid',
    claim: { ownerPubkey: event.pubkey, botPubkey: expected.botPubkey, label: body.label.trim(), issuedAt: event.created_at, expiresAt, eventId: event.id } };
}
/** Scheduling only: hardware signing still needs its normal approval. */
export function botOwnershipRenewalDue(result: BotOwnershipResult, now: number, lastAttemptAt?: number): boolean {
  if (!stamp(now) || (lastAttemptAt !== undefined && (!stamp(lastAttemptAt) || now - lastAttemptAt < BOT_OWNERSHIP_POLICY.retrySeconds))) return false;
  return (result.status === 'valid' || result.status === 'lapsed') && now >= result.claim.issuedAt
    && result.claim.expiresAt - now <= BOT_OWNERSHIP_POLICY.renewBeforeDays * DAY;
}
