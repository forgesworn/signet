# Contact Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich contacts with public Signet badge data (tier, Signet IQ, entity type) fetched from relays, and add a pubkey lookup flow for public follows alongside the existing QR scan flow.

**Architecture:** Two entry points (QR scan, pubkey lookup) write to the same `StoredConnection` store with a `connectionType` discriminator. Badge data is fetched from relays via `buildBadgeFilters()` + `computeBadge()`, cached in IndexedDB alongside the contact, and refreshed opportunistically. No protocol changes — app-only.

**Tech Stack:** React, IndexedDB (via `idb`), signet-protocol library (`computeBadge`, `buildBadgeFilters`, `filterEventsForPubkey`, `ENTITY_LABELS`, `encodeNpub`)

**Design doc:** `docs/plans/2026-03-05-contact-enrichment-design.md`

---

### Task 1: Extend StoredConnection type and DB migration

**Files:**
- Modify: `app/src/lib/db.ts`

**Step 1: Update StoredConnection interface**

Add `connectionType` and `badge` fields after the existing `method` field (around line 45):

```typescript
export interface CachedBadge {
  tier: number;
  tierLabel: string;
  score: number;
  entityType?: string;
  isVerified: boolean;
  credentialCount: number;
  vouchCount: number;
  fetchedAt: number;
}

export interface StoredConnection {
  pubkey: string;
  sharedSecret: string;
  ownerPubkey: string;
  theirInfo: {
    name?: string;
    mobile?: string;
    email?: string;
    address?: string;
    childPubkeys?: string[];
  };
  ourInfo: {
    name?: string;
    mobile?: string;
    email?: string;
    address?: string;
    childPubkeys?: string[];
  };
  connectedAt: number;
  method: string;
  /** How this contact was added: 'mutual' (QR scan) or 'follow' (pubkey lookup) */
  connectionType: 'mutual' | 'follow';
  /** Cached badge data from relay */
  badge?: CachedBadge;
}
```

**Step 2: Bump DB version and add migration**

Change `DB_VERSION` from 2 to 3. Add migration block inside the `upgrade` function:

```typescript
// v2 → v3: add connectionType to existing connections
if (oldVersion < 3) {
  const connectionsStore = transaction.objectStore('connections');
  connectionsStore.getAll().then((conns: Record<string, unknown>[]) => {
    for (const conn of conns) {
      if (!conn.connectionType) {
        connectionsStore.put({ ...conn, connectionType: 'mutual' });
      }
    }
  });
}
```

**Step 3: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Errors in files that create `StoredConnection` without `connectionType` — fix in subsequent tasks.

**Step 4: Commit**

```bash
git add app/src/lib/db.ts
git commit -m "feat(app): extend StoredConnection with connectionType and cached badge"
```

---

### Task 2: Fix existing connection creation sites

**Files:**
- Modify: `app/src/pages/Scan.tsx` (~line 79)
- Modify: `app/src/hooks/useConnections.ts`

**Step 1: Add connectionType to Scan.tsx connection creation**

In `handleConnect` (around line 79), where the connection object is built, add `connectionType: 'mutual'`:

```typescript
const connection: Omit<StoredConnection, 'ownerPubkey'> = {
  pubkey: scannedPayload.pubkey,
  sharedSecret: secret,
  theirInfo: scannedPayload.info ?? {},
  ourInfo,
  connectedAt: Math.floor(Date.now() / 1000),
  method: 'qr-scan',
  connectionType: 'mutual',
};
```

**Step 2: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean (or only unrelated pre-existing warnings).

**Step 3: Commit**

```bash
git add app/src/pages/Scan.tsx app/src/hooks/useConnections.ts
git commit -m "fix(app): add connectionType to existing connection creation"
```

---

### Task 3: Create badge fetch utility

**Files:**
- Create: `app/src/lib/badge-fetch.ts`

**Step 1: Write the badge fetch function**

This utility fetches badge data for a pubkey from a relay. It uses the protocol library's `buildBadgeFilters()` and `computeBadge()`.

