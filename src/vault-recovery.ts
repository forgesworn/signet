import type { NostrEvent } from './types.js'
import { verifyEvent } from './crypto.js'
import { MAX_VAULT_CHUNKS, MAX_VAULT_CONTROL_BYTES, VAULT_EVENT_KIND,
  matchesVaultChunk, parseVaultCheckpoint, vaultCheckpointTag, vaultContentHash } from './vault-checkpoint.js'
import type { VaultCheckpoint } from './vault-checkpoint.js'
import { createVaultDeviceRetirementCheck } from './vault-device-revocation.js'
import type { VaultRetirementEvidence } from './vault-device-revocation.js'

export type VaultReadResult =
  | { state: 'absent' }
  | { state: 'unavailable' }
  | { state: 'unusable'; reason: 'checkpoint' | 'rollback' | 'chunk' | 'revision' | 'retirement' }
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
 */
export async function readVaultSnapshot(
  reader: VaultReader,
  expected: { author: string; purpose: string; rotation: number; minSequence?: number; publisher?: string },
): Promise<VaultReadResult> {
  const tag = vaultCheckpointTag(expected.author, expected.publisher)
  let candidates: NostrEvent[]
  try { candidates = await reader.checkpoints(expected.author, tag) } catch { return { state: 'unavailable' } }
  if (!candidates.length) return { state: 'absent' }
  if (candidates.length > 128) return { state: 'unusable', reason: 'checkpoint' }
  // A corrupt newer event does not hide a valid older event. Once a valid signed
  // event is chosen, however, failed decrypt/schema is not a licence to downgrade.
  const valid: NostrEvent[] = []
  for (const event of candidates) {
    if (!event || event.kind !== VAULT_EVENT_KIND || event.pubkey !== expected.author
      || typeof event.content !== 'string' || new TextEncoder().encode(event.content).length > MAX_VAULT_CONTROL_BYTES
      || !Number.isSafeInteger(event.created_at) || event.created_at < 0 || !Array.isArray(event.tags)) continue
    const dTags = event.tags.filter(t => Array.isArray(t) && t[0] === 'd')
    if (dTags.length !== 1 || dTags[0].length !== 2 || dTags[0][1] !== tag || !await verifyEvent(event)) continue
    valid.push(event)
  }
  valid.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))
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
    totalBytes += new TextEncoder().encode(part).length
    if (totalBytes > MAX_VAULT_CHUNKS * 65536) return { state: 'unusable', reason: 'chunk' }
    parts.push(part)
  }
  const plaintext = parts.join('')
  if (vaultContentHash(plaintext) !== checkpoint.revision) return { state: 'unusable', reason: 'revision' }
  return { state: 'ready', plaintext, checkpoint, event }
}

/** Follow authenticated forward pointers. Missing a referenced rotation is damage,
 * not a never-migrated account. Bound traversal to prevent untrusted endless work.
 */
