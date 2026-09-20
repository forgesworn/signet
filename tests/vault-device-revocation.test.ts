import { describe, expect, it } from 'vitest'
import { buildVaultDeviceRevocation, isVaultDeviceRetired, readVaultDeviceRevocation } from '../src/vault-device-revocation.js'
import { getPublicKey, signEvent } from '../src/crypto.js'

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
    expect(isVaultDeviceRetired([readVaultDeviceRevocation(event)!], device, 7)).toBe(true)
    expect(isVaultDeviceRetired([readVaultDeviceRevocation(event)!], device, 6)).toBe(false)
  })
  it('rejects foreign, malformed and cross-vault events', async () => {
    const event = await signEvent(buildVaultDeviceRevocation({ authority, vault, device, effectiveSequence: 7, issuedAt: 100 }), secret)
    expect(readVaultDeviceRevocation(event, { authority: other, vault })).toBeNull()
    expect(readVaultDeviceRevocation({ ...event, tags: [...event.tags, ['x', 'y']] })).toBeNull()
    expect(readVaultDeviceRevocation(event, { authority, vault: other })).toBeNull()
  })
})
