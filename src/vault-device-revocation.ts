import { verifyEventSync } from './crypto.js'
import type { NostrEvent, UnsignedEvent } from './types.js'

/** Additive owner-authorised vault-device retirement contract. Readers that do
 * not understand this event continue to read legacy history; aware readers
 * must retain the earliest authenticated cutoff before accepting a device head. */
export const VAULT_DEVICE_REVOCATION_KIND = 30078
export const VAULT_DEVICE_REVOCATION_TAG = 'signet:vault-device-revocation:v1'
const HEX = /^[0-9a-f]{64}$/
const uint = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 0xffff_ffff
const sequence = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const hex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

/** Authority must come from trusted recovery configuration, never the event. */
export interface VaultRetirementContext { vault: string; authority: string; now: number }
export interface VaultRetirementEvidence {
  authority: string
  now: number
  /** Original signed events, including locally retained retirement history. */
  events: readonly NostrEvent[]
}

export interface VaultDeviceRevocation {
  v: 1
  vault: string
  device: string
  effectiveSequence: number
  issuedAt: number
  authority: string
  eventId: string
}

export function buildVaultDeviceRevocation(args: {
  authority: string; vault: string; device: string; effectiveSequence: number; issuedAt: number
}): UnsignedEvent {
  if (![args.authority, args.vault, args.device].every(v => HEX.test(v)) || args.authority === args.device
    || !uint(args.effectiveSequence) || !uint(args.issuedAt)) throw new Error('Invalid vault device revocation')
  return { pubkey: args.authority, kind: VAULT_DEVICE_REVOCATION_KIND, created_at: args.issuedAt,
    tags: [['d', `${VAULT_DEVICE_REVOCATION_TAG}:${args.vault}:${args.device}`], ['p', args.device], ['vault', args.vault], ['sequence', String(args.effectiveSequence)]], content: '' }
}

export function readVaultDeviceRevocation(event: NostrEvent, expected?: { authority?: string; vault?: string; now?: number }): VaultDeviceRevocation | null {
  if (!event || event.kind !== VAULT_DEVICE_REVOCATION_KIND || !HEX.test(event.pubkey) || !uint(event.created_at)
    || event.content !== '' || !Array.isArray(event.tags) || event.tags.length !== 4
    || !event.tags.every(t => Array.isArray(t) && t.length === 2 && t.every(v => typeof v === 'string'))
    || event.tags[0][0] !== 'd'
    || event.tags[1][0] !== 'p' || !HEX.test(event.tags[1][1]) || event.tags[2][0] !== 'vault' || !HEX.test(event.tags[2][1])
    || event.tags[3][0] !== 'sequence' || !/^\d+$/.test(event.tags[3][1])) return null
  const device = event.tags[1][1], vault = event.tags[2][1], effectiveSequence = Number(event.tags[3][1])
  if (event.tags[0][1] !== `${VAULT_DEVICE_REVOCATION_TAG}:${vault}:${device}`
    || !uint(effectiveSequence) || expected?.authority !== undefined && expected.authority !== event.pubkey
    || expected?.vault !== undefined && expected.vault !== vault || expected?.now !== undefined && event.created_at > expected.now + 300
    || !verifyEventSync(event)) return null
  return { v: 1, vault, device, effectiveSequence, issuedAt: event.created_at, authority: event.pubkey, eventId: event.id }
}

/** Validate once per read and capture immutable, scope-bound cutoff values.
 * Malformed evidence fails closed; valid events from other scopes are ignored.
 * Parsed record objects alone are deliberately not accepted as authority. */
export function createVaultDeviceRetirementCheck(events: readonly NostrEvent[], expected: VaultRetirementContext): (device: string, checkpointSequence: number) => boolean {
  if (!expected || !hex(expected.vault) || !hex(expected.authority) || !sequence(expected.now)
    || !Array.isArray(events) || events.length > 1024) throw new Error('Invalid vault retirement context')
  const floors = new Map<string, number>()
  for (const event of events) {
    const record = readVaultDeviceRevocation(event, { now: expected.now })
    if (!record) throw new Error('Invalid signed vault retirement evidence')
    if (record.vault !== expected.vault || record.authority !== expected.authority) continue
    floors.set(record.device, Math.min(floors.get(record.device) ?? Infinity, record.effectiveSequence))
  }
  return (device, checkpointSequence) => {
    if (!hex(device) || !sequence(checkpointSequence)) throw new Error('Invalid vault retirement query')
    const floor = floors.get(device)
    return floor !== undefined && checkpointSequence >= floor
  }
}

export function isVaultDeviceRetired(events: readonly NostrEvent[], expected: VaultRetirementContext & { device: string; sequence: number }): boolean {
  return createVaultDeviceRetirementCheck(events, expected)(expected.device, expected.sequence)
}
