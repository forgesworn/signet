import { describe, expect, it, vi } from 'vitest'
import { schnorr } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { signEvent } from '../src/crypto.js'
import { readVaultSnapshot, readVaultRotations, readVaultHeads, readVaultHeadRotations } from '../src/vault-recovery.js'
import { vaultCheckpointTag, vaultContentHash } from '../src/vault-checkpoint.js'
import { buildVaultDeviceRevocation, readVaultDeviceRevocation } from '../src/vault-device-revocation.js'
import type { NostrEvent } from '../src/types.js'
const sk = '01'.repeat(32), deviceSk = '02'.repeat(32)
const author = bytesToHex(schnorr.getPublicKey(hexToBytes(sk)))
const device = bytesToHex(schnorr.getPublicKey(hexToBytes(deviceSk)))
const expected = { author, purpose: 'signet:vault:profiles', rotation: 0 }
async function fixture() {
  const chunk = await signEvent({ kind: 30078, pubkey: device, created_at: 100, tags: [['d', 'chunk']], content: 'body' }, deviceSk)
  const manifest = { v: 1, purpose: expected.purpose, rotation: 0, sequence: 2, revision: vaultContentHash('data'),
    devicePubkeys: [device], chunks: [{ eventId: chunk.id, author: device, contentHash: vaultContentHash(chunk.content), contentBytes: 4 }] }
  const checkpoint = await signEvent({ kind: 30078, pubkey: author, created_at: 101, tags: [['d', vaultCheckpointTag(author)]], content: 'control' }, sk)
  const reader = { checkpoints: vi.fn(async () => [checkpoint]), chunk: vi.fn(async () => chunk),
    open: vi.fn(async (content: string) => content === 'control' ? JSON.stringify(manifest) : 'data') }
  return { reader, chunk, checkpoint, manifest }
}
describe('vault recovery before migration', () => {
  it('verifies signed control and device chunk then checks the complete revision', async () => {
    const { reader } = await fixture()
    expect(await readVaultSnapshot(reader, expected)).toMatchObject({ state: 'ready', plaintext: 'data' })
    expect(reader.open).toHaveBeenLastCalledWith('body', author)
  })
  it('distinguishes absent and offline so failure cannot permit migration', async () => {
    const { reader } = await fixture()
    reader.checkpoints.mockResolvedValue([])
    expect(await readVaultSnapshot(reader, expected)).toEqual({ state: 'absent' })
    reader.checkpoints.mockRejectedValue(new Error('offline'))
    expect(await readVaultSnapshot(reader, expected)).toEqual({ state: 'unavailable' })
  })
  it('refuses rollback before fetching bulk data', async () => {
    const { reader } = await fixture()
    expect(await readVaultSnapshot(reader, { ...expected, minSequence: 3 })).toEqual({ state: 'unusable', reason: 'rollback' })
    expect(reader.chunk).not.toHaveBeenCalled()
  })
  it('never decrypts a chunk with a changed signed event', async () => {
    const { reader, chunk } = await fixture()
    reader.chunk.mockResolvedValue({ ...chunk, content: 'evil' })
    expect(await readVaultSnapshot(reader, expected)).toEqual({ state: 'unusable', reason: 'chunk' })
    expect(reader.open).toHaveBeenCalledTimes(1)
  })
  it('refuses a plausible decrypt with the wrong complete revision', async () => {
    const { reader, manifest } = await fixture()
    reader.open.mockImplementation(async c => c === 'control' ? JSON.stringify(manifest) : 'wrong')
    expect(await readVaultSnapshot(reader, expected)).toEqual({ state: 'unusable', reason: 'revision' })
  })
  it('rejects an invalid control signature before contacting the signer', async () => {
    const { reader, checkpoint } = await fixture()
    reader.checkpoints.mockResolvedValue([{ ...checkpoint, sig: '00'.repeat(64) }])
    expect(await readVaultSnapshot(reader, expected)).toEqual({ state: 'unusable', reason: 'checkpoint' })
    expect(reader.open).not.toHaveBeenCalled()
  })
})