```typescript
import {
  buildBadgeFilters,
  computeBadge,
  type NostrEvent,
} from 'signet-protocol';
import { RelayClient } from 'signet-protocol';
import type { CachedBadge } from './db';

/** Fetch badge data for a pubkey from a relay. Returns null if relay is unreachable. */
export async function fetchBadge(
  pubkey: string,
  relayUrl: string,
  timeoutMs = 10000
): Promise<CachedBadge | null> {
  const relay = new RelayClient(relayUrl, { connectTimeout: timeoutMs });
  try {
    await relay.connect();
    const filters = buildBadgeFilters([pubkey]);
    const events = await relay.fetch(filters);
    const badge = computeBadge(pubkey, events);

    // Extract entity type from credential events
    let entityType: string | undefined;
    for (const event of events) {
      if (event.kind !== 30470) continue;
      const d = event.tags.find(t => t[0] === 'd')?.[1];
      if (d !== pubkey) continue;
      const et = event.tags.find(t => t[0] === 'entity-type')?.[1];
      if (et) { entityType = et; break; }
    }

    return {
      tier: badge.tier,
      tierLabel: badge.tierLabel,
      score: badge.score,
      entityType,
      isVerified: badge.isVerified,
      credentialCount: badge.credentialCount,
      vouchCount: badge.vouchCount,
      fetchedAt: Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  } finally {
    relay.disconnect();
  }
}

/** Fetch badges for multiple pubkeys in a single relay query. */
export async function fetchBadges(
  pubkeys: string[],
  relayUrl: string,
  timeoutMs = 10000
): Promise<Map<string, CachedBadge>> {
  const results = new Map<string, CachedBadge>();
  if (pubkeys.length === 0) return results;

  const relay = new RelayClient(relayUrl, { connectTimeout: timeoutMs });
  try {
    await relay.connect();
    const filters = buildBadgeFilters(pubkeys);
    const events = await relay.fetch(filters);

    for (const pubkey of pubkeys) {
      const badge = computeBadge(pubkey, events);

      let entityType: string | undefined;
      for (const event of events) {
        if (event.kind !== 30470) continue;
        const d = event.tags.find(t => t[0] === 'd')?.[1];
        if (d !== pubkey) continue;
        const et = event.tags.find(t => t[0] === 'entity-type')?.[1];
        if (et) { entityType = et; break; }
      }

      results.set(pubkey, {
        tier: badge.tier,
        tierLabel: badge.tierLabel,
        score: badge.score,
        entityType,
        isVerified: badge.isVerified,
        credentialCount: badge.credentialCount,
        vouchCount: badge.vouchCount,
        fetchedAt: Math.floor(Date.now() / 1000),
      });
    }
  } catch {
    // Relay unreachable — return empty map
  } finally {
    relay.disconnect();
  }
  return results;
}
```

**Step 2: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 3: Commit**

```bash
git add app/src/lib/badge-fetch.ts
git commit -m "feat(app): add badge fetch utility for relay queries"
```

---

### Task 4: Enrich QR scan flow with badge fetch

**Files:**
- Modify: `app/src/pages/Scan.tsx`

**Step 1: Import fetchBadge and add relay URL prop**

Add to Scan.tsx imports:

```typescript
import { fetchBadge } from '../lib/badge-fetch';
```

Update `ScanProps` (or the inline props type) to accept `relayUrl`:

```typescript
interface ScanProps {
  identity: StoredIdentity;
  onConnect: (connection: Omit<StoredConnection, 'ownerPubkey'>) => Promise<void>;
  relayUrl?: string;
}
```

**Step 2: Fetch badge in handleConnect**

In `handleConnect`, after computing the shared secret and before calling `onConnect`, fetch the badge:

```typescript
const handleConnect = async () => {
  if (!scannedPayload) return;
  setConnecting(true);

  const secret = computeSharedSecret(identity.privateKey, scannedPayload.pubkey);
  setSharedSecret(secret);

  // Fetch badge from relay (non-blocking — save even if relay fails)
  let badge: CachedBadge | undefined;
  if (relayUrl) {
    const fetched = await fetchBadge(scannedPayload.pubkey, relayUrl);
    if (fetched) badge = fetched;
  }

  const ourInfo: Record<string, string> = {};
  // ... existing share selection logic ...

  const connection: Omit<StoredConnection, 'ownerPubkey'> = {
    pubkey: scannedPayload.pubkey,
    sharedSecret: secret,
    theirInfo: scannedPayload.info ?? {},
    ourInfo,
    connectedAt: Math.floor(Date.now() / 1000),
    method: 'qr-scan',
    connectionType: 'mutual',
    badge,
  };

  await onConnect(connection);
  setStep('success');
  setConnecting(false);
};
```

**Step 3: Pass relayUrl from App.tsx**

