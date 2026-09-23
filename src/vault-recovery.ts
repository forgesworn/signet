import type { NostrEvent } from './types.js'
import { verifyEvent } from './crypto.js'
import { MAX_VAULT_CHUNKS, MAX_VAULT_CONTROL_BYTES, VAULT_EVENT_KIND,
  matchesVaultChunk, parseVaultCheckpoint, vaultCheckpointShapedTag, vaultCheckpointTag, vaultContentHash } from './vault-checkpoint.js'
import type { VaultCheckpoint } from './vault-checkpoint.js'

/** A checkpoint dated further than this beyond the reader's clock is rejected,
 * so one device with a bad clock cannot outrank every later honest head. */
export const VAULT_CLOCK_TOLERANCE_SECONDS = 300
const MAX_VAULT_HEADS = 16
/** Rotations recovery will walk. A vault rotated more than 32 times reads
 * `unusable`; there is no way past it without raising this bound. */
const MAX_ROTATION_HOPS = 32
const encoder = new TextEncoder()
const nowSeconds = () => Math.floor(Date.now() / 1000)
type Ready = Extract<VaultReadResult, { state: 'ready' }>

type Unavailable = Extract<VaultReadResult, { state: 'unavailable' }>
/** Carry the failed relay list from a `VaultRelayError` (or any error with a
 * string-array `failedRelays`) into the result. */
function unavailable(error?: unknown): Unavailable {
  const failed = (error as { failedRelays?: unknown } | undefined)?.failedRelays
  return Array.isArray(failed) && failed.every(f => typeof f === 'string')
    ? { state: 'unavailable', failedRelays: [...failed] } : { state: 'unavailable' }
}

function checkNow(now: number): number {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Vault reader clock must be a non-negative integer')
  return now
}

function checkMinRotation(minRotation: number): number {
  if (!Number.isSafeInteger(minRotation) || minRotation < 0) {
    throw new TypeError('Vault reader minRotation must be a non-negative integer')
  }
  return minRotation
}

/** The highest rotation number a caller's floors already name, ignoring any
 * non-integer or negative key. -1 when `floors` names none, so a rotation-0
 * result is never treated as a rollback when nothing has been seen yet. */
function highestFloorRotation(floors: Readonly<Record<number, number>>): number {
  let highest = -1
  for (const key of Object.keys(floors)) {
    const rotation = Number(key)
    if (Number.isInteger(rotation) && rotation >= 0 && rotation > highest) highest = rotation
  }
  return highest
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
    || event.created_at > now + VAULT_CLOCK_TOLERANCE_SECONDS) return null
  const tag = vaultCheckpointShapedTag(event)
  return tag !== null && await verifyEvent(event) ? tag : null
}

export type VaultReadResult =
  | { state: 'absent' }
  /** `failedRelays`, when known, names the relays that did not answer. */
  | { state: 'unavailable'; failedRelays?: string[] }
  | { state: 'unusable'; reason: 'checkpoint' | 'rollback' | 'chunk' | 'revision' }
  | { state: 'ready'; plaintext: string; checkpoint: VaultCheckpoint; event: NostrEvent }

