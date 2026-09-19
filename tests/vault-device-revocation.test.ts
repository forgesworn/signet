import { describe, expect, it } from 'vitest'
import { buildVaultDeviceRevocation, isVaultDeviceRetired, readVaultDeviceRevocation } from '../src/vault-device-revocation.js'
import { getPublicKey, signEvent } from '../src/crypto.js'

const secret = '1'.repeat(64), authority = getPublicKey(secret), vault = '2'.repeat(64), device = '3'.repeat(64), other = '4'.repeat(64)
describe('vault device revocation', () => {
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