In `app/src/App.tsx`, find where `<Scan>` is rendered and add `relayUrl={preferences.relayUrl}`:

```tsx
<Scan
  identity={activeIdentity}
  onConnect={addConnection}
  relayUrl={preferences.relayUrl}
/>
```

**Step 4: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 5: Commit**

```bash
git add app/src/pages/Scan.tsx app/src/App.tsx
git commit -m "feat(app): fetch badge from relay during QR scan"
```

---

### Task 5: Add Pubkey Lookup page

**Files:**
- Create: `app/src/pages/Follow.tsx`
- Modify: `app/src/App.tsx`

**Step 1: Create Follow page component**

```typescript
import { useState, useCallback } from 'react';
import { ENTITY_LABELS } from '../lib/signet';
import { fetchBadge } from '../lib/badge-fetch';
import type { StoredConnection, StoredIdentity, CachedBadge } from '../lib/db';

interface FollowProps {
  identity: StoredIdentity;
  onConnect: (connection: Omit<StoredConnection, 'ownerPubkey'>) => Promise<void>;
  onBack: () => void;
  relayUrl?: string;
}

type Step = 'input' | 'preview' | 'success';

function isValidHexPubkey(s: string): boolean {
  return /^[0-9a-f]{64}$/i.test(s);
}

export function Follow({ identity, onConnect, onBack, relayUrl }: FollowProps) {
  const [step, setStep] = useState<Step>('input');
  const [pubkeyInput, setPubkeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [badge, setBadge] = useState<CachedBadge | null>(null);
  const [resolvedPubkey, setResolvedPubkey] = useState('');

  const handleLookup = useCallback(async () => {
    const trimmed = pubkeyInput.trim();
    let hex = trimmed;

    // Handle npub format
    if (trimmed.startsWith('npub')) {
      try {
        const { decodeNpub } = await import('../lib/signet');
        hex = decodeNpub(trimmed);
      } catch {
        setError('Invalid npub format');
        return;
      }
    }

    if (!isValidHexPubkey(hex)) {
      setError('Enter a valid 64-character hex pubkey or npub');
      return;
    }

    if (hex === identity.publicKey) {
      setError("That's your own pubkey");
      return;
    }

    setError('');
    setLoading(true);
    setResolvedPubkey(hex);

    if (relayUrl) {
      const fetched = await fetchBadge(hex, relayUrl);
      setBadge(fetched);
    }

    setStep('preview');
    setLoading(false);
  }, [pubkeyInput, relayUrl, identity.publicKey]);

  const handleFollow = useCallback(async () => {
    setLoading(true);
    const connection: Omit<StoredConnection, 'ownerPubkey'> = {
      pubkey: resolvedPubkey,
      sharedSecret: '',
      theirInfo: {},
      ourInfo: {},
      connectedAt: Math.floor(Date.now() / 1000),
      method: 'pubkey-lookup',
      connectionType: 'follow',
      badge: badge ?? undefined,
    };
    await onConnect(connection);
    setStep('success');
    setLoading(false);
  }, [resolvedPubkey, badge, onConnect]);

  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h2 style={{ marginBottom: 8 }}>Following</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          {resolvedPubkey.slice(0, 8)}...{resolvedPubkey.slice(-8)}
        </p>
        <button className="btn btn-primary" onClick={onBack} style={{ width: '100%', maxWidth: 320 }}>
          Done
        </button>
      </div>
    );
  }

  if (step === 'preview') {
    const truncated = resolvedPubkey.slice(0, 8) + '...' + resolvedPubkey.slice(-8);
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        <button
          onClick={() => setStep('input')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: 16, padding: 0 }}
        >
          &larr; Back
        </button>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {truncated}
          </div>

          {badge ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tier</span>
                <span style={{ fontWeight: 600 }}>{badge.tierLabel} ({badge.tier})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Signet IQ</span>
                <span style={{ fontWeight: 600 }}>{badge.score}</span>
              </div>
              {badge.entityType && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Entity type</span>
                  <span style={{ fontWeight: 600 }}>
                    {ENTITY_LABELS[badge.entityType as keyof typeof ENTITY_LABELS] ?? badge.entityType}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Credentials</span>
                <span>{badge.credentialCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vouches</span>
                <span>{badge.vouchCount}</span>
              </div>
              {!badge.isVerified && badge.vouchCount === 0 && (
                <div style={{ color: 'var(--warning)', fontSize: 13, marginTop: 4 }}>
                  No credentials or vouches found on relay
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {relayUrl ? 'No badge data found on relay' : 'No relay configured — badge data unavailable'}
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleFollow}
          disabled={loading}
          style={{ width: '100%', minHeight: 48 }}
        >
          {loading ? 'Following...' : 'Follow'}
        </button>
      </div>
    );
  }

  // step === 'input'
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: 16, padding: 0 }}
      >
        &larr; Back
      </button>

      <h2 style={{ marginBottom: 8 }}>Follow a pubkey</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        Enter an npub or hex pubkey to follow someone publicly. No mutual exchange needed.
      </p>

      <textarea
        value={pubkeyInput}
        onChange={(e) => { setPubkeyInput(e.target.value); setError(''); }}
        placeholder="npub1... or 64-char hex"
        rows={3}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
          fontSize: 13,
          resize: 'none',
          marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleLookup}
        disabled={loading || !pubkeyInput.trim()}
        style={{ width: '100%', minHeight: 48 }}
      >
        {loading ? 'Looking up...' : 'Look up'}
      </button>
    </div>
  );
}
```

