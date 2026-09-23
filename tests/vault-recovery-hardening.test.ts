import { describe, expect, it, vi } from 'vitest'
import { generateKeyPair, signEvent } from '../src/crypto.js'
import { readVaultSnapshot, readVaultHeads, readVaultHeadRotations, VAULT_CLOCK_TOLERANCE_SECONDS } from '../src/vault-recovery.js'
import type { VaultReader } from '../src/vault-recovery.js'
import { vaultCheckpointTag, vaultContentHash } from '../src/vault-checkpoint.js'
import type { NostrEvent } from '../src/types.js'

const purpose = 'signet:vault:profiles'
const NOW = 1_000_000
type Key = ReturnType<typeof generateKeyPair>
interface HeadOpts {
  device: Key; created_at: number; sequence?: number; nextRotation?: number
  tag?: string; raw?: string; legacy?: boolean
}

/** One rotation's relay view: the vault key's heads plus device-signed chunks. */
class Rotation {
  readonly vault = generateKeyPair()
  readonly heads: NostrEvent[] = []
  readonly chunks = new Map<string, NostrEvent>()
  readonly opens = new Map<string, string>()
  private n = 0
  constructor(readonly rotation = 0) {}
  get author() { return this.vault.publicKey }
  reader(): VaultReader & { open: ReturnType<typeof vi.fn> } {
    return {
      checkpoints: async () => [...this.heads],
      chunk: async id => this.chunks.get(id) ?? null,
      open: vi.fn(async (c: string) => this.opens.get(c) ?? null),
    }
  }
  async head(o: HeadOpts): Promise<NostrEvent> {
    const i = this.n++
    const plaintext = `data-${this.rotation}-${i}`, body = `chunk-${this.rotation}-${i}`
    this.opens.set(body, plaintext)
    const chunk = await signEvent({ kind: 30078, pubkey: o.device.publicKey, created_at: o.created_at,
      tags: [['d', `c${i}`]], content: body }, o.device.privateKey)
    this.chunks.set(chunk.id, chunk)
    const publisher = o.legacy ? undefined : o.device.publicKey
    const manifest = { v: 1, purpose, rotation: this.rotation, sequence: o.sequence ?? 1, revision: vaultContentHash(plaintext),
      ...(publisher ? { publisher } : {}), devicePubkeys: [o.device.publicKey],
      chunks: [{ eventId: chunk.id, author: o.device.publicKey, contentHash: vaultContentHash(body), contentBytes: body.length }],
      ...(o.nextRotation === undefined ? {} : { nextRotation: o.nextRotation }) }
    const control = `control-${this.rotation}-${i}`
    this.opens.set(control, o.raw ?? JSON.stringify(manifest))
    const event = await signEvent({ kind: 30078, pubkey: this.author, created_at: o.created_at,
      tags: [['d', o.tag ?? vaultCheckpointTag(this.author, publisher)]], content: control }, this.vault.privateKey)
    this.heads.push(event)
    return event
  }
  expected(extra: object = {}) { return { author: this.author, purpose, rotation: this.rotation, now: NOW, ...extra } }
}
const publishers = (r: { state: string; snapshots?: { checkpoint: { publisher?: string } }[] }) =>
  r.state === 'ready' ? r.snapshots!.map(s => s.checkpoint.publisher ?? 'legacy').sort() : r

describe('readVaultHeads sequence floors', () => {
  it('applies a per-publisher floor and treats a floored publisher that is missing as rollback', async () => {
    const r = new Rotation(), a = generateKeyPair(), b = generateKeyPair()
    await r.head({ device: a, created_at: 100, sequence: 3 })
    await r.head({ device: b, created_at: 100, sequence: 7 })
    expect((await readVaultHeads(r.reader(), r.expected({ sequenceFloors: { [a.publicKey]: 3, [b.publicKey]: 7 } }))).state).toBe('ready')
    expect(await readVaultHeads(r.reader(), r.expected({ sequenceFloors: { [a.publicKey]: 4 } })))
      .toEqual({ state: 'unusable', reason: 'rollback' })
    const missing = generateKeyPair().publicKey
    expect(await readVaultHeads(r.reader(), r.expected({ sequenceFloors: { [missing]: 1 } })))
      .toEqual({ state: 'unusable', reason: 'rollback' })
    expect((await readVaultHeads(r.reader(), r.expected({ sequenceFloors: { [missing]: 0 } }))).state).toBe('ready')
  })
  it('keys the legacy (publisher-less) head as "legacy"', async () => {
    const r = new Rotation()
    await r.head({ device: generateKeyPair(), created_at: 100, sequence: 2, legacy: true })
    expect(await readVaultHeads(r.reader(), r.expected({ sequenceFloors: { legacy: 3 } })))
      .toEqual({ state: 'unusable', reason: 'rollback' })
  })
})