it('never falls back to legacy when an authenticated rotation target is absent', async () => {
  const { reader, manifest } = await fixture()
  reader.open.mockImplementation(async c => c === 'control' ? JSON.stringify({ ...manifest, nextRotation: 1 }) : 'data')
  const resolve = vi.fn(async (rotation: number) => ({ author, reader: rotation === 0 ? reader : {
    ...reader, checkpoints: async () => [],
  } }))
  expect(await readVaultRotations(resolve, expected.purpose)).toEqual({ state: 'unusable', reason: 'checkpoint' })
  expect(resolve.mock.calls.map(c => c[0])).toEqual([0, 1])
})

async function retirement(effectiveSequence = 2, vault = author, signer = sk, retiredDevice = device) {
  const authority = bytesToHex(schnorr.getPublicKey(hexToBytes(signer)))
  return { authority, now: 110, events: [await signEvent(buildVaultDeviceRevocation({ authority, vault, device: retiredDevice, effectiveSequence, issuedAt: 110 }), signer)] }
}

it.each([1, 2, 3])('applies only signed, scoped retirement at cutoff %s', async effectiveSequence => {
  const { reader } = await fixture()
  const result = await readVaultHeads(reader, { ...expected, retirement: await retirement(effectiveSequence) })
  expect(result.state).toBe(effectiveSequence <= 2 ? 'unusable' : 'ready')
  if (effectiveSequence <= 2) expect(reader.chunk).not.toHaveBeenCalled()
})

it('does not cross-retire a device from another vault or authority', async () => {
  const { reader } = await fixture()
  const otherVault = await retirement(1, '3'.repeat(64))
  const wrongAuthority = { ...await retirement(1, author, '03'.repeat(32)), authority: author }
  expect((await readVaultHeads(reader, { ...expected, retirement: otherVault })).state).toBe('ready')
  expect((await readVaultHeads(reader, { ...expected, retirement: wrongAuthority })).state).toBe('ready')
})

it('refuses malformed evidence and the old unscoped API before decrypting or allowing absence fallback', async () => {
  const { reader } = await fixture()
  const proof = await retirement()
  const unvalidated = readVaultDeviceRevocation(proof.events[0]) as unknown as NostrEvent
  for (const evidence of [unvalidated, { ...proof.events[0], sig: '0'.repeat(128) }]) {
    expect(await readVaultHeads(reader, { ...expected, retirement: { ...proof, events: [evidence] } })).toEqual({ state: 'unusable', reason: 'retirement' })
  }
  const oldOptions = { ...expected, revokedDevices: [unvalidated] }
  expect(await readVaultHeads(reader, oldOptions)).toEqual({ state: 'unusable', reason: 'retirement' })
  reader.checkpoints.mockResolvedValue([])
  expect(await readVaultHeads(reader, { ...expected, retirement: { ...proof, authority: undefined! } })).toEqual({ state: 'unusable', reason: 'retirement' })
  expect(reader.checkpoints).not.toHaveBeenCalled()
  expect(reader.open).not.toHaveBeenCalled()
})

it('preserves pre-retirement reader behaviour when enforcement is not requested', async () => {
  const { reader } = await fixture()
  expect((await readVaultHeads(reader, expected)).state).toBe('ready')
  expect((await readVaultSnapshot(reader, expected)).state).toBe('ready')
  expect((await readVaultHeads(reader, { ...expected, retirement: await retirement() })).state).toBe('unusable')
})

it('fails closed on a partially retired legacy checkpoint, even if its live signer wrote the chunks', async () => {
  const { reader, manifest } = await fixture()
  const retiredDevice = '4'.repeat(64)
  reader.open.mockImplementation(async c => c === 'control' ? JSON.stringify({ ...manifest, devicePubkeys: [device, retiredDevice] }) : 'data')
  expect((await readVaultHeads(reader, { ...expected, retirement: await retirement(2, author, sk, retiredDevice) })).state).toBe('unusable')
  expect(reader.chunk).not.toHaveBeenCalled()
})

