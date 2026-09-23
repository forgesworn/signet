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

it('rejects a claim or revocation with the wrong d or type tag', async () => {
  const unsigned = buildBotOwnership({ ...expected, label: 'Assistant' });
  const revocation = buildBotOwnershipRevocation(expected);
  const other = generateKeyPair().publicKey;
  const swap = (tags: string[][], name: string, value: string) => tags.map(t => t[0] === name ? [name, value] : t);
  for (const base of [unsigned, revocation]) {
    for (const tags of [swap(base.tags, 'd', `bot-ownership:${other}`), swap(base.tags, 'd', bot.publicKey),
      swap(base.tags, 'type', 'vouch'), base.tags.filter(t => t[0] !== 'type'), [...base.tags, ['d', `bot-ownership:${bot.publicKey}`]]]) {
      expect((await readBotOwnership(await signEvent({ ...base, tags }, owner.privateKey), expected)).status).toBe('invalid');
    }
  }
});

it('a stale claim cannot outrank a newer revocation, even by forward-dating', async () => {
  const claim = await signEvent(buildBotOwnership({ ...expected, label: 'Assistant' }), owner.privateKey);
  const revocation = await signEvent(buildBotOwnershipRevocation({ ...expected, now: now + DAY }), owner.privateKey);
  const later = { ...expected, now: now + DAY };
  // Each event is judged alone; the consumer keeps the newest same-address event.
  const verdicts = await Promise.all([claim, revocation].map(async e => ({ e, r: await readBotOwnership(e, later) })));
  verdicts.sort((a, b) => b.e.created_at - a.e.created_at);
  expect(verdicts[0].r.status).toBe('revoked');
  expect(verdicts[1].r.status).toBe('valid');
  // Re-signing the claim past the reader's clock tolerance to beat the revocation is refused.
  const forward = await signEvent(buildBotOwnership({ ...expected, now: now + DAY + 301, label: 'Assistant' }), owner.privateKey);
  expect((await readBotOwnership(forward, later)).status).toBe('invalid');
});

it('refuses control and bidirectional-override characters in labels, on build and on read', async () => {
  for (const label of ['Bot‮evil', 'Bot⁦x⁩', 'Bot\u0007', 'Line\nbreak', 'Tab\there', 'Del\u007f', '   ']) {
    expect(() => buildBotOwnership({ ...expected, label })).toThrow();
    const base = buildBotOwnership({ ...expected, label: 'Assistant' });
    const forged = await signEvent({ ...base, content: JSON.stringify({ v: 1, label }) }, owner.privateKey);
    expect((await readBotOwnership(forged, expected)).status).toBe('invalid');
  }
});

it('refuses LRM/RLM, ALM, line/paragraph separators and C1 controls in labels', async () => {
  for (const label of ['Bot‎', 'Bot‏', 'Bot؜', 'Bot x', 'Bot x', 'Bot\u0085', 'Bot\u009b', 'Bot​']) {
    expect(() => buildBotOwnership({ ...expected, label })).toThrow();
    const base = buildBotOwnership({ ...expected, label: 'Assistant' });
    const forged = await signEvent({ ...base, content: JSON.stringify({ v: 1, label }) }, owner.privateKey);
    expect((await readBotOwnership(forged, expected)).status).toBe('invalid');
  }
  expect(buildBotOwnership({ ...expected, label: 'Café ロボット 🤖' }).content).toContain('Café');
});
