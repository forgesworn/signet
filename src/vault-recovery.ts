import type { NostrEvent } from './types.js'
import { verifyEvent } from './crypto.js'
import { MAX_VAULT_CHUNKS, MAX_VAULT_CONTROL_BYTES, VAULT_EVENT_KIND,
  matchesVaultChunk, parseVaultCheckpoint, vaultCheckpointTag, vaultContentHash } from './vault-checkpoint.js'
import type { VaultCheckpoint } from './vault-checkpoint.js'

/** A checkpoint dated further than this beyond the reader's clock is rejected,
 * so one device with a bad clock cannot outrank every later honest head. */
export const VAULT_CLOCK_TOLERANCE_SECONDS = 300
/** Every checkpoint d-tag is `vaultCheckpointTag`: 32 lowercase hex characters. */
const CHECKPOINT_TAG = /^[0-9a-f]{32}$/
const MAX_VAULT_HEADS = 16
const encoder = new TextEncoder()
const nowSeconds = () => Math.floor(Date.now() / 1000)
type Ready = Extract<VaultReadResult, { state: 'ready' }>

function checkNow(now: number): number {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Vault reader clock must be a non-negative integer')
  return now
}

/** Ascending (created_at, id): the order used for every newest/tie decision.
 * Of two events with the same created_at, the lower ID is the newer head,
 * matching NIP-01 replaceable-event resolution. */
const older = (a: NostrEvent, b: NostrEvent) => a.created_at - b.created_at || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)

/** Structural, bound and signature checks shared by every checkpoint read. */
async function authenticCheckpointEvent(event: NostrEvent, author: string, now: number): Promise<string | null> {
  if (!event || event.kind !== VAULT_EVENT_KIND || event.pubkey !== author || typeof event.id !== 'string'
    || typeof event.content !== 'string' || encoder.encode(event.content).length > MAX_VAULT_CONTROL_BYTES
    || !Number.isSafeInteger(event.created_at) || event.created_at < 0
    || event.created_at > now + VAULT_CLOCK_TOLERANCE_SECONDS || !Array.isArray(event.tags)) return null
  const dTags = event.tags.filter(t => Array.isArray(t) && t[0] === 'd')
  if (dTags.length !== 1 || dTags[0].length !== 2 || typeof dTags[0][1] !== 'string') return null
  return await verifyEvent(event) ? dTags[0][1] : null
}

export type VaultReadResult =
  | { state: 'absent' }
  | { state: 'unavailable' }
  | { state: 'unusable'; reason: 'checkpoint' | 'rollback' | 'chunk' | 'revision' }
  | { state: 'ready'; plaintext: string; checkpoint: VaultCheckpoint; event: NostrEvent }

export interface VaultReader {
  /** Must distinguish an empty reachable query from relay failure (throw). */
  checkpoints(author: string, dTag?: string): Promise<NostrEvent[]>
  /** Exact ID query. Missing data is a failed restore, never an empty dataset. */
  chunk(eventId: string): Promise<NostrEvent | null>
  /** Open the v2 envelope only; sender is the vault key, not the chunk signer. */
  open(content: string, vaultAuthor: string): Promise<string | null>
}

/** Read one rotation. Callers may fall back to legacy ONLY on `absent`.
 * Invalid, incomplete, offline and rolled-back backups are distinguishable from
 * never-migrated accounts. No state is persisted or marked canonical here.
 * `now` (unix seconds, default the local clock) bounds created_at from above.
 */
