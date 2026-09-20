import { describe, expect, it } from 'vitest'
import { buildVaultDeviceRevocation, isVaultDeviceRetired, readVaultDeviceRevocation } from '../src/vault-device-revocation.js'
import { getPublicKey, signEvent } from '../src/crypto.js'
import type { NostrEvent } from '../src/types.js'

const secret = '1'.repeat(64), authority = getPublicKey(secret), vault = '2'.repeat(64), device = '3'.repeat(64), other = '4'.repeat(64)
describe('vault device revocation', () => {
  it('keeps separate replacement addresses for each vault and device', async () => {
    const events = await Promise.all([
      { vault, device }, { vault, device: other }, { vault: other, device },
    ].map((pair, i) => signEvent(buildVaultDeviceRevocation({ authority, ...pair, effectiveSequence: 7, issuedAt: 100 + i }), secret)));
    expect(new Set(events.map(event => `${event.pubkey}:${event.kind}:${event.tags[0][1]}`)).size).toBe(3);
    for (const event of events) expect(readVaultDeviceRevocation(event, { authority })).not.toBeNull();
    const legacy = await signEvent({ ...events[0], tags: events[0].tags.map((tag, i) => i === 0 ? ['d', 'signet:vault-device-revocation:v1'] : tag) }, secret);
    expect(readVaultDeviceRevocation(legacy, { authority })).toBeNull();
  });
  it('builds and verifies an owner-authorised retirement', async () => {
    const unsigned = buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence: 7, issuedAt: 100 })
    const event = await signEvent(unsigned, secret)
    expect(readVaultDeviceRevocation(event, { authority, vault, now: 100 })).toMatchObject({ vault, device, effectiveSequence: 7 })
    const context = { authority, vault, device, now: 100 }
    expect(isVaultDeviceRetired([event], { ...context, sequence: 7 })).toBe(true)
    expect(isVaultDeviceRetired([event], { ...context, sequence: 6 })).toBe(false)
    expect(isVaultDeviceRetired([event], { ...context, sequence: 8 })).toBe(true)
    expect(isVaultDeviceRetired([event], { ...context, sequence: 2 ** 32 })).toBe(true)
  })
  it('rejects foreign, malformed and cross-vault events', async () => {
    const event = await signEvent(buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence: 7, issuedAt: 100 }), secret)
    expect(readVaultDeviceRevocation(event, { authority: other, vault })).toBeNull()
    expect(readVaultDeviceRevocation({ ...event, tags: [...event.tags, ['x', 'y']] })).toBeNull()
    expect(readVaultDeviceRevocation(event, { authority, vault: other })).toBeNull()
  })
  it('requires matching vault and independently pinned authority at enforcement', async () => {
    const event = await signEvent(buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence: 7, issuedAt: 100 }), secret)
    const context = { authority, vault, device, sequence: 7, now: 100 }
    expect(isVaultDeviceRetired([event], { ...context, vault: other })).toBe(false)
    expect(isVaultDeviceRetired([event], { ...context, authority: other })).toBe(false)
    expect(isVaultDeviceRetired([event], { ...context, device: other })).toBe(false)
    expect(() => isVaultDeviceRetired([event], { ...context, authority: undefined! })).toThrow('context')
    expect(() => isVaultDeviceRetired([event], { ...context, sequence: -1 })).toThrow('query')
  })
  it('rejects parsed records, invalid signatures and future evidence instead of trusting their fields', async () => {
    const event = await signEvent(buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence: 7, issuedAt: 100 }), secret)
    const context = { authority, vault, device, sequence: 7, now: 100 }
    for (const invalid of [readVaultDeviceRevocation(event), { ...event, sig: '0'.repeat(128) }, { ...event, tags: [] }]) {
      expect(() => isVaultDeviceRetired([invalid as NostrEvent], context)).toThrow('evidence')
    }
    const future = await signEvent(buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence: 7, issuedAt: 401 }), secret)
    expect(() => isVaultDeviceRetired([future], context)).toThrow('evidence')
  })
  it('retains the earliest authenticated cutoff regardless of event order', async () => {
    const events = await Promise.all([7, 12].map((effectiveSequence, i) => signEvent(
      buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence, issuedAt: 100 + i }), secret)))
    const context = { authority, vault, device, sequence: 8, now: 101 }
    expect(isVaultDeviceRetired(events, context)).toBe(true)
    expect(isVaultDeviceRetired([...events].reverse(), context)).toBe(true)
  })
})