describe('readVaultHeads bounds and binding', () => {
  it('fails closed above 16 heads before decrypting anything, and accepts exactly 16', async () => {
    const r = new Rotation()
    for (let i = 0; i < 16; i++) await r.head({ device: generateKeyPair(), created_at: 100 + i })
    expect(publishers(await readVaultHeads(r.reader(), r.expected()))).toHaveLength(16)
    await r.head({ device: generateKeyPair(), created_at: 200 })
    const reader = r.reader()
    expect(await readVaultHeads(reader, r.expected())).toEqual({ state: 'unusable', reason: 'checkpoint' })
    expect(reader.open).not.toHaveBeenCalled()
  })
  it('rejects a head whose d-tag is not the tag of the publisher it names', async () => {
    const r = new Rotation(), a = generateKeyPair(), b = generateKeyPair()
    await r.head({ device: a, created_at: 100, tag: vaultCheckpointTag(r.author, b.publicKey) })
    expect(await readVaultHeads(r.reader(), r.expected())).toEqual({ state: 'unusable', reason: 'checkpoint' })
  })
  it('breaks an equal-timestamp tie on the same tag by the lower event ID', async () => {
    const r = new Rotation(), a = generateKeyPair()
    const x = await r.head({ device: a, created_at: 100, sequence: 1 })
    const y = await r.head({ device: a, created_at: 100, sequence: 2 })
    const winner = x.id < y.id ? x : y
    const heads = await readVaultHeads(r.reader(), r.expected())
    expect(heads.state === 'ready' && heads.snapshots.map(s => s.event.id)).toEqual([winner.id])
    r.heads.reverse()
    const again = await readVaultHeads(r.reader(), r.expected())
    expect(again.state === 'ready' && again.snapshots.map(s => s.event.id)).toEqual([winner.id])
    const single = await readVaultSnapshot(r.reader(), r.expected({ publisher: a.publicKey }))
    expect(single.state === 'ready' && single.event.id).toBe(winner.id)
  })
})

describe('created_at upper bound', () => {
  it('rejects a head beyond now + tolerance so a bad clock cannot outrank later honest heads', async () => {
    const r = new Rotation(), a = generateKeyPair()
    const honest = await r.head({ device: a, created_at: NOW - 50, sequence: 5 })
    await r.head({ device: a, created_at: 4_070_908_800, sequence: 1 }) // 2099
    const heads = await readVaultHeads(r.reader(), r.expected())
    expect(heads.state === 'ready' && heads.snapshots.map(s => s.event.id)).toEqual([honest.id])
    const single = await readVaultSnapshot(r.reader(), r.expected({ publisher: a.publicKey }))
    expect(single.state === 'ready' && single.event.id).toBe(honest.id)
  })
  it('accepts exactly now + tolerance and takes now as a parameter', async () => {
    const r = new Rotation(), a = generateKeyPair()
    await r.head({ device: a, created_at: NOW + VAULT_CLOCK_TOLERANCE_SECONDS })
    expect((await readVaultHeads(r.reader(), r.expected())).state).toBe('ready')
    expect(await readVaultHeads(r.reader(), r.expected({ now: NOW - 1 }))).toEqual({ state: 'unusable', reason: 'checkpoint' })
    expect(await readVaultSnapshot(r.reader(), r.expected({ publisher: a.publicKey, now: NOW - 1 })))
      .toEqual({ state: 'unusable', reason: 'checkpoint' })
    await expect(readVaultHeads(r.reader(), r.expected({ now: -1 }))).rejects.toThrow()
  })
})