export async function readVaultSnapshot(
  reader: VaultReader,
  expected: { author: string; purpose: string; rotation: number; minSequence?: number; publisher?: string; now?: number },
): Promise<VaultReadResult> {
  const now = checkNow(expected.now ?? nowSeconds())
  const tag = vaultCheckpointTag(expected.author, expected.publisher)
  let candidates: NostrEvent[]
  try { candidates = await reader.checkpoints(expected.author, tag) } catch { return { state: 'unavailable' } }
  if (!candidates.length) return { state: 'absent' }
  if (candidates.length > 128) return { state: 'unusable', reason: 'checkpoint' }
  // A corrupt newer event does not hide a valid older event. Once a valid signed
  // event is chosen, however, failed decrypt/schema is not a licence to downgrade.
  const valid: NostrEvent[] = []
  for (const event of candidates) {
    if (await authenticCheckpointEvent(event, expected.author, now) === tag) valid.push(event)
  }
  valid.sort((a, b) => older(b, a))
  const event = valid[0]
  if (!event) return { state: 'unusable', reason: 'checkpoint' }
  let raw: string | null
  try { raw = await reader.open(event.content, expected.author) } catch { return { state: 'unusable', reason: 'checkpoint' } }
  const checkpoint = raw === null ? null : parseVaultCheckpoint(raw, expected)
  if (!checkpoint || checkpoint.publisher !== expected.publisher) return { state: 'unusable', reason: 'checkpoint' }
  if (checkpoint.sequence < (expected.minSequence ?? 0)) return { state: 'unusable', reason: 'rollback' }
  const parts: string[] = []
  let totalBytes = 0
  for (const ref of checkpoint.chunks) {
    let chunk: NostrEvent | null
    try { chunk = await reader.chunk(ref.eventId) } catch { return { state: 'unavailable' } }
    if (!chunk || typeof chunk.content !== 'string' || !matchesVaultChunk(ref, chunk) || !await verifyEvent(chunk)) {
      return { state: 'unusable', reason: 'chunk' }
    }
    let part: string | null
    try { part = await reader.open(chunk.content, expected.author) } catch { return { state: 'unusable', reason: 'chunk' } }
    if (part === null) return { state: 'unusable', reason: 'chunk' }
    totalBytes += encoder.encode(part).length
    if (totalBytes > MAX_VAULT_CHUNKS * 65536) return { state: 'unusable', reason: 'chunk' }
    parts.push(part)
  }
  const plaintext = parts.join('')
  if (vaultContentHash(plaintext) !== checkpoint.revision) return { state: 'unusable', reason: 'revision' }
  return { state: 'ready', plaintext, checkpoint, event }
}

/** Follow authenticated forward pointers (always rotation + 1). Missing a
 * referenced rotation is damage, not a never-migrated account. Bound traversal
 * to prevent untrusted endless work.
 */
export async function readVaultRotations(
  resolve: (rotation: number) => Promise<{ reader: VaultReader; author: string }>,
  purpose: string,
  floors: Readonly<Record<number, number>> = {},
  now: number = nowSeconds(),
): Promise<VaultReadResult> {
  checkNow(now)
  let rotation = 0
  for (let hop = 0; hop < 32; hop++) {
    let context: Awaited<ReturnType<typeof resolve>>
    try { context = await resolve(rotation) } catch { return { state: 'unavailable' } }
    const result = await readVaultSnapshot(context.reader, {
      author: context.author, purpose, rotation, minSequence: floors[rotation], now,
    })
    if (result.state !== 'ready') {
      return rotation > 0 && result.state === 'absent' ? { state: 'unusable', reason: 'checkpoint' } : result
    }
    if (result.checkpoint.nextRotation === undefined) return result
    rotation = result.checkpoint.nextRotation
  }
  return { state: 'unusable', reason: 'checkpoint' }
}

export type VaultHeadsResult = Exclude<VaultReadResult, { state: 'ready' }>
  | { state: 'ready'; snapshots: Ready[] }

interface HeadsExpected {
  author: string; purpose: string; rotation: number; sequenceFloors?: Readonly<Record<string, number>>; now?: number
}
interface OpenedHead { tag: string; event: NostrEvent; raw: string | null; checkpoint: VaultCheckpoint | null }

/** Discover, authenticate and open (control only) the newest head per d-tag.
 * Events whose d-tag is not checkpoint-shaped are not checkpoints and are
 * ignored before any limit applies. */
async function openHeads(reader: VaultReader, expected: HeadsExpected, now: number):
  Promise<Exclude<VaultReadResult, { state: 'ready' }> | OpenedHead[]> {
  let events: NostrEvent[]
  try { events = await reader.checkpoints(expected.author) } catch { return { state: 'unavailable' } }
  if (events.length > 128) return { state: 'unusable', reason: 'checkpoint' }
  const shaped = events.filter(e => !!e && e.pubkey === expected.author && e.kind === VAULT_EVENT_KIND && Array.isArray(e.tags)
    && e.tags.some(t => Array.isArray(t) && t[0] === 'd' && typeof t[1] === 'string' && CHECKPOINT_TAG.test(t[1])))
  if (!shaped.length) return { state: 'absent' }
  const heads = new Map<string, NostrEvent>()
  for (const event of shaped) {
    const tag = await authenticCheckpointEvent(event, expected.author, now)
    if (tag === null || !CHECKPOINT_TAG.test(tag)) continue
    const previous = heads.get(tag)
    if (!previous || older(previous, event) < 0) heads.set(tag, event)
  }
  if (!heads.size || heads.size > MAX_VAULT_HEADS) return { state: 'unusable', reason: 'checkpoint' }
  const opened: OpenedHead[] = []
  for (const [tag, event] of heads) {
    let raw: string | null
    try { raw = await reader.open(event.content, expected.author) } catch { raw = null }
    const parsed = raw === null ? null : parseVaultCheckpoint(raw, expected)
    const checkpoint = parsed && tag === vaultCheckpointTag(expected.author, parsed.publisher) ? parsed : null
    opened.push({ tag, event, raw, checkpoint })
  }
  return opened
}

