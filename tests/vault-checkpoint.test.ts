import { describe, expect, it } from 'vitest'
import { parseVaultCheckpoint, vaultContentHash, vaultCheckpointTag, matchesVaultChunk } from '../src/vault-checkpoint.js'
const expected = { purpose: 'signet:vault:contacts:owner', rotation: 0 }
const content = 'encrypted content'
const chunk = { eventId: 'a'.repeat(64), author: 'b'.repeat(64), contentHash: vaultContentHash(content), contentBytes: content.length }
const checkpoint = { v: 1, ...expected, sequence: 3, revision: 'c'.repeat(64), devicePubkeys: [chunk.author], chunks: [chunk] }
const parse = (v: unknown) => parseVaultCheckpoint(JSON.stringify(v), expected)

describe('vault checkpoint trust boundary', () => {
  it('accepts a complete checkpoint and strips unknown metadata', () => {
    expect(parse({ ...checkpoint, ignored: true })).toEqual(checkpoint)
  })
  it('rejects wrong dataset, rotation, malformed sequence and partial manifests', () => {
    for (const patch of [{ purpose: 'signet:vault:profiles' }, { rotation: 1 }, { sequence: -1 },
      { sequence: 1.5 }, { revision: '' }, { chunks: [] }, { devicePubkeys: [] },
      { devicePubkeys: [chunk.author, chunk.author] }, { chunks: [chunk, chunk] },
      { chunks: [{ ...chunk, author: 'd'.repeat(64) }] }, { chunks: [{ ...chunk, contentBytes: 100001 }] }]) {
      expect(parse({ ...checkpoint, ...patch })).toBeNull()
    }
  })
  it('bounds rotations forward and rejects oversized or malformed JSON', () => {
    expect(parse({ ...checkpoint, nextRotation: 1 })?.nextRotation).toBe(1)
    for (const nextRotation of [0, -1, 1.5, 2, 4000, 4294967296]) expect(parse({ ...checkpoint, nextRotation })).toBeNull()
    expect(parseVaultCheckpoint('{', expected)).toBeNull()
    expect(parse({ ...checkpoint, padding: 'x'.repeat(13000) })).toBeNull()
  })
  it('binds each chunk to its ID, author, kind, length and encrypted content', () => {
    const event = { id: chunk.eventId, pubkey: chunk.author, kind: 30078, content }
    expect(matchesVaultChunk(chunk, event)).toBe(true)
    for (const patch of [{ id: 'e'.repeat(64) }, { pubkey: 'e'.repeat(64) }, { kind: 1 }, { content: 'changed ciphertext' }]) {
      expect(matchesVaultChunk(chunk, { ...event, ...patch })).toBe(false)
    }
  })
  it('separates routing tags by vault author and rejects malformed keys', () => {
    expect(vaultCheckpointTag('a'.repeat(64))).toMatch(/^[a-f0-9]{32}$/)
    expect(vaultCheckpointTag('a'.repeat(64))).not.toBe(vaultCheckpointTag('b'.repeat(64)))
    expect(() => vaultCheckpointTag('')).toThrow()
  })
})
