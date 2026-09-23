import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NostrEvent } from '../src/types.js'
import type { NostrFilter } from '../src/relay.js'

type Behaviour = { connect?: 'fail'; eose?: boolean; events?: NostrEvent[] }
const behaviours = new Map<string, Behaviour>()
const constructed: string[] = []

vi.mock('../src/relay.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/relay.js')>()
  class FakeRelayClient {
    constructor(private url: string) { constructed.push(url); new actual.RelayClient(url) }
    async connect() { if (behaviours.get(this.url)?.connect === 'fail') throw new Error('offline') }
    disconnect() {}
    closeSubscription() {}
    subscribe(_f: NostrFilter[], onEvent: (e: NostrEvent) => void, onEose?: () => void) {
      const b = behaviours.get(this.url) ?? {}
      queueMicrotask(() => { for (const e of b.events ?? []) onEvent(e); if (b.eose !== false) onEose?.() })
      return 'sub'
    }
  }
  return { ...actual, RelayClient: FakeRelayClient }
})

const { createVaultRelayReader, fetchVaultEvents, MAX_VAULT_EVENTS_PER_RELAY, VaultRelayError } = await import('../src/vault-relay.js')
const { RelayClient: RealRelayClient } = await vi.importActual<typeof import('../src/relay.js')>('../src/relay.js')

const author = 'a'.repeat(64)
const TAG = 'f'.repeat(32)
const ev = (n: number, patch: Partial<NostrEvent> = {}): NostrEvent => ({
  id: n.toString(16).padStart(64, '0'), pubkey: author, kind: 30078, created_at: 100 + n,
  tags: [['d', TAG]], content: 'c', sig: '0'.repeat(128), ...patch,
})
const open = async () => null
const A = 'wss://a.example', B = 'wss://b.example', C = 'wss://c.example'

beforeEach(() => { behaviours.clear(); constructed.length = 0 })

describe('vault relay reader: absence needs every relay to answer', () => {
  it('reports empty only when every relay answered with EOSE', async () => {
    behaviours.set(A, {}); behaviours.set(B, {})
    await expect(createVaultRelayReader([A, B], open).checkpoints(author, TAG)).resolves.toEqual([])
  })
  it('throws when one relay answers empty while another fails to connect', async () => {
    behaviours.set(A, {}); behaviours.set(B, { connect: 'fail' })
    await expect(createVaultRelayReader([A, B], open).checkpoints(author, TAG)).rejects.toThrow()
  })
  it('throws when one relay answers empty while another never sends EOSE', async () => {
    vi.useFakeTimers()
    try {
      behaviours.set(A, {}); behaviours.set(B, { eose: false })
      const pending = createVaultRelayReader([A, B], open).checkpoints(author, TAG)
      const assertion = expect(pending).rejects.toThrow()
      await vi.advanceTimersByTimeAsync(10001)
      await assertion
    } finally { vi.useRealTimers() }
  })
  it('throws when no relay is reachable or none is valid', async () => {
    behaviours.set(A, { connect: 'fail' })
    await expect(createVaultRelayReader([A], open).checkpoints(author)).rejects.toThrow()
    await expect(createVaultRelayReader(['http://x.example', 'ws://evil.example'], open).checkpoints(author)).rejects.toThrow()
  })
  it('a non-empty checkpoint answer also needs every relay, and names the ones that failed', async () => {
    behaviours.set(A, { events: [ev(1)] }); behaviours.set(B, { connect: 'fail' }); behaviours.set(C, { connect: 'fail' })
    const error = await createVaultRelayReader([A, B, C], open).checkpoints(author, TAG).catch(e => e)
    expect(error).toBeInstanceOf(VaultRelayError)
    expect(error.failedRelays).toEqual([B, C])
  })
  it('merges and de-duplicates across relays', async () => {
    behaviours.set(A, { events: [ev(1), ev(2)] }); behaviours.set(B, { events: [ev(2), ev(3)] })
    const found = await createVaultRelayReader([A, B], open).checkpoints(author, TAG)
    expect(found.map(e => e.created_at).sort()).toEqual([101, 102, 103])
  })
  it('chunk lookup: not found needs every relay; found needs any one', async () => {
    behaviours.set(A, {}); behaviours.set(B, { connect: 'fail' })
    await expect(createVaultRelayReader([A, B], open).chunk(ev(1).id)).rejects.toThrow()
    behaviours.set(A, { connect: 'fail' }); behaviours.set(B, { events: [ev(1, { pubkey: 'b'.repeat(64) })] })
    await expect(createVaultRelayReader([A, B], open).chunk(ev(1).id)).resolves.toMatchObject({ id: ev(1).id })
  })
})