it('retains a live publisher head while rejecting a retired publisher', async () => {
  const { reader, manifest, checkpoint } = await fixture()
  const liveDevice = '4'.repeat(64)
  const live = await signEvent({ ...checkpoint, tags: [['d', vaultCheckpointTag(author, liveDevice)]], content: 'live' }, sk)
  // The live head uses an independent, non-retired chunk signer.
  const liveSk = '04'.repeat(32), liveSigner = bytesToHex(schnorr.getPublicKey(hexToBytes(liveSk)))
  const chunk = await signEvent({ kind: 30078, pubkey: liveSigner, created_at: 100, tags: [['d', 'live-chunk']], content: 'body' }, liveSk)
  reader.checkpoints.mockResolvedValue([checkpoint, live])
  reader.chunk.mockResolvedValue(chunk)
  reader.open.mockImplementation(async c => c === 'control' ? JSON.stringify(manifest) : c === 'live' ? JSON.stringify({ ...manifest,
    publisher: liveDevice, devicePubkeys: [liveDevice, liveSigner], chunks: [{ eventId: chunk.id, author: liveSigner, contentHash: vaultContentHash('body'), contentBytes: 4 }] }) : 'data')
  const result = await readVaultHeads(reader, { ...expected, retirement: await retirement() })
  expect(result.state).toBe('ready')
  if (result.state === 'ready') expect(result.snapshots.map(s => s.checkpoint.publisher)).toEqual([liveDevice])
})

it('carries mandatory authority and rotation-specific vault scope through forward recovery', async () => {
  const { reader, manifest } = await fixture()
  reader.open.mockImplementation(async c => c === 'control' ? JSON.stringify({ ...manifest, nextRotation: 1 }) : 'data')
  const proof = await retirement(3)
  const resolve = vi.fn(async (rotation: number) => ({ author, reader, ...(rotation === 0 ? { retirement: proof } : {}) }))
  expect(await readVaultHeadRotations(resolve, expected.purpose)).toEqual({ state: 'unusable', reason: 'retirement' })
  expect(resolve.mock.calls.map(c => c[0])).toEqual([0, 1])
  const changedAuthority = { ...proof, authority: '3'.repeat(64) }
  expect(await readVaultHeadRotations(async rotation => ({ author, reader, retirement: rotation === 0 ? proof : changedAuthority }), expected.purpose))
    .toEqual({ state: 'unusable', reason: 'retirement' })
})

it('scopes retirement independently to each authenticated rotation vault', async () => {
  const { reader, manifest, checkpoint } = await fixture()
  reader.open.mockImplementation(async c => c === 'control' ? JSON.stringify({ ...manifest, nextRotation: 1 }) : 'data')
  const nextSk = '03'.repeat(32), nextAuthor = bytesToHex(schnorr.getPublicKey(hexToBytes(nextSk)))
  const nextCheckpoint = await signEvent({ ...checkpoint, pubkey: nextAuthor, tags: [['d', vaultCheckpointTag(nextAuthor)]] }, nextSk)
  const nextReader = { ...reader, checkpoints: async () => [nextCheckpoint],
    open: async (c: string) => c === 'control' ? JSON.stringify({ ...manifest, rotation: 1 }) : 'data' }
  // A retirement for the next vault cannot reject the earlier vault's head.
  const proof = await retirement(2, nextAuthor)
  const resolve = vi.fn(async (rotation: number) => ({ author: rotation === 0 ? author : nextAuthor,
    reader: rotation === 0 ? reader : nextReader, retirement: proof }))
  expect(await readVaultHeadRotations(resolve, expected.purpose)).toEqual({ state: 'unusable', reason: 'checkpoint' })
  expect(resolve.mock.calls.map(c => c[0])).toEqual([0, 1])
  expect((await readVaultHeadRotations(async rotation => ({ author: rotation === 0 ? author : nextAuthor,
    reader: rotation === 0 ? reader : nextReader, retirement: { ...proof, events: [] } }), expected.purpose)).state).toBe('ready')
})
