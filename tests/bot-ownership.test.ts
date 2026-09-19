import { expect, it } from 'vitest';
import { buildBotOwnership, buildBotOwnershipRevocation, readBotOwnership, botOwnershipRenewalDue } from '../src/bot-ownership.js';
import { generateKeyPair, signEvent } from '../src/crypto.js';
import { computeBadge } from '../src/badge.js';
const owner = generateKeyPair(), bot = generateKeyPair(), now = 1700000000, DAY = 86400;
const expected = { ownerPubkey: owner.publicKey, botPubkey: bot.publicKey, now };
it('uses the existing event kind with a distinct replaceable address and never adds a trust badge', async () => {
  const unsigned = buildBotOwnership({ ...expected, label: 'Assistant' });
  expect(unsigned.kind).toBe(31000);
  expect(unsigned.tags).toContainEqual(['d', `bot-ownership:${bot.publicKey}`]);
  const event = await signEvent(unsigned, owner.privateKey);
  expect(await readBotOwnership(event, expected)).toMatchObject({ status: 'valid', claim: { label: 'Assistant', expiresAt: now + 30 * DAY } });
  expect((await computeBadge(bot.publicKey, [event], { now, verifySignatures: true })).isVerified).toBe(false);
  expect((await readBotOwnership(event, { ...expected, ownerPubkey: bot.publicKey })).status).toBe('invalid');
});
it('distinguishes lapse from signed revocation, and applies clock tolerance and stricter limits', async () => {
  const event = await signEvent(buildBotOwnership({ ...expected, label: 'Assistant' }), owner.privateKey);
  expect((await readBotOwnership(event, { ...expected, now: now + 30 * DAY + 300 })).status).toBe('valid');
  expect((await readBotOwnership(event, { ...expected, now: now + 30 * DAY + 301 })).status).toBe('lapsed');
  expect((await readBotOwnership(event, { ...expected, now: now + 2 * DAY, maxLifetimeDays: 1 })).status).toBe('lapsed');
  const revoked = await signEvent(buildBotOwnershipRevocation(expected), owner.privateKey);
  expect((await readBotOwnership(revoked, expected)).status).toBe('revoked');
  expect((await readBotOwnership({ ...event, content: '{}' }, expected)).status).toBe('invalid');
});
it('bounds creation and rejects ambiguous tags while keeping daily renewal scheduling separate from signing', async () => {
  expect(() => buildBotOwnership({ ...expected, label: 'Bot', expiresAt: now + 3600 })).toThrow();
  expect(() => buildBotOwnership({ ...expected, label: 'Bot', expiresAt: now + 91 * DAY })).toThrow();
  const unsigned = buildBotOwnership({ ...expected, label: 'Bot' });
  const event = await signEvent(unsigned, owner.privateKey);
  const ambiguous = await signEvent({ ...unsigned, tags: [...unsigned.tags, ['p', bot.publicKey]] }, owner.privateKey);
  expect((await readBotOwnership(ambiguous, expected)).status).toBe('invalid');
  const result = await readBotOwnership(event, expected);
  expect(botOwnershipRenewalDue(result, now + 19 * DAY)).toBe(false);
  expect(botOwnershipRenewalDue(result, now + 20 * DAY)).toBe(true);
  expect(botOwnershipRenewalDue(result, now + 20 * DAY, now + 20 * DAY - 100)).toBe(false);
  expect(botOwnershipRenewalDue({ status: 'revoked', ownerPubkey: owner.publicKey, botPubkey: bot.publicKey, eventId: event.id }, now + 40 * DAY)).toBe(false);
});

it('gives synchronous transport codecs the same signature, expiry and revocation verdicts', async () => {
  const { readBotOwnershipSync } = await import('../src/bot-ownership.js');
  const event = await signEvent(buildBotOwnership({ ...expected, label: 'Assistant' }), owner.privateKey);
  const revoked = await signEvent(buildBotOwnershipRevocation(expected), owner.privateKey);
  for (const value of [event, revoked, { ...event, content: '{}' }]) {
    for (const at of [now, now + 31 * DAY]) {
      const context = { ...expected, now: at };
      expect(readBotOwnershipSync(value, context)).toEqual(await readBotOwnership(value, context));
    }
  }
});
