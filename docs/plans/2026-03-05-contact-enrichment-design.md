# Contact Enrichment Design

**Date:** 2026-03-05
**Status:** Approved

## Problem

The Signet reference app treats every contact identically: a bilateral QR scan that produces an ECDH shared secret. This works for private, in-person connections but fails for two common cases:

1. **Public persons** (politicians, doctors, public figures) — thousands of people need to verify them without individual QR exchanges.
2. **Public personas** (anonymous aliases operating publicly) — discoverable and verifiable, but no one knows who they are.

The protocol already supports both cases — credentials, vouches, badges, and entity types are public events on relays. The app simply doesn't fetch or display this data.

## Design Decisions

1. **Two entry points, one contact list.** QR scan (mutual, in-person) and pubkey lookup (one-way, public) both create contacts in a single unified list. This avoids cognitive overhead of managing separate lists.

2. **Enrich on connect.** When a contact is added (either way), the app fetches their public Signet data from a relay and caches it locally. This means every contact shows tier, Signet IQ, entity type, and vouch count — not just a pubkey and name.

3. **Cache locally, refresh opportunistically.** Badge data is stored in IndexedDB alongside the contact. The app works offline with last-known data. A `fetchedAt` timestamp tracks staleness. Refresh happens on contact detail view or periodically in background.

4. **Visual distinction by connection type.** Mutual connections (QR scan) show a "verified in-person" indicator and have Signet Words available. Public follows show badge data but no Signet Words (no shared secret). Both appear in the same list.

5. **No custom server.** All data comes from standard Nostr relay queries using `buildBadgeFilters()`. Badge computation runs client-side via `computeBadge()`. Scales globally without centralised infrastructure.

## Data Model Changes

### StoredConnection (app/src/lib/db.ts)

Add two fields:

```typescript
export interface StoredConnection {
  // ... existing fields ...

  /** How this contact was added */
  connectionType: 'mutual' | 'follow';

  /** Cached badge data from relay */
  badge?: {
    tier: SignetTier;
    tierLabel: string;
    score: number;
    entityType?: EntityType;
    isVerified: boolean;
    credentialCount: number;
    vouchCount: number;
    fetchedAt: number; // unix timestamp of last relay fetch
  };
}
```

- `connectionType: 'mutual'` — QR-scanned, has `sharedSecret`
- `connectionType: 'follow'` — pubkey lookup, `sharedSecret` is empty string

Existing connections (pre-migration) default to `connectionType: 'mutual'` and `badge: undefined`.

### DB Migration

IndexedDB version bump (v2 → v3). Migration sets `connectionType: 'mutual'` on all existing connections.

## Entry Points

### 1. QR Scan (existing flow, enriched)

Current flow unchanged up to the "save connection" step. Before saving:

1. Parse QR → extract pubkey + contact info
2. Compute ECDH shared secret
3. **New:** Fetch badge from relay using `buildBadgeFilters([pubkey])`
4. **New:** Compute badge via `computeBadge(pubkey, events)`
5. **New:** Extract entity type from credential events (if present)
6. Save connection with `connectionType: 'mutual'` and cached `badge`

If relay is unreachable, save without badge data — it will be fetched later.

### 2. Pubkey Lookup (new flow)

New "Add" button on the Connections page, or paste/scan from a share link:

1. User enters npub (bech32) or hex pubkey, or scans a QR
2. App validates the pubkey format
3. App fetches badge from relay using `buildBadgeFilters([pubkey])`
4. App computes badge via `computeBadge(pubkey, events)`
5. Preview screen shows: pubkey, badge tier, Signet IQ, entity type, vouch count
6. User taps "Follow" to save
7. Save connection with `connectionType: 'follow'`, empty `sharedSecret`, empty `ourInfo`/`theirInfo`

No shared secret, no Signet Words, no mutual info exchange. This is a one-way public follow.

## Connections List UI

Single list, sorted by recency. Each row shows:

```
[Avatar] Name or npub              [Tier Badge] [IQ score]
         Entity type · Connected 2d ago   [in-person indicator if mutual]
```

- **Name**: from `theirInfo.name` if available, otherwise truncated npub
- **Tier Badge**: existing `TierBadge` component (checkmarks)
- **Signet IQ**: numeric score from cached badge
- **Entity type**: "Person", "Alias", "Organisation", etc. from `ENTITY_LABELS`
- **In-person indicator**: small icon/tag for `connectionType: 'mutual'`

Contacts without badge data (offline add, relay unreachable) show "—" for tier/score until refreshed.

## Contact Detail UI

Existing layout with additions:

```
├─ Name + Entity Type badge
├─ Section: "Signet Badge"
│  ├─ Tier badge + tier label
│  ├─ Signet IQ score bar (SignetIQ component)
│  ├─ Credentials: N · Vouches: N
│  └─ Last verified: relative time from fetchedAt
│      └─ "Refresh" button
├─ Section: "Signet Words" (only if connectionType === 'mutual')
│  ├─ Current 3-word phrase
│  ├─ Progress bar
│  └─ "Verify words read to me" button
├─ Section: "Their Information" (only if theirInfo has data)
├─ Section: "Information You Shared" (only if ourInfo has data)
├─ Section: "Public Key"
├─ Button: "Vouch for [Name]"
└─ Button: "Remove"
```

## Badge Refresh Strategy

- **On contact detail view**: if `fetchedAt` is older than 1 hour, auto-refresh from relay
- **On app foreground**: refresh badges for contacts viewed in the last 24 hours
- **Manual**: "Refresh" button on contact detail
- **On QR scan**: always fetch fresh (part of the add flow)
- **Batch queries**: use `buildBadgeFilters()` with multiple pubkeys to reduce relay round-trips

## Relay Configuration

The app needs a relay URL to fetch badge data. Currently `StoredPreferences` has an optional `relayUrl` field. This is sufficient — the app uses it when available, degrades gracefully when not configured or unreachable.

## Protocol Library Usage

No protocol changes needed. The app uses existing exports:

| Function | Purpose |
|---|---|
| `buildBadgeFilters(pubkeys)` | Build Nostr REQ filters for credential/vouch events |
| `computeBadge(pubkey, events)` | Compute tier, score, verification status from events |
| `filterEventsForPubkey(pubkey, events)` | Filter mixed event arrays |
| `ENTITY_LABELS` | Map entity type codes to display labels |
| `encodeNpub(hex)` / `decodeNpub(npub)` | Bech32 encoding for pubkey input |

## Migration Path

1. DB version bump with `connectionType` default
2. Existing contacts continue working — badge data is undefined until first refresh
3. No breaking changes to the Scan flow — enrichment is additive
4. Pubkey lookup is a new page/route

## What This Does NOT Cover

- **Relay discovery**: assumes a single configured relay URL. Multi-relay fanout is a future concern.
- **Contact info updates**: if a public person changes their name, the app won't auto-update `theirInfo` (only badge data refreshes). This is intentional — `theirInfo` comes from the QR exchange, not from relays.
- **Nostr profile (kind 0)**: the app does not fetch NIP-01 profile metadata (display name, avatar). This could be added later but is out of scope — Signet is about verification, not social profiles.
- **Push notifications**: no alert when a contact's tier changes. Passive refresh only.
