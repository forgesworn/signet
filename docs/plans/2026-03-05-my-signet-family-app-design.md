# My Signet — Family App Design

> A hyper-simple, production-ready app for families to create identities, verify each other, and communicate with confidence that they are not talking to a deepfake.

## Design Philosophy

**Steve Jobs' black polo shirt.** Every screen earns its place. Every element earns its pixel. If a feature needs explaining, it needs redesigning. A parent at school pickup who's told "download My Signet" should be onboarded in under 2 minutes with zero technical knowledge.

**Two brand seeds:**
- **"My Signet"** (noun) — the app name, the identity, the thing you have
- **"Signet Me"** (verb) — the verification action, the thing you do

Both appear naturally in the UX. Whichever catches in conversation wins. The app supports both.

---

## Architecture

### Approach: Separate app in monorepo

```
Signet/
├── src/          — Protocol library (shared SDK)
├── app/          — Developer reference app (renamed "Signet Developer Toolkit")
├── family-app/   — My Signet family app (this design)
├── spec/         — Protocol specification
└── ...
```

**Why separate, not a mode toggle:**
- You cannot simplify by hiding complexity. You simplify by removing it.
- The protocol library (`signet-protocol`) IS the shared layer — no component library needed
- Independent deployment, independent UX decisions, independent release cadence
- A parent should never accidentally see a "Verifier Challenge" screen

### Tech Stack

- React 19 + TypeScript (same as dev app)
- Vite 6 (same build tooling)
- IndexedDB via `idb` (local-first, no server)
- `signet-protocol` imported via path alias
- PWA-ready (service worker, manifest, offline support)
- CSS custom properties (fresh design system, not inherited from dev app)
- Port: 5175 (next available after dev app on 5174)

### Key Principle: Local-First

All data lives on the device. No relay required for core functionality. The app works offline, in airplane mode, in areas with no connectivity. Relay sync is a future enhancement, not a dependency.

---

## Information Architecture

### Three and a half screens

```
┌──────────────────────────────────┐
│                                  │
│   ┌──────┐  ┌──────┐  ┌──────┐  │
│   │  My  │  │  My  │  │      │  │
│   │Signet│  │Family│  │ [+]  │  │
│   │      │  │      │  │      │  │
│   └──────┘  └──────┘  └──────┘  │
│                                  │
│   Bottom nav (3 tabs)            │
│                                  │
└──────────────────────────────────┘

Plus: Settings (gear icon in header, not a tab)
```

1. **My Signet** (home) — Your identity card. QR code. Trust status. "This is me."
2. **My Family** — People you've verified. Their trust status. "These are my people."
3. **Add (+)** — Scan QR or show yours. The "Signet Me" action. Center-prominent.
4. **Settings** (gear, header) — Recovery phrase, theme, export/delete. Tucked away.

### Why only 3 tabs

Four is the most tabs a normie will tolerate. Three is better. The center "+" is the call to action — it's what you tap when someone says "Signet me."

---

## Screen-by-Screen Design

### 0. First Launch — Onboarding

**Two paths. No jargon.**

```
┌────────────────────────────┐
│                            │
│      Welcome to Signet     │
│                            │
│   Your digital identity,   │
│   owned by you.            │
│                            │
│  ┌──────────────────────┐  │
│  │   Create My Signet   │  │  ← Primary action (95% of users)
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  I have a recovery   │  │  ← Import existing identity
│  │       phrase         │  │
│  └──────────────────────┘  │
│                            │
└────────────────────────────┘
```

**"Create My Signet" flow (3 steps):**

1. **Your name** — "What should people call you?" Single text field. This is a display name, not a legal name. They can change it later.

2. **Your recovery phrase** — Show 12 words. Simple language:
   > "These 12 words are your recovery phrase. Write them down and keep them safe. If you lose your phone, these words are the only way to get your Signet back. Never share them with anyone."

   Two buttons: "I've written them down" (proceeds) / "Copy to clipboard" (secondary).

   No "verify 3 random words" step — that's a developer pattern. A parent will write them down or won't. Nagging doesn't help.

3. **Are you setting this up for a child?** — Toggle. If yes:
   > "Enter your Signet ID so we can link this account to yours."

   QR scan or paste parent's public key. This creates the guardian link.

**Done.** Three taps to an identity. Home screen appears.

**"I have a recovery phrase" flow:**

1. Enter 12 words (grid input, autocomplete from BIP-39 wordlist)
2. Name entry
3. Done. Identity restored.

### 1. My Signet (Home)

