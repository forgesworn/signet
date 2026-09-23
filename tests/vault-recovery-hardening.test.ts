import { describe, expect, it, vi } from 'vitest'
import { generateKeyPair, signEvent } from '../src/crypto.js'
import { readVaultSnapshot, readVaultHeads, readVaultHeadRotations, readVaultRotations, VAULT_CLOCK_TOLERANCE_SECONDS } from '../src/vault-recovery.js'
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

describe('rotation is a revocation boundary: superseded rotations are never read', () => {
  async function rotated() {
    const r0 = new Rotation(0), r1 = new Rotation(1), r2 = new Rotation(2), a = generateKeyPair(), attacker = generateKeyPair()
    await r0.head({ device: a, created_at: 100, sequence: 4, nextRotation: 1 })
    await r1.head({ device: a, created_at: 150, sequence: 1 })
    const rotations = [r0, r1, r2]
    const resolve = vi.fn(async (rotation: number) => {
      const r = rotations[rotation] ?? new Rotation(rotation)
      return { author: r.author, reader: r.reader() }
    })
    return { r0, r1, r2, a, attacker, resolve }
  }
  const onlyRotation1 = (result: Awaited<ReturnType<typeof readVaultHeadRotations>>, a: Key) => {
    expect(result.state).toBe('ready')
    if (result.state === 'ready') expect(result.snapshots.map(s => [s.checkpoint.rotation, s.checkpoint.publisher])).toEqual([[1, a.publicKey]])
  }
  it('does not merge any old-rotation head once the next rotation exists', async () => {
    const { r0, a, attacker, resolve } = await rotated()
    await r0.head({ device: attacker, created_at: 200 })
    onlyRotation1(await readVaultHeadRotations(resolve, purpose, NOW), a)
    expect(resolve.mock.calls.map(c => c[0])).toEqual([0, 1, 2])
  })
  it('ignores 17 fresh-tag old-key heads after the pointer (no cap on a superseded rotation)', async () => {
    const { r0, a, resolve } = await rotated()
    for (let i = 0; i < 17; i++) await r0.head({ device: generateKeyPair(), created_at: 200 + i, raw: 'undecryptable' })
    const reader0 = r0.reader()
    resolve.mockImplementationOnce(async () => ({ author: r0.author, reader: reader0 }))
    onlyRotation1(await readVaultHeadRotations(resolve, purpose, NOW), a)
    expect(reader0.open).not.toHaveBeenCalled()
  })
  it('ignores a garbage head backdated before the pointer', async () => {
    const { r0, a, resolve } = await rotated()
    await r0.head({ device: generateKeyPair(), created_at: 50, raw: 'garbage' })
    onlyRotation1(await readVaultHeadRotations(resolve, purpose, NOW), a)
  })
  it('ignores more than 128 junk d-tag events under the old key', async () => {
    const { r0, a, resolve } = await rotated()
    for (let i = 0; i < 130; i++) {
      r0.heads.push(await signEvent({ kind: 30078, pubkey: r0.author, created_at: 200 + i, tags: [['d', `junk-${i}`]], content: 'x' }, r0.vault.privateKey))
    }
    onlyRotation1(await readVaultHeadRotations(resolve, purpose, NOW), a)
  })
  it('never merges a backdated head injected under an honest publisher tag, whatever its sequence', async () => {
    const { r0, a, resolve } = await rotated()
    const honest = generateKeyPair()
    await r0.head({ device: honest, created_at: 60, sequence: 2 })
    await r0.head({ device: honest, created_at: 90, sequence: 1_000_000 }) // retired key, between honest head and pointer
    onlyRotation1(await readVaultHeadRotations(resolve, purpose, NOW), a)
    // Read on its own, the same rotation would merge the injected head: that is what the boundary prevents.
    const alone = await readVaultHeads(r0.reader(), r0.expected())
    expect(alone.state === 'ready' && alone.snapshots.some(s => s.checkpoint.sequence === 1_000_000)).toBe(true)
  })
  it('follows the successor even when the old key overwrote the pointer head', async () => {
    const { r0, a, resolve } = await rotated()
    r0.heads.length = 0 // relays kept only the newer replaceable event under the pointer's tag
    await r0.head({ device: a, created_at: 200, sequence: 99 })
    onlyRotation1(await readVaultHeadRotations(resolve, purpose, NOW), a)
  })
  it('fails closed when the newest rotation is itself invalid or points to an absent rotation', async () => {
    const { r1, resolve } = await rotated()
    await r1.head({ device: generateKeyPair(), created_at: 160, raw: 'junk' })
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unusable', reason: 'checkpoint' })
    r1.heads.pop()
    await r1.head({ device: generateKeyPair(), created_at: 170, nextRotation: 2 })
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unusable', reason: 'checkpoint' })
  })
  it('refuses a far nextRotation rather than following it', async () => {
    const r0 = new Rotation(0)
    await r0.head({ device: generateKeyPair(), created_at: 100, nextRotation: 4000 })
    const resolve = vi.fn(async (rotation: number) => { const r = rotation === 0 ? r0 : new Rotation(rotation); return { author: r.author, reader: r.reader() } })
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unusable', reason: 'checkpoint' })
    expect(resolve.mock.calls.map(c => c[0])).toEqual([0, 1])
  })
  it('reports unavailable with the failed relays when the successor cannot be probed', async () => {
    const { resolve, r1 } = await rotated()
    const failing: VaultReader = { ...r1.reader(), checkpoints: async () => { throw Object.assign(new Error('x'), { failedRelays: ['wss://dead.example'] }) } }
    resolve.mockImplementation(async (rotation: number) => rotation === 1 ? { author: r1.author, reader: failing } : { author: new Rotation().author, reader: new Rotation().reader() })
    expect(await readVaultHeadRotations(resolve, purpose, NOW)).toEqual({ state: 'unavailable', failedRelays: ['wss://dead.example'] })
  })
  it('the single-head reader applies the same boundary', async () => {
    const r0 = new Rotation(0), r1 = new Rotation(1), dev = generateKeyPair()
    await r0.head({ device: dev, created_at: 100, legacy: true, nextRotation: 1 })
    await r1.head({ device: dev, created_at: 150, legacy: true })
    r0.heads.length = 0
    await r0.head({ device: generateKeyPair(), created_at: 200, legacy: true, raw: 'retired key junk' })
    const resolve = vi.fn(async (rotation: number) => { const r = [r0, r1][rotation] ?? new Rotation(rotation); return { author: r.author, reader: r.reader() } })
    const result = await readVaultRotations(resolve, purpose, {}, NOW)
    expect(result.state === 'ready' && result.checkpoint.rotation).toBe(1)
  })
})