**Step 2: Add route in App.tsx**

Add `'follow'` to the page routing. In the `renderPage()` switch, add a case:

```tsx
case 'follow':
  return (
    <Follow
      identity={activeIdentity}
      onConnect={addConnection}
      onBack={() => setActivePage('connections')}
      relayUrl={preferences.relayUrl}
    />
  );
```

Add the import at the top of App.tsx:

```typescript
import { Follow } from './pages/Follow';
```

**Step 3: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 4: Commit**

```bash
git add app/src/pages/Follow.tsx app/src/App.tsx
git commit -m "feat(app): add pubkey lookup/follow page"
```

---

### Task 6: Add "Follow" button to Connections page

**Files:**
- Modify: `app/src/pages/Connections.tsx`
- Modify: `app/src/App.tsx`

**Step 1: Add onFollow prop and button to Connections.tsx**

Update props to accept `onFollow`:

```typescript
interface ConnectionsProps {
  connections: StoredConnection[];
  onSelectContact: (pubkey: string) => void;
  onFollow: () => void;
}
```

Add a "Follow" button in the header area (after the search bar, before the list):

```tsx
<button
  className="btn btn-secondary"
  onClick={onFollow}
  style={{ width: '100%', marginBottom: 16, minHeight: 44 }}
>
  + Follow a pubkey
</button>
```

**Step 2: Pass onFollow from App.tsx**

Where `<Connections>` is rendered, add:

```tsx
<Connections
  connections={connections}
  onSelectContact={(pubkey) => setSelectedContact(pubkey)}
  onFollow={() => setActivePage('follow')}
/>
```

**Step 3: Enrich connection rows with badge data**

In the connection card rendering loop in Connections.tsx, show tier and score if badge data exists:

```tsx
{conn.badge && (
  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
    {conn.badge.tierLabel} · IQ {conn.badge.score}
    {conn.badge.entityType && ` · ${ENTITY_LABELS[conn.badge.entityType as keyof typeof ENTITY_LABELS] ?? ''}`}
  </span>
)}
{conn.connectionType === 'mutual' && (
  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>IN-PERSON</span>
)}
```

Add the import for `ENTITY_LABELS` from `'../lib/signet'`.

**Step 4: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 5: Commit**

```bash
git add app/src/pages/Connections.tsx app/src/App.tsx
git commit -m "feat(app): add follow button and badge display in connections list"
```

---

### Task 7: Update ContactDetail with badge section

**Files:**
- Modify: `app/src/pages/ContactDetail.tsx`

**Step 1: Add badge display section**

Import `SignetIQ` and `ENTITY_LABELS`:

```typescript
import { SignetIQ } from '../components/SignetIQ';
import { ENTITY_LABELS } from '../lib/signet';
```

Add a "Signet Badge" section after the header, before "Their Information". Build a minimal `TrustScoreBreakdown` from the cached badge for the `SignetIQ` component:

