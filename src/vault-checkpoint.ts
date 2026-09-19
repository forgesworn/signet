/** Shared private-vault checkpoint contract. No relay I/O or application data schema. */
import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { parseVaultPurpose } from './vault-keys.js'

export const VAULT_EVENT_KIND = 30078
export const MAX_VAULT_CHUNKS = 32
export const MAX_VAULT_DEVICES = 16
export const MAX_VAULT_CONTROL_BYTES = 12 * 1024
export const MAX_VAULT_CHUNK_BYTES = 100_000
const HEX = /^[0-9a-f]{64}$/
const encoder = new TextEncoder()
const uint = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export interface VaultChunkRef {
  /** Exact signed event ID, never a mutable latest-by-tag lookup. */
  eventId: string
  author: string
  /** SHA-256 of the UTF-8 encrypted event content. */
  contentHash: string
  contentBytes: number
}

export interface VaultCheckpoint {
  v: 1
  purpose: string
  rotation: number
  sequence: number
  /** SHA-256 of the complete plaintext, checked before accepting a restored copy. */
  revision: string
  /** Device whose independently replaceable checkpoint this is. */
  publisher?: string
  devicePubkeys: string[]
  /** Ordered chunk references; empty datasets still have one encrypted chunk. */
  chunks: VaultChunkRef[]
  /** Optional next index; recovery follows forward-only rotations from index zero. */
  nextRotation?: number
}

/** Publicly computable opaque tag; confidentiality comes from encryption and private keys. */
export function vaultCheckpointTag(author: string, publisher?: string): string {
  if (!HEX.test(author)) throw new Error('Invalid vault author')
  if (publisher !== undefined && !HEX.test(publisher)) throw new Error('Invalid vault publisher')
  return bytesToHex(hmac(sha256, hexToBytes(author), encoder.encode(`signet-vault-route\u0000checkpoint\u0000${publisher ?? '0'}`))).slice(0, 32)
}

export function vaultContentHash(content: string): string {
  return bytesToHex(sha256(encoder.encode(content)))
}

/** Accept no partial checkpoint. A bad reference must never silently lose data. */
export function parseVaultCheckpoint(raw: string, expected: { purpose: string; rotation: number }): VaultCheckpoint | null {
  if (typeof raw !== 'string' || encoder.encode(raw).length > MAX_VAULT_CONTROL_BYTES) return null
  let v: unknown
  try { v = JSON.parse(raw) } catch { return null }
  if (!object(v) || v.v !== 1 || typeof v.purpose !== 'string' || !parseVaultPurpose(v.purpose)
    || v.purpose !== expected.purpose || v.rotation !== expected.rotation || !uint(v.rotation) || v.rotation > 0xffff_ffff
    || !uint(v.sequence) || typeof v.revision !== 'string' || !HEX.test(v.revision)) return null
  if (!Array.isArray(v.devicePubkeys) || !v.devicePubkeys.length || v.devicePubkeys.length > MAX_VAULT_DEVICES
    || v.devicePubkeys.some(p => typeof p !== 'string' || !HEX.test(p))
    || new Set(v.devicePubkeys).size !== v.devicePubkeys.length) return null
  if (v.publisher !== undefined && (typeof v.publisher !== 'string' || !v.devicePubkeys.includes(v.publisher))) return null
  if (!Array.isArray(v.chunks) || !v.chunks.length || v.chunks.length > MAX_VAULT_CHUNKS) return null
  const chunks: VaultChunkRef[] = []
  for (const c of v.chunks) {
    if (!object(c) || typeof c.eventId !== 'string' || !HEX.test(c.eventId)
      || typeof c.author !== 'string' || !v.devicePubkeys.includes(c.author)
      || typeof c.contentHash !== 'string' || !HEX.test(c.contentHash)
      || !uint(c.contentBytes) || c.contentBytes === 0 || c.contentBytes > MAX_VAULT_CHUNK_BYTES) return null
    chunks.push({ eventId: c.eventId, author: c.author, contentHash: c.contentHash, contentBytes: c.contentBytes })
  }
  if (new Set(chunks.map(c => c.eventId)).size !== chunks.length) return null
  if (v.nextRotation !== undefined && (!uint(v.nextRotation) || v.nextRotation <= v.rotation || v.nextRotation > 0xffff_ffff)) return null
  return { v: 1, purpose: v.purpose, rotation: v.rotation, sequence: v.sequence,
    revision: v.revision, ...(v.publisher === undefined ? {} : { publisher: v.publisher as string }), devicePubkeys: [...v.devicePubkeys] as string[], chunks,
    ...(v.nextRotation === undefined ? {} : { nextRotation: v.nextRotation as number }) }
}

/** Integrity check before decrypting. Signature and event-ID verification is also required. */
export function matchesVaultChunk(ref: VaultChunkRef, event: { id: string; pubkey: string; kind: number; content: string }): boolean {
  return event.id === ref.eventId && event.pubkey === ref.author && event.kind === VAULT_EVENT_KIND
    && encoder.encode(event.content).length === ref.contentBytes
    && vaultContentHash(event.content) === ref.contentHash
}