```
┌────────────────────────────────────┐
│  My Signet                    ⚙️   │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │         ┌─────────┐         │  │
│  │         │         │         │  │
│  │         │  QR     │         │  │
│  │         │  CODE   │         │  │
│  │         │         │         │  │
│  │         └─────────┘         │  │
│  │                              │  │
│  │      Sarah Johnson           │  │
│  │      Verified Person ✓       │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Signet IQ: █████████░░ 144   │  │
│  │  Family: 4 members verified  │  │
│  │  Since: March 2026           │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🔑 Your Signet ID          │  │
│  │  npub1abc...xyz              │  │
│  │  [Copy]  [Share]             │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌────┐     ┌────┐     ┌────┐     │
│  │Home│     │Fam │     │ +  │     │
│  │ •  │     │    │     │    │     │
│  └────┘     └────┘     └────┘     │
└────────────────────────────────────┘
```

**Elements:**
- **QR Code** — Large, scannable. This IS your Signet. Tap to enlarge fullscreen.
- **Name + verification status** — Simple label. "Verified Person ✓" or "Unverified" or "Child Account".
- **Trust summary card** — Score bar + family count + account age. No breakdown, no signals, no jargon.
- **Signet ID** — Your public key in npub format. Copy/share buttons.
- **If child account** — Shows "Linked to: [Parent name]" instead of Signet IQ.

### 2. My Family

```
┌────────────────────────────────────┐
│  My Family                   ⚙️    │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  👤 Mum (Sarah)         ✓✓  │  │
│  │  Verified 14 Feb 2026        │  │
│  ├──────────────────────────────┤  │
│  │  👤 Dad (James)         ✓✓  │  │
│  │  Verified 14 Feb 2026        │  │
│  ├──────────────────────────────┤  │
│  │  👤 Emily (child)        ✓  │  │
│  │  Verified 1 Mar 2026         │  │
│  ├──────────────────────────────┤  │
│  │  👤 Gran (Margaret)     ✓✓  │  │
│  │  Verified 20 Feb 2026        │  │
│  └──────────────────────────────┘  │
│                                    │
│  "Signet Me" is how you know      │
│  it's really them, not a           │
│  deepfake.                         │
│                                    │
│  ┌────┐     ┌────┐     ┌────┐     │
│  │Home│     │Fam │     │ +  │     │
│  │    │     │ •  │     │    │     │
│  └────┘     └────┘     └────┘     │
└────────────────────────────────────┘
```

**Tap a family member → Detail screen:**

```
┌────────────────────────────────────┐
│  ← Mum (Sarah)                     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Signet IQ: █████████░░ 144   │  │
│  │  Tier 3 — Verified Person    │  │
│  │  Connected: 14 Feb 2026      │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Signet Me                   │  │
│  │                              │  │
│  │  Ask them to read these      │  │
│  │  words aloud:                │  │
│  │                              │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ │  │
│  │  │ocean │ │brave │ │maple │ │  │
│  │  └──────┘ └──────┘ └──────┘ │  │
│  │                              │  │
│  │  Words refresh in 24s        │  │
│  │                              │  │
│  │  [Verify Their Words]        │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  [Vouch for Mum]             │  │  ← Issue a peer vouch
│  └──────────────────────────────┘  │
│                                    │
│  [Remove from Family]              │
│                                    │
└────────────────────────────────────┘
```

**The "Signet Me" section is the anti-deepfake moment.** On a video call with mum, you see her words. She reads them. They match. It's really her. This is the core value proposition for families.

**"Verify Their Words"** — Tap to enter the 3 words they read to you. If they match, confirmation animation. If not, warning: "Words don't match. This might not be who they claim to be."

### 3. Add (+) — The Signet Me Flow

```
┌────────────────────────────────────┐
│  Signet Someone                    │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │  In person?                  │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  Scan Their QR Code   │  │  │
│  │  └────────────────────────┘  │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  Show My QR Code      │  │  │
│  │  └────────────────────────┘  │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │  Remote? (phone/video call)  │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  Enter Their Signet ID│  │  │
│  │  └────────────────────────┘  │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

**In-person flow (QR):**
1. Scan their QR → See their name → "Add to Family?" → Yes
2. Show Signet Me words for voice verification
3. Connected. They appear in My Family.

**Remote flow (ID entry):**
1. They share their Signet ID (npub or hex) via text/email/whatever
2. Enter it → See their name → "Add to Family?" → Yes
3. Signet Me words appear for phone/video verification
4. Connected.

**After adding, the Signet Me words are always available** on the family member detail screen for any future video call where you want to confirm identity.

### 4. Settings (Gear Icon)

```
┌────────────────────────────────────┐
│  ← Settings                        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  My Name                     │  │
│  │  Sarah Johnson          [>]  │  │
│  ├──────────────────────────────┤  │
│  │  Recovery Phrase             │  │
│  │  View your 12 words     [>]  │  │
│  ├──────────────────────────────┤  │
│  │  Appearance                  │  │
│  │  System / Light / Dark  [>]  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Child Accounts              │  │
│  │  Manage linked children [>]  │  │  ← Only shows for parents
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Export My Signet            │  │
│  │  Take your identity to      │  │
│  │  another app            [>]  │  │
│  ├──────────────────────────────┤  │
│  │  Delete My Signet            │  │
│  │  Remove everything      [>]  │  │  ← Red, with confirmation
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  About Signet                │  │
│  │  Version 1.0 • Open source  │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