```tsx
{/* Signet Badge */}
{connection.badge && (
  <div className="card" style={{ marginBottom: 16 }}>
    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 600, fontSize: 14 }}>
        {connection.badge.tierLabel}
        {connection.badge.entityType && (
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
            {ENTITY_LABELS[connection.badge.entityType as keyof typeof ENTITY_LABELS] ?? connection.badge.entityType}
          </span>
        )}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Tier {connection.badge.tier}
      </span>
    </div>
    <SignetIQ
      breakdown={{
        score: connection.badge.score,
        tier: connection.badge.tier as 1 | 2 | 3 | 4,
        professionalVerifications: 0,
        inPersonVouches: 0,
        onlineVouches: connection.badge.vouchCount,
        accountAgeDays: 0,
        signals: [],
      }}
      showBreakdown={false}
    />
    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
      <span>Credentials: {connection.badge.credentialCount} · Vouches: {connection.badge.vouchCount}</span>
      <span>Updated {timeAgo(connection.badge.fetchedAt)}</span>
    </div>
  </div>
)}
```

**Step 2: Make Signet Words conditional on mutual connections**

Wrap the existing Signet Words section with a check:

```tsx
{connection.connectionType !== 'follow' && connection.sharedSecret && (
  // existing SignetWords section
)}
```

**Step 3: Add timeAgo helper if not already available**

If `ContactDetail.tsx` doesn't have `timeAgo`, import it from `Connections.tsx` or define it locally. It's already defined in `Connections.tsx` — extract it to a shared utility if needed, or duplicate the small helper inline.

**Step 4: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 5: Commit**

```bash
git add app/src/pages/ContactDetail.tsx
git commit -m "feat(app): show badge data in contact detail, conditional Signet Words"
```

---

### Task 8: Add badge refresh hook

**Files:**
- Create: `app/src/hooks/useBadgeRefresh.ts`
- Modify: `app/src/App.tsx`

**Step 1: Create the hook**

```typescript
import { useCallback } from 'react';
import { fetchBadge } from '../lib/badge-fetch';
import { getConnection, saveConnection } from '../lib/db';

const STALE_THRESHOLD = 3600; // 1 hour in seconds

/** Refresh badge data for a contact if stale. Returns updated badge or null. */
export function useBadgeRefresh(relayUrl?: string) {
  const refreshBadge = useCallback(async (pubkey: string) => {
    if (!relayUrl) return null;

    const connection = await getConnection(pubkey);
    if (!connection) return null;

    // Skip if fresh
    const now = Math.floor(Date.now() / 1000);
    if (connection.badge && (now - connection.badge.fetchedAt) < STALE_THRESHOLD) {
      return connection.badge;
    }

    const badge = await fetchBadge(pubkey, relayUrl);
    if (badge) {
      await saveConnection({ ...connection, badge });
    }
    return badge;
  }, [relayUrl]);

  return { refreshBadge };
}
```

**Step 2: Wire into ContactDetail via App.tsx**

In App.tsx, import the hook and pass `refreshBadge` to ContactDetail:

```typescript
const { refreshBadge } = useBadgeRefresh(preferences.relayUrl);
```

Pass it as a prop to ContactDetail. In ContactDetail, call `refreshBadge(connection.pubkey)` on mount via `useEffect` to auto-refresh stale badges.

**Step 3: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 4: Commit**

```bash
git add app/src/hooks/useBadgeRefresh.ts app/src/App.tsx app/src/pages/ContactDetail.tsx
git commit -m "feat(app): add badge refresh hook with staleness check"
```

---

### Task 9: Add decodeNpub to app signet wrapper

**Files:**
- Modify: `app/src/lib/signet.ts`

**Step 1: Check if decodeNpub is already exported**

Check if `decodeNpub` is in the import/export lists in `app/src/lib/signet.ts`. If not, add it to both the import from `signet-protocol` and the re-export block. The protocol library exports `decodeNpub` from `src/nsec.ts` via `src/index.ts`.

**Step 2: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 3: Commit**

```bash
git add app/src/lib/signet.ts
git commit -m "feat(app): re-export decodeNpub for pubkey lookup"
```

---

### Task 10: Final verification

**Step 1: Run protocol tests**

Run: `node node_modules/vitest/vitest.mjs run`
Expected: All 504 tests pass.

**Step 2: Run protocol typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 3: Run app typecheck**

Run: `cd app && node node_modules/typescript/bin/tsc --noEmit`
Expected: Clean.

**Step 4: Manual smoke test (if dev server available)**

- Start app: `cd app && npm run dev`
- Verify Connections page shows "Follow a pubkey" button
- Verify existing QR scan flow still works
- Verify contact detail shows badge section for contacts with badge data
- Verify Signet Words section only appears for mutual connections

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "feat(app): contact enrichment - complete"
```
