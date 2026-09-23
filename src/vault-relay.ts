import { RelayClient, type NostrFilter } from './relay.js'
import type { NostrEvent } from './types.js'
import type { VaultReader } from './vault-recovery.js'
import { VAULT_EVENT_KIND } from './vault-checkpoint.js'

/** Matching events one relay may contribute to one query. More fails that relay. */
export const MAX_VAULT_EVENTS_PER_RELAY = 128
const MAX_VAULT_RELAYS = 8

/** Must agree with the RelayClient constructor: a URL accepted here but rejected
 * there would be skipped silently. Plain ws:// is loopback-only (localhost and
 * 127.0.0.1; RelayClient does not accept [::1]). */
function validRelay(raw: string): boolean {
  try {
    const url = new URL(raw)
    return !url.username && !url.password && !url.hash && (url.protocol === 'wss:'
      || (url.protocol === 'ws:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
  } catch { return false }
}

/** Client-side re-check of the relay filter. Relays are untrusted, so an event
 * outside the requested author/kind/id/d-tag is dropped before it counts
 * towards any limit. */
function matchesFilter(filter: NostrFilter, event: NostrEvent): boolean {
  if (!event || typeof event.id !== 'string' || typeof event.pubkey !== 'string' || !Array.isArray(event.tags)) return false
  if (filter.ids && !filter.ids.includes(event.id)) return false
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false
  const dTags = filter['#d']
  if (dTags && !event.tags.some(t => Array.isArray(t) && t[0] === 'd' && dTags.includes(t[1]))) return false
  return true
}

/** EOSE is required: a timed-out empty query is not evidence of absence.
 * Events are filtered against `filter` and de-duplicated before the per-relay
 * cap applies, so unrelated events cannot crowd out the requested ones. */
export function fetchVaultEvents(relay: Pick<RelayClient, 'subscribe' | 'closeSubscription'>,
  filter: NostrFilter, timeoutMs = 10000): Promise<NostrEvent[]> {
  return new Promise((resolve, reject) => {
    const events = new Map<string, NostrEvent>()
    let subId: string | undefined
    let finished = false
    const finish = (error?: Error) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      if (subId) relay.closeSubscription(subId)
      if (error) reject(error); else resolve([...events.values()])
    }
    const timer = setTimeout(() => finish(new Error('Vault query did not complete')), timeoutMs)
    try {
      subId = relay.subscribe([filter], event => {
        if (finished || !matchesFilter(filter, event) || events.has(event.id)) return
        if (events.size >= MAX_VAULT_EVENTS_PER_RELAY) finish(new Error('Vault query exceeds event limit'))
        else events.set(event.id, event)
      }, () => finish())
      if (finished) relay.closeSubscription(subId)
    } catch { finish(new Error('Vault query failed')) }
  })
}

/** Relay-backed reader. At most eight valid relay URLs are queried.
 *
 * A non-empty result needs at least one relay to have answered with EOSE. An
 * EMPTY result needs every queried relay to have answered with none failing:
 * one relay saying "nothing" while another timed out or errored is not evidence
 * of absence, so the query throws and recovery reports `unavailable`. */
export function createVaultRelayReader(relays: readonly string[], open: VaultReader['open']): VaultReader {
  const urls = [...new Set(relays.filter(validRelay))].slice(0, MAX_VAULT_RELAYS)
  const query = async (filter: NostrFilter): Promise<NostrEvent[]> => {
    const events = new Map<string, NostrEvent>()
    let answered = 0
    let failed = 0
    await Promise.all(urls.map(async url => {
      let relay: RelayClient | undefined
      try {
        relay = new RelayClient(url)
        await relay.connect()
        const found = await fetchVaultEvents(relay, filter)
        answered++
        for (const e of found) events.set(e.id, e)
      } catch { failed++ }
      finally { relay?.disconnect() }
    }))
    if (!answered) throw new Error('Vault relays unavailable')
    if (!events.size && failed) throw new Error('Vault relays incomplete: empty answer while a relay failed')
    return [...events.values()]
  }
  return {
    checkpoints: (author, dTag) => query({ kinds: [VAULT_EVENT_KIND], authors: [author], ...(dTag ? { '#d': [dTag] } : {}), limit: 17 }),
    chunk: async id => (await query({ ids: [id], limit: 1 })).find(e => e.id === id) ?? null,
    open,
  }
}