export interface VaultReader {
  /** Must distinguish an empty reachable query from relay failure (throw).
   * An error carrying `failedRelays: string[]` is reported in the result. */
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
  try { candidates = await reader.checkpoints(expected.author, tag) } catch (e) { return unavailable(e) }
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
    try { chunk = await reader.chunk(ref.eventId) } catch (e) { return unavailable(e) }
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

/** Whether a rotation holds any authentic checkpoint-shaped event (optionally
 * under one exact tag). Contents are never opened, so nothing written under a
 * superseded key is decrypted, parsed or counted. */
async function rotationPresent(reader: VaultReader, author: string, now: number, tag?: string):
  Promise<'present' | 'absent' | Unavailable> {
  let events: NostrEvent[]
  try { events = await reader.checkpoints(author, tag) } catch (e) { return unavailable(e) }
  for (const event of events.slice(0, 1024)) {
    const found = await authenticCheckpointEvent(event, author, now)
    if (found !== null && (tag === undefined || found === tag)) return 'present'
  }
  return 'absent'
}

/** Find the newest rotation: the first rotation whose successor holds no
 * authentic checkpoint. Rotation is a revocation boundary: once rotation n + 1
 * exists, rotation n is never read (only rotation n + 1's key can sign there),
 * so a holder of a retired key can neither inject heads nor block recovery by
 * writing to the old rotation, and cannot hide the successor by overwriting
 * the pointer. Costs one extra resolve and query for the successor.
 *
 * A rotation revokes only a holder of THAT rotation's key, not the tree root:
 * a holder of the root key can derive every rotation regardless, so rotation
 * is a boundary against a retired per-rotation key, not against root
 * compromise. This walk can find a rotation older than one a caller has
 * already read (every relay withholding the successor); callers that track
 * the highest rotation they have seen must reject a lower result as a
 * rollback rather than trust it, since "not found" here never means "does
 * not exist". */
async function newestRotation<C extends { reader: VaultReader; author: string }>(
  resolve: (rotation: number) => Promise<C>, now: number, tagFor?: (author: string) => string,
): Promise<{ rotation: number; context: C } | Exclude<VaultReadResult, { state: 'ready' }>> {
  let rotation = 0
  let context: C
  try { context = await resolve(0) } catch (e) { return unavailable(e) }
  for (let hop = 0; hop < MAX_ROTATION_HOPS; hop++) {
    let next: C
    try { next = await resolve(rotation + 1) } catch (e) { return unavailable(e) }
    const probe = await rotationPresent(next.reader, next.author, now, tagFor?.(next.author))
    if (probe === 'absent') return { rotation, context }
    if (probe !== 'present') return probe
    rotation++
    context = next
  }
  return { state: 'unusable', reason: 'checkpoint' }
}

/** Read the newest rotation's legacy (publisher-less) checkpoint. Rotations are
 * contiguous from zero; see `newestRotation` for the revocation boundary. A
 * `nextRotation` pointer (always rotation + 1) to a rotation with no authentic
 * checkpoint is damage, not a never-migrated account.
 */
export async function readVaultRotations(
  resolve: (rotation: number) => Promise<{ reader: VaultReader; author: string }>,
  purpose: string,
  floors: Readonly<Record<number, number>> = {},
  now: number = nowSeconds(),
): Promise<VaultReadResult> {
  checkNow(now)
  const found = await newestRotation(resolve, now, author => vaultCheckpointTag(author))
  if (!('context' in found)) return found
  const { rotation, context } = found
  if (rotation < highestFloorRotation(floors)) return { state: 'unusable', reason: 'rollback' }
  const result = await readVaultSnapshot(context.reader, {
    author: context.author, purpose, rotation, minSequence: floors[rotation], now,
  })
  if (result.state === 'absent') return rotation > 0 ? { state: 'unusable', reason: 'checkpoint' } : result
  if (result.state === 'ready' && result.checkpoint.nextRotation !== undefined) return { state: 'unusable', reason: 'checkpoint' }
  return result
}

export type VaultHeadsResult = Exclude<VaultReadResult, { state: 'ready' }>
  | { state: 'ready'; snapshots: Ready[] }

interface HeadsExpected {
  author: string; purpose: string; rotation: number; sequenceFloors?: Readonly<Record<string, number>>; now?: number
}

/** Mergeable per-device heads prevent last-writer replacement across devices.
 * Discovery queries only the private vault author. No device roster is public.
 * Reads one rotation strictly: events without a checkpoint-shaped d-tag are
 * ignored, then every remaining head must be valid, and more than 16 fails.
 */
export async function readVaultHeads(reader: VaultReader, expected: HeadsExpected): Promise<VaultHeadsResult> {
  const now = checkNow(expected.now ?? nowSeconds())
  let events: NostrEvent[]
  try { events = await reader.checkpoints(expected.author) } catch (e) { return unavailable(e) }
  const shaped = events.filter(e => !!e && e.pubkey === expected.author && e.kind === VAULT_EVENT_KIND
    && vaultCheckpointShapedTag(e) !== null)
  if (!shaped.length) return { state: 'absent' }
  if (shaped.length > 128) return { state: 'unusable', reason: 'checkpoint' }
  const heads = new Map<string, NostrEvent>()
  for (const event of shaped) {
    const tag = await authenticCheckpointEvent(event, expected.author, now)
    if (tag === null) continue
    const previous = heads.get(tag)
    if (!previous || older(previous, event) < 0) heads.set(tag, event)
  }
  if (!heads.size || heads.size > MAX_VAULT_HEADS) return { state: 'unusable', reason: 'checkpoint' }
  const snapshots: Ready[] = []
  for (const [tag, event] of heads) {
    let raw: string | null
    try { raw = await reader.open(event.content, expected.author) } catch { return { state: 'unusable', reason: 'checkpoint' } }
    const checkpoint = raw === null ? null : parseVaultCheckpoint(raw, expected)
    if (!checkpoint || tag !== vaultCheckpointTag(expected.author, checkpoint.publisher)) return { state: 'unusable', reason: 'checkpoint' }
    const result = await readVaultSnapshot({ ...reader, checkpoints: async () => [event],
      open: (content, author) => content === event.content ? Promise.resolve(raw) : reader.open(content, author),
    }, { author: expected.author, purpose: expected.purpose, rotation: expected.rotation, now,
      publisher: checkpoint.publisher, minSequence: expected.sequenceFloors?.[checkpoint.publisher ?? 'legacy'] })
    if (result.state !== 'ready') return result
    snapshots.push(result)
  }
  for (const [publisher, floor] of Object.entries(expected.sequenceFloors ?? {})) {
    if (floor > 0 && !snapshots.some(s => (s.checkpoint.publisher ?? 'legacy') === publisher)) return { state: 'unusable', reason: 'rollback' }
  }
  snapshots.sort((a, b) => older(a.event, b.event))
  return { state: 'ready', snapshots }
}

/** Read the newest rotation's merged per-device heads. Rotation is a
 * revocation boundary (see `newestRotation`): heads of a superseded rotation
 * are never merged, opened or counted, so the rotating writer must carry every
 * head's state into the new rotation before publishing there. Floors from
 * `resolve` apply to the rotation that is read.
 *
 * `minRotation` is the highest rotation this caller has already reached. If
 * every relay withholds the true newest rotation's successor, `newestRotation`
 * cannot distinguish that from a vault that never rotated further, and would
 * otherwise report a lower rotation's heads as `ready`; a caller-tracked floor
 * on the walk itself is what catches that withholding.
 */
export async function readVaultHeadRotations(resolve: (rotation: number) => Promise<{
  reader: VaultReader; author: string; sequenceFloors?: Readonly<Record<string, number>>;
}>, purpose: string, now: number = nowSeconds(), minRotation = 0): Promise<VaultHeadsResult> {
  checkNow(now)
  checkMinRotation(minRotation)
  const found = await newestRotation(resolve, now)
  if (!('context' in found)) return found
  const { rotation, context } = found
  if (rotation < minRotation) return { state: 'unusable', reason: 'rollback' }
  const result = await readVaultHeads(context.reader, { ...context, purpose, rotation, now })
  if (result.state === 'absent') return rotation > 0 ? { state: 'unusable', reason: 'checkpoint' } : result
  if (result.state === 'ready' && result.snapshots.some(s => s.checkpoint.nextRotation !== undefined)) {
    return { state: 'unusable', reason: 'checkpoint' }
  }
  return result
}