describe('vault relay reader: hostile relays', () => {
  it('drops events without a checkpoint-shaped d-tag before the cap', async () => {
    const junk = Array.from({ length: 300 }, (_, i) => ev(20000 + i, { tags: [['d', `junk-${i}`]] }))
    behaviours.set(A, { events: [...junk, ev(1)] })
    await expect(createVaultRelayReader([A], open).checkpoints(author)).resolves.toEqual([ev(1)])
  })
  it('filters before capping, so unrelated events cannot crowd out honest ones', async () => {
    const junk = Array.from({ length: 500 }, (_, i) => ev(1000 + i, { pubkey: 'e'.repeat(64) }))
    const wrongKind = Array.from({ length: 200 }, (_, i) => ev(5000 + i, { kind: 1 }))
    const wrongTag = Array.from({ length: 200 }, (_, i) => ev(9000 + i, { tags: [['d', 'e'.repeat(32)]] }))
    behaviours.set(A, { events: [...junk, ...wrongKind, ...wrongTag, ev(1)] })
    await expect(createVaultRelayReader([A], open).checkpoints(author, TAG)).resolves.toEqual([ev(1)])
  })
  it('caps each relay separately: a relay over the cap is named as failed', async () => {
    const flood = Array.from({ length: MAX_VAULT_EVENTS_PER_RELAY + 1 }, (_, i) => ev(100 + i))
    behaviours.set(A, { events: flood }); behaviours.set(B, { events: [ev(1)] })
    const error = await createVaultRelayReader([A, B], open).checkpoints(author, TAG).catch(e => e)
    expect(error.failedRelays).toEqual([A])
    behaviours.set(A, { events: flood.slice(0, MAX_VAULT_EVENTS_PER_RELAY) })
    await expect(createVaultRelayReader([A, B], open).checkpoints(author, TAG)).resolves.toHaveLength(MAX_VAULT_EVENTS_PER_RELAY + 1)
  })
  it('does not count a repeated event twice towards the cap', async () => {
    const relay = { closeSubscription: vi.fn(), subscribe: (_f: NostrFilter[], onEvent: (e: NostrEvent) => void, onEose?: () => void) => {
      for (let i = 0; i < MAX_VAULT_EVENTS_PER_RELAY + 10; i++) onEvent(ev(1)); onEose?.(); return 's' } }
    await expect(fetchVaultEvents(relay, { kinds: [30078], authors: [author] })).resolves.toEqual([ev(1)])
  })
})

describe('vault relay URL policy agrees with RelayClient', () => {
  it('queries exactly the URLs RelayClient accepts (ws://[::1] is rejected by both)', async () => {
    const candidates = ['wss://ok.example', 'ws://localhost:7777', 'ws://127.0.0.1', 'ws://[::1]:7777', 'ws://[::1]',
      'ws://evil.example', 'http://x.example', 'wss://user:pw@x.example', 'wss://x.example/#frag']
    const hostAccepts = (u: string) => { try { new RealRelayClient(u); return true } catch { return false } }
    await createVaultRelayReader(candidates, open).checkpoints(author).catch(() => undefined)
    for (const u of constructed) expect(hostAccepts(u), u).toBe(true)
    expect(constructed).not.toContain('ws://[::1]:7777')
    expect(constructed).not.toContain('ws://[::1]')
    expect(constructed).toEqual(expect.arrayContaining(['wss://ok.example', 'ws://localhost:7777', 'ws://127.0.0.1']))
  })
})