describe('cross-rotation rollback: withholding the successor cannot resurrect a superseded rotation', () => {
  /** Rotation 1 is never actually populated: this is what "every relay
   * withholds rotation 1" looks like from the walk's point of view. */
  function withheldSuccessor() {
    const r0 = new Rotation(0), a = generateKeyPair()
    const resolve = vi.fn(async (rotation: number) => {
      const r = rotation === 0 ? r0 : new Rotation(rotation)
      return { author: r.author, reader: r.reader() }
    })
    return { r0, a, resolve }
  }
  it('readVaultRotations refuses rotation 0 when the caller already holds a floor for rotation 1', async () => {
    const { r0, a, resolve } = withheldSuccessor()
    await r0.head({ device: a, created_at: 100, sequence: 5, legacy: true })
    expect(await readVaultRotations(resolve, purpose, { 1: 1 }, NOW)).toEqual({ state: 'unusable', reason: 'rollback' })
  })
  it('readVaultHeadRotations refuses the same walk when minRotation is 1', async () => {
    const { r0, a, resolve } = withheldSuccessor()
    await r0.head({ device: a, created_at: 100, sequence: 5, legacy: true })
    expect(await readVaultHeadRotations(resolve, purpose, NOW, 1)).toEqual({ state: 'unusable', reason: 'rollback' })
  })
  it('minRotation 0 or no floors leaves rotation 0 readable, unchanged', async () => {
    const { r0, a, resolve } = withheldSuccessor()
    await r0.head({ device: a, created_at: 100, sequence: 5, legacy: true })
    expect((await readVaultHeadRotations(resolve, purpose, NOW)).state).toBe('ready')
    expect((await readVaultHeadRotations(resolve, purpose, NOW, 0)).state).toBe('ready')
    expect((await readVaultRotations(resolve, purpose, {}, NOW)).state).toBe('ready')
  })
  it('a floor or minRotation equal to the found rotation still reads ready', async () => {
    const { r0, a, resolve } = withheldSuccessor()
    await r0.head({ device: a, created_at: 100, sequence: 5, legacy: true })
    expect((await readVaultHeadRotations(resolve, purpose, NOW, 0)).state).toBe('ready')
    expect((await readVaultRotations(resolve, purpose, { 0: 5 }, NOW)).state).toBe('ready')
  })
  it('rejects a non-integer or negative minRotation the same way checkNow rejects a bad clock', async () => {
    const { resolve } = withheldSuccessor()
    await expect(readVaultHeadRotations(resolve, purpose, NOW, -1)).rejects.toThrow(/minRotation/)
    await expect(readVaultHeadRotations(resolve, purpose, NOW, 1.5)).rejects.toThrow(/minRotation/)
  })
  it('reads ready when the found rotation exactly equals the highest already seen', async () => {
    const r1 = new Rotation(1), a = generateKeyPair()
    await r1.head({ device: a, created_at: 100, sequence: 5, legacy: true })
    const resolve = vi.fn(async (rotation: number) => {
      const r = rotation === 1 ? r1 : new Rotation(rotation)
      return { author: r.author, reader: r.reader() }
    })
    expect((await readVaultHeadRotations(resolve, purpose, NOW, 1)).state).toBe('ready')
    expect((await readVaultRotations(resolve, purpose, { 1: 5 }, NOW)).state).toBe('ready')
  })
  it('refuses a two-hop walk that lands below a minRotation of 2', async () => {
    const r0 = new Rotation(0), r1 = new Rotation(1), a = generateKeyPair()
    await r0.head({ device: a, created_at: 100, sequence: 4, nextRotation: 1, legacy: true })
    await r1.head({ device: a, created_at: 150, sequence: 1, legacy: true })
    const resolve = vi.fn(async (rotation: number) => {
      const r = [r0, r1][rotation] ?? new Rotation(rotation)
      return { author: r.author, reader: r.reader() }
    })
    expect(await readVaultHeadRotations(resolve, purpose, NOW, 2)).toEqual({ state: 'unusable', reason: 'rollback' })
    expect(await readVaultRotations(resolve, purpose, { 2: 1 }, NOW)).toEqual({ state: 'unusable', reason: 'rollback' })
  })
})