describe('checkpoint d-tag filter', () => {
  it('ignores other kind-30078 events by the vault key, however many', async () => {
    const r = new Rotation(), a = generateKeyPair()
    await r.head({ device: a, created_at: 100 })
    for (let i = 0; i < 20; i++) {
      r.heads.push(await signEvent({ kind: 30078, pubkey: r.author, created_at: 100 + i, tags: [['d', `app-setting-${i}`]], content: 'x' }, r.vault.privateKey))
    }
    expect(publishers(await readVaultHeads(r.reader(), r.expected()))).toEqual([a.publicKey])
  })
  it('reads only non-checkpoint events as absent', async () => {
    const r = new Rotation()
    r.heads.push(await signEvent({ kind: 30078, pubkey: r.author, created_at: 100, tags: [['d', 'settings']], content: 'x' }, r.vault.privateKey))
    expect(await readVaultHeads(r.reader(), r.expected())).toEqual({ state: 'absent' })
  })
})

describe('rotation is a revocation boundary', () => {
  async function rotated() {
    const r0 = new Rotation(0), r1 = new Rotation(1), a = generateKeyPair(), attacker = generateKeyPair()
    const pointer = await r0.head({ device: a, created_at: 100, sequence: 4, nextRotation: 1 })
    await r1.head({ device: a, created_at: 150, sequence: 1 })
    const resolve = vi.fn(async (rotation: number) => {
      const r = rotation === 0 ? r0 : rotation === 1 ? r1 : new Rotation(rotation)
      return { author: r.author, reader: r.reader() }
    })
    return { r0, r1, a, attacker, pointer, resolve }
  }
  it('sets aside old-key heads newer than the pointer instead of merging them', async () => {
    const { r0, a, attacker, resolve } = await rotated()
    await r0.head({ device: attacker, created_at: 200 })
    expect(publishers(await readVaultHeads(r0.reader(), r0.expected()))).toEqual([a.publicKey, attacker.publicKey].sort())
    const result = await readVaultHeadRotations(resolve, purpose, NOW)
    expect(result.state).toBe('ready')
    if (result.state === 'ready') {
      expect(result.snapshots.map(s => [s.checkpoint.rotation, s.checkpoint.publisher])).toEqual([[0, a.publicKey], [1, a.publicKey]])
    }
  })
  it('an old key cannot declare a far rotation or plant junk after the pointer', async () => {
    const { r0, a, attacker, resolve } = await rotated()
    await r0.head({ device: attacker, created_at: 200, nextRotation: 4000 })
    const junk = generateKeyPair()
    await r0.head({ device: junk, created_at: 300, raw: 'not a checkpoint' })
    const result = await readVaultHeadRotations(resolve, purpose, NOW)
    expect(result.state).toBe('ready')
    expect(resolve.mock.calls.map(c => c[0])).toEqual([0, 1])
    expect(publishers(result)).toEqual([a.publicKey, a.publicKey])
  })
  it('uses the earliest pointer, so a later pointer from the old key does not move the boundary', async () => {
    const { r0, a, attacker, resolve } = await rotated()
    await r0.head({ device: attacker, created_at: 200 })
    await r0.head({ device: generateKeyPair(), created_at: 250, nextRotation: 1 })
    expect(publishers(await readVaultHeadRotations(resolve, purpose, NOW))).toEqual([a.publicKey, a.publicKey])
  })
  it('does not treat a floored publisher set aside by the boundary as rollback', async () => {
    const { r0, r1, a, resolve } = await rotated()
    const late = generateKeyPair()
    await r0.head({ device: late, created_at: 200, sequence: 9 })
    resolve.mockImplementation(async (rotation: number) => rotation === 0
      ? { author: r0.author, reader: r0.reader(), sequenceFloors: { [late.publicKey]: 9, [a.publicKey]: 4 } }
      : { author: r1.author, reader: r1.reader() })
    expect((await readVaultHeadRotations(resolve, purpose, NOW)).state).toBe('ready')
  })
  it('still fails closed when junk predates the pointer, or the next rotation does not verify', async () => {
    const { r0, r1, resolve } = await rotated()
    await r0.head({ device: generateKeyPair(), created_at: 50, raw: 'junk' })
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unusable', reason: 'checkpoint' })
    r0.heads.pop(); r1.heads.length = 0
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unusable', reason: 'checkpoint' })
  })
  it('without a rotation, a far nextRotation is refused rather than followed', async () => {
    const r0 = new Rotation(0)
    await r0.head({ device: generateKeyPair(), created_at: 100, nextRotation: 4000 })
    const resolve = vi.fn(async () => ({ author: r0.author, reader: r0.reader() }))
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unusable', reason: 'checkpoint' })
    expect(resolve).toHaveBeenCalledTimes(1)
  })
})
