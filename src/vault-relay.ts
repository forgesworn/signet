import { RelayClient, type NostrFilter } from './relay.js'
import type { NostrEvent } from './types.js'
import type { VaultReader } from './vault-recovery.js'
import { VAULT_EVENT_KIND } from './vault-checkpoint.js'

function validRelay(raw: string): boolean {
  try {
    const url = new URL(raw)
    return !url.username && !url.password && !url.hash && (url.protocol === 'wss:'
      || (url.protocol === 'ws:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
  } catch { return false }
}

/** EOSE is required: a timed-out empty query is not evidence of absence. */
export function fetchVaultEvents(relay: Pick<RelayClient, 'subscribe' | 'closeSubscription'>,
  filter: NostrFilter, timeoutMs = 10000): Promise<NostrEvent[]> {
  return new Promise((resolve, reject) => {
    const events: NostrEvent[] = [];
    let subId: string | undefined;
    let finished = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (subId) relay.closeSubscription(subId);
      if (error) reject(error); else resolve(events);
    };
    const timer = setTimeout(() => finish(new Error('Vault query did not complete')), timeoutMs);
    try {
      subId = relay.subscribe([filter], event => {
        if (events.length >= 128) finish(new Error('Vault query exceeds event limit'));
        else events.push(event);
      }, () => finish());
      if (finished) relay.closeSubscription(subId);
    } catch { finish(new Error('Vault query failed')); }
  });
}

export function createVaultRelayReader(relays: readonly string[], open: VaultReader["open"]): VaultReader {
  const urls = [...new Set(relays.filter(validRelay))].slice(0, 8);
  const query = async (filter: NostrFilter): Promise<NostrEvent[]> => {
    const events = new Map<string, NostrEvent>();
    let reachable = 0;
    await Promise.all(urls.map(async url => {
      const relay = new RelayClient(url);
      try {
        await relay.connect();
        const found = await fetchVaultEvents(relay, filter);
        reachable++;
        for (const e of found) if (events.size < 128) events.set(e.id, e);
      } catch { /* Other relays may still answer. */ }
      finally { relay.disconnect(); }
    }));
    if (!reachable) throw new Error('Vault relays unavailable');
    return [...events.values()];
  };
  return {
    checkpoints: (author, dTag) => query({ kinds: [VAULT_EVENT_KIND], authors: [author], ...(dTag ? { '#d': [dTag] } : {}), limit: 17 }),
    chunk: async id => (await query({ ids: [id], limit: 1 })).find(e => e.id === id) ?? null,
    open,
  };
}

