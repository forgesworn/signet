import { describe, expect, it, vi } from 'vitest'
import { schnorr } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { signEvent } from '../src/crypto.js'
import { readVaultSnapshot, readVaultRotations, readVaultHeads } from '../src/vault-recovery.js'
import { vaultCheckpointTag, vaultContentHash } from '../src/vault-checkpoint.js'
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

it('excludes a retired device head when a verified revocation floor is supplied', async () => {
  const { reader, checkpoint } = await fixture()
  const revocation = { v: 1 as const, vault: author, device, effectiveSequence: 1, issuedAt: 110, authority: author, eventId: 'a'.repeat(64) }
  const result = await readVaultHeads(reader, { ...expected, revokedDevices: [revocation] })
  expect(result).toEqual({ state: 'unusable', reason: 'checkpoint' })
  expect(checkpoint).toBeDefined()
})