export async function readVaultRotations(
  resolve: (rotation: number) => Promise<{ reader: VaultReader; author: string }>,
  purpose: string,
  floors: Readonly<Record<number, number>> = {},
): Promise<VaultReadResult> {
  let rotation = 0
  for (let hop = 0; hop < 32; hop++) {
    let context: Awaited<ReturnType<typeof resolve>>
    try { context = await resolve(rotation) } catch { return { state: 'unavailable' } }
    const result = await readVaultSnapshot(context.reader, {
      author: context.author, purpose, rotation, minSequence: floors[rotation],
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
  | { state: 'ready'; snapshots: Extract<VaultReadResult, { state: 'ready' }>[] }

/** Mergeable per-device heads prevent last-writer replacement across devices.
 * Discovery queries only the private vault author. No device roster is public.
 */
export async function readVaultHeads(reader: VaultReader, expected: {
  author: string; purpose: string; rotation: number; sequenceFloors?: Readonly<Record<string, number>>;
  /** Omission means no retirement enforcement. Supplied evidence is validated
   * against author (the vault key) and the independently pinned authority. */
  retirement?: VaultRetirementEvidence;
}): Promise<VaultHeadsResult> {
  let retired: ReturnType<typeof createVaultDeviceRetirementCheck> | undefined
  try {
    // Refuse old JavaScript callers rather than silently ignoring their evidence.
    if ('revokedDevices' in expected) throw new Error('Unscoped retirement evidence is unsupported')
    if (expected.retirement !== undefined) retired = createVaultDeviceRetirementCheck(expected.retirement.events,
      { vault: expected.author, authority: expected.retirement.authority, now: expected.retirement.now })
  } catch { return { state: 'unusable', reason: 'retirement' } }
  let events: NostrEvent[]
  try { events = await reader.checkpoints(expected.author) } catch { return { state: 'unavailable' } }
  if (!events.length) return { state: 'absent' }
  if (events.length > 128) return { state: 'unusable', reason: 'checkpoint' }
  const heads = new Map<string, NostrEvent>()
  for (const event of events) {
    if (!event || event.pubkey !== expected.author || event.kind !== VAULT_EVENT_KIND
      || typeof event.content !== 'string' || new TextEncoder().encode(event.content).length > MAX_VAULT_CONTROL_BYTES
      || !Array.isArray(event.tags) || !await verifyEvent(event)) continue
    const tags = event.tags.filter(t => Array.isArray(t) && t[0] === 'd')
    if (tags.length !== 1 || tags[0].length !== 2) continue
    const previous = heads.get(tags[0][1])
    if (!previous || event.created_at > previous.created_at || (event.created_at === previous.created_at && event.id < previous.id)) heads.set(tags[0][1], event)
  }
  if (!heads.size || heads.size > 16) return { state: 'unusable', reason: 'checkpoint' }
  const snapshots: Extract<VaultReadResult, { state: 'ready' }>[] = []
  for (const [tag, event] of heads) {
    let raw: string | null
    try { raw = await reader.open(event.content, expected.author) } catch { return { state: 'unusable', reason: 'checkpoint' } }
    const checkpoint = raw === null ? null : parseVaultCheckpoint(raw, expected)
    if (!checkpoint || tag !== vaultCheckpointTag(expected.author, checkpoint.publisher)) return { state: 'unusable', reason: 'checkpoint' }
    if (retired) {
      // Legacy multi-device heads cannot attribute a safe subset of their data.
      // Also reject retired chunk authors in otherwise live publisher heads.
      if (checkpoint.devicePubkeys.some(device => retired(device, checkpoint.sequence))) continue
    }
    const result = await readVaultSnapshot({ ...reader, checkpoints: async () => [event],
      open: (content, author) => content === event.content ? Promise.resolve(raw) : reader.open(content, author),
    }, { ...expected, publisher: checkpoint.publisher, minSequence: expected.sequenceFloors?.[checkpoint.publisher ?? 'legacy'] })
    if (result.state !== 'ready') return result
    snapshots.push(result)
  }
  for (const [publisher, floor] of Object.entries(expected.sequenceFloors ?? {})) {
    if (floor > 0 && !snapshots.some(s => (s.checkpoint.publisher ?? 'legacy') === publisher)) return { state: 'unusable', reason: 'rollback' }
  }
  if (!snapshots.length) return { state: 'unusable', reason: 'checkpoint' }
  snapshots.sort((a, b) => a.event.created_at - b.event.created_at || a.event.id.localeCompare(b.event.id))
  return { state: 'ready', snapshots }
}

export async function readVaultHeadRotations(resolve: (rotation: number) => Promise<{
  reader: VaultReader; author: string; sequenceFloors?: Readonly<Record<string, number>>;
  retirement?: VaultRetirementEvidence;
}>, purpose: string): Promise<VaultHeadsResult> {
  let rotation = 0
  let retirementAuthority: string | undefined
  const carried: Extract<VaultReadResult, { state: 'ready' }>[] = []
  for (let hop = 0; hop < 32; hop++) {
    let context: Awaited<ReturnType<typeof resolve>>
    try { context = await resolve(rotation) } catch { return { state: 'unavailable' } }
    if (hop === 0) retirementAuthority = context.retirement?.authority
    if (context.retirement?.authority !== retirementAuthority) return { state: 'unusable', reason: 'retirement' }
    const result = await readVaultHeads(context.reader, { ...context, purpose, rotation })
    if (result.state !== 'ready') return rotation > 0 && result.state === 'absent' ? { state: 'unusable', reason: 'checkpoint' } : result
    carried.push(...result.snapshots)
    if (carried.length > 64 || carried.reduce((size, s) => size + new TextEncoder().encode(s.plaintext).length, 0) > 32 * 1024 * 1024) return { state: 'unusable', reason: 'checkpoint' }
    const next = Math.max(...result.snapshots.map(s => s.checkpoint.nextRotation ?? rotation))
    if (next === rotation) return { state: 'ready', snapshots: carried }
    rotation = next
  }
  return { state: 'unusable', reason: 'checkpoint' }
}