/** Full snapshot reads for the chosen heads, then the per-publisher floors.
 * `excused` publishers had an authenticated head that the rotation boundary set
 * aside; their floor is not evidence of rollback. */
async function readOpenedHeads(reader: VaultReader, expected: HeadsExpected, now: number, heads: OpenedHead[],
  excused: ReadonlySet<string> = new Set()): Promise<VaultHeadsResult> {
  const snapshots: Ready[] = []
  for (const { event, raw, checkpoint } of heads) {
    if (!checkpoint) return { state: 'unusable', reason: 'checkpoint' }
    const result = await readVaultSnapshot({ ...reader, checkpoints: async () => [event],
      open: (content, author) => content === event.content ? Promise.resolve(raw) : reader.open(content, author),
    }, { author: expected.author, purpose: expected.purpose, rotation: expected.rotation, now,
      publisher: checkpoint.publisher, minSequence: expected.sequenceFloors?.[checkpoint.publisher ?? 'legacy'] })
    if (result.state !== 'ready') return result
    snapshots.push(result)
  }
  for (const [publisher, floor] of Object.entries(expected.sequenceFloors ?? {})) {
    if (floor > 0 && !excused.has(publisher) && !snapshots.some(s => (s.checkpoint.publisher ?? 'legacy') === publisher)) {
      return { state: 'unusable', reason: 'rollback' }
    }
  }
  if (!snapshots.length) return { state: 'unusable', reason: 'checkpoint' }
  snapshots.sort((a, b) => older(a.event, b.event))
  return { state: 'ready', snapshots }
}

/** Mergeable per-device heads prevent last-writer replacement across devices.
 * Discovery queries only the private vault author. No device roster is public.
 * Reads one rotation with no rotation boundary: every head must be valid.
 */
export async function readVaultHeads(reader: VaultReader, expected: HeadsExpected): Promise<VaultHeadsResult> {
  const now = checkNow(expected.now ?? nowSeconds())
  const heads = await openHeads(reader, expected, now)
  if (!Array.isArray(heads)) return heads
  return readOpenedHeads(reader, expected, now, heads)
}

/** Read every rotation from zero, following `nextRotation` (always rotation + 1).
 *
 * Rotation is a revocation boundary. At each rotation the pointer is the
 * EARLIEST authenticated head declaring the next rotation. Heads of that
 * rotation newer than the pointer (ties by event ID) are set aside, whether or
 * not they open, because a holder of the old key could have written them; only
 * heads at or before the pointer are merged. The boundary is final only because
 * the next rotation must then read `ready`, or the whole read fails. A head
 * backdated before the pointer cannot be told apart from an honest one.
 */
export async function readVaultHeadRotations(resolve: (rotation: number) => Promise<{
  reader: VaultReader; author: string; sequenceFloors?: Readonly<Record<string, number>>;
}>, purpose: string, now: number = nowSeconds()): Promise<VaultHeadsResult> {
  checkNow(now)
  let rotation = 0
  const carried: Ready[] = []
  for (let hop = 0; hop < 32; hop++) {
    let context: Awaited<ReturnType<typeof resolve>>
    try { context = await resolve(rotation) } catch { return { state: 'unavailable' } }
    const expected = { ...context, purpose, rotation, now }
    const heads = await openHeads(context.reader, expected, now)
    if (!Array.isArray(heads)) return rotation > 0 && heads.state === 'absent' ? { state: 'unusable', reason: 'checkpoint' } : heads
    const pointer = heads.filter(h => h.checkpoint?.nextRotation === rotation + 1)
      .sort((a, b) => older(a.event, b.event))[0]
    const kept = pointer ? heads.filter(h => older(h.event, pointer.event) <= 0) : heads
    const excused = new Set(heads.filter(h => !kept.includes(h) && h.checkpoint).map(h => h.checkpoint!.publisher ?? 'legacy'))
    const result = await readOpenedHeads(context.reader, expected, now, kept, excused)
    if (result.state !== 'ready') return result
    carried.push(...result.snapshots)
    if (carried.length > 64 || carried.reduce((size, s) => size + encoder.encode(s.plaintext).length, 0) > 32 * 1024 * 1024) return { state: 'unusable', reason: 'checkpoint' }
    if (!pointer) return { state: 'ready', snapshots: carried }
    rotation++
  }
  return { state: 'unusable', reason: 'checkpoint' }
}