**Child Account Management** (for parents):

```
┌────────────────────────────────────┐
│  ← Child Accounts                   │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Emily                       │  │
│  │  Age range: 8-12             │  │
│  │                              │  │
│  │  Contacts: Family only  [v]  │  │
│  │                              │  │
│  │  [View Emily's Signet]       │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  [+ Add Child Account]      │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

**Contact policy for children** (simplified from dev app):
- **Family only** — Can only connect with people parent has verified
- **Approved contacts** — Parent must approve each new connection
- **Open** — Anyone (not recommended for under-13s)

These settings MUST persist to IndexedDB (fixing the bug in the dev app where guardian settings are lost on refresh).

---

## Data Model

### StoredIdentity (simplified from dev app)

```typescript
interface FamilyIdentity {
  id: string;                    // pubkey (primary key)
  publicKey: string;             // hex
  privateKey: string;            // hex (encrypted at rest in future)
  mnemonic: string;              // 12 words (always present, no nsec import)
  displayName: string;
  isChild: boolean;
  guardianPubkey?: string;       // parent's pubkey if child
  ageRange?: string;             // from verification, if any
  createdAt: number;             // unix timestamp
}
```

### StoredFamilyMember (replaces StoredConnection)

```typescript
interface FamilyMember {
  pubkey: string;                // their pubkey (primary key)
  ownerPubkey: string;           // which of our accounts owns this
  displayName: string;
  sharedSecret: string;          // for Signet Me words (ECDH)
  verifiedAt: number;            // when we verified them
  relationship?: string;         // optional: 'parent' | 'child' | 'sibling' | 'grandparent' | 'other'
  isChild?: boolean;             // whether they're a child account
}
```

### ChildSettings (persisted — fixing dev app gap)

```typescript
interface ChildSettings {
  childPubkey: string;           // primary key
  guardianPubkey: string;
  contactPolicy: 'family-only' | 'approved' | 'open';
  approvedContacts?: string[];   // pubkeys of approved non-family contacts
}
```

### IndexedDB Schema

```
Database: 'my-signet' (version 1)
├── identity        — FamilyIdentity records (by pubkey)
├── family          — FamilyMember records (by pubkey, indexed by ownerPubkey)
├── child-settings  — ChildSettings records (by childPubkey)
└── preferences     — Key-value store (theme, activeAccountId)
```

---

## Key UX Decisions

### 1. No relay dependency at launch

The app works entirely offline. Family verification is peer-to-peer (QR + shared secret). Signet IQ is computed locally from what the app knows. Relay integration can come later for cross-device sync and credential publication.

### 2. No nsec import

The dev app supports nsec import for Nostr power users. The family app only supports mnemonic creation and import. One path in, one path out. Less confusion.

### 3. No entity types, no tiers in the UI

The protocol has 9 entity types and 4 tiers. The family app uses these internally but never shows them in the UI. Instead:
- "Verified Person" or "Unverified" (maps to tier >= 2 vs tier 1)
- "Child Account" (maps to isChild flag)
- Signet IQ shown as a simple bar

### 4. "Signet Me" words are always visible

On every family member detail screen, the Signet Me words are prominently displayed. This is not a hidden feature — it's the app's reason for existence. "Are you really mum? Read me the words."

### 5. Recovery phrase shown simply

No "verify by entering word 4, 7, and 11." Just show the 12 words, give a copy button, and a clear warning. Trust the user to write them down.

### 6. Progressive trust

A freshly created account with no verifications shows "Unverified" — but that's fine. As they verify family members and receive vouches, trust grows. The app doesn't shame unverified users, it invites them to build trust.

### 7. Export means portability

"Export My Signet" gives the user their recovery phrase + a JSON bundle of their family connections. They can take this to any other Signet-compatible app. The keys might be used forever, or might be burnt when they onboard through a new social platform that creates fresh keys and bridges via kind 30476.

---

## File Structure

```
family-app/
├── public/
│   ├── manifest.json          — PWA manifest
│   ├── favicon.svg            — Signet icon
│   └── service-worker.js      — Offline support
├── cert/                      — Self-signed cert (dev only)
├── src/
│   ├── main.tsx               — Entry point
│   ├── App.tsx                — Router (4 routes)
│   ├── pages/
│   │   ├── Onboarding.tsx     — Create/import identity
│   │   ├── Home.tsx           — My Signet (identity card)
│   │   ├── Family.tsx         — My Family (member list)
│   │   ├── FamilyMember.tsx   — Member detail + Signet Me
│   │   ├── AddMember.tsx      — Scan QR / enter ID
│   │   ├── Settings.tsx       — Preferences + export/delete
│   │   └── ChildSettings.tsx  — Parent's child management
│   ├── components/
│   │   ├── BottomNav.tsx      — 3-tab navigation
│   │   ├── QRCode.tsx         — QR display (reuse from dev app)
│   │   ├── QRScanner.tsx      — Camera QR scanner
│   │   ├── SignetWords.tsx    — Word display + verification
│   │   ├── TrustBar.tsx       — Simple trust percentage bar
│   │   ├── StatusBadge.tsx    — Verified/Unverified/Child badge
│   │   ├── WordInput.tsx      — 3-word entry for verification
│   │   └── Layout.tsx         — App shell + header
│   ├── hooks/
│   │   ├── useIdentity.ts     — Identity CRUD (simplified)
│   │   ├── useFamily.ts       — Family member management
│   │   ├── useSignetWords.ts  — Signet Me word derivation
│   │   ├── useCamera.ts       — Camera permission state
│   │   └── usePreferences.ts  — Theme + settings
│   ├── lib/
│   │   ├── db.ts              — IndexedDB schema + helpers
│   │   └── signet.ts          — Protocol library wrapper
│   ├── styles/
│   │   └── global.css         — Design system (CSS custom properties)
│   └── types.ts               — App-specific types
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

---

## Design System

### Colours (CSS custom properties)

```css
/* Light theme */
--bg-primary: #FFFFFF;
--bg-card: #F8F9FA;
--text-primary: #1A1A2E;
--text-secondary: #6B7280;
--accent: #2563EB;            /* Signet blue */
--accent-light: #DBEAFE;
--success: #059669;
--warning: #D97706;
--danger: #DC2626;
--border: #E5E7EB;

/* Dark theme */
--bg-primary: #0F172A;
--bg-card: #1E293B;
--text-primary: #F1F5F9;
--text-secondary: #94A3B8;
--accent: #3B82F6;
--accent-light: #1E3A5F;
```

### Typography

- **Headings:** System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- **Body:** Same stack, 16px base (accessibility minimum)
- **Signet Words:** Monospace, 24px, letter-spacing: 0.05em (must be highly readable on video calls)

### Spacing

- 8px grid throughout
- Card padding: 16px
- Section gaps: 24px
- Bottom nav height: 64px

### Animation

- Page transitions: 200ms ease
- Success confirmation: checkmark animation (300ms)
- Word refresh: subtle fade (150ms)
- No gratuitous animation. Every motion communicates state change.

---

## What This App Does NOT Do

- **No relay/Nostr infrastructure** — local-first, relay is a future enhancement
- **No credential issuance** — that's the dev app / verifier toolkit
- **No ring signatures** — professional privacy features aren't needed for families
- **No Merkle trees** — selective disclosure is for professional verification
- **No policy management** — communities set policies, families don't
- **No identity bridges** — future feature when bridging to social platforms
- **No voting** — civic extension, not family use case
- **No anomaly detection** — verifier network concern, not family concern
- **No multi-language** — English first, i18n is a fast-follow

---

## Relationship to Dev App

| Aspect | Dev App (`app/`) | Family App (`family-app/`) |
|--------|-----------------|---------------------------|
| Name | Signet Developer Toolkit | My Signet |
| Audience | Developers, verifiers, protocol explorers | Families, normal people |
| Screens | 10+ pages | 4 screens |
| Features | Full protocol (all 11 event kinds) | Identity + family verification + Signet Me |
| Complexity | Every knob exposed | Complexity hidden behind simplicity |
| Crypto shown | Tiers, entities, Merkle proofs, ring sigs | "Verified" / "Unverified" + Signet IQ |
| Relay | Not required (local-first) | Not required (local-first) |
| Port | 5174 | 5175 |

Both import the same `signet-protocol` library. The family app uses maybe 20% of the protocol's surface area, but that 20% is the part that matters to 80% of people.

---

## Success Criteria

1. A non-technical parent can onboard in under 2 minutes
2. A family of 4 can all verify each other within 10 minutes
3. On a video call, "Signet Me" word verification takes under 30 seconds
4. The app works with zero internet connectivity after initial download
5. A user can export their identity and import it into another Signet-compatible app
6. Child account settings persist across app restarts
7. The app feels like a polished product, not a developer demo
