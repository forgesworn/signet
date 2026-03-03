# Signet Reference App — Design Document

**Date:** 2026-03-03
**Status:** Approved

## Overview

A mobile-first web app that demonstrates the Signet protocol end-to-end. Single app for three user types: adults, children, and professional verifiers. Runs locally over HTTPS on port 5174 with a self-signed certificate.

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **signet-protocol** — imported from local `../src` path
- **IndexedDB** — all data persists on-device, never leaves the browser
- **Self-signed HTTPS** — required for camera access (QR scanning) on mobile
- **CSS custom properties** — adaptive dark/light theming via `prefers-color-scheme` + manual override
- **No backend** — entirely client-side

## User Roles

All three roles share one app. Role selected during onboarding, changeable in settings.

| Role | Account creation | Unique features |
|------|-----------------|-----------------|
| **Adult** | Creates own 12-word mnemonic | Full app: connections, signet words, vouching, backup |
| **Child** | Parent creates via child account derivation (BIP-32 child index) | Simplified view: profile, see connections, signet words. No key management. |
| **Verifier** | Adult who activates verifier mode in settings | Adult features + credential issuance tab, issuance history |

## Screens

### 1. Onboarding Flow

**1a. Welcome** — App name, tagline ("Your identity. Your proof."), two buttons: "Create Identity" / "Import Identity"

**1b. Account Type** — "Who is this account for?" → Adult / Child / Verifier. Brief explanation of each.

**1c. Create Identity (Adult/Verifier)** — Generate 12 words, display prominently, "I've written these down" checkbox, confirm by selecting words in order (pick 3 random positions to verify).

**1d. Create Identity (Child)** — "Enter your parent's recovery phrase or scan their QR" → derives child key at next available index. Parent must approve.

**1e. Import Identity** — Text input for 12 words, validates in real time, derives key on submit.

**1f. Set Profile** — Name (display name only, not verified), optional avatar (local only).

### 2. Home Screen

The user's identity card:
- Display name + avatar
- Public key (truncated, tap to copy)
- QR code of their pubkey (for others to scan)
- Tier badge (no mark / ✓ / ✓✓ / ✓✓✓)
- Trust score with breakdown (expandable)
- "Share my QR" button

### 3. Connections Screen

List of all contacts, sorted by most recent interaction:
- Name + avatar
- Tier badge
- Last connected date
- Tap → Contact Detail

**Contact Detail:**
- Their shared info (name, mobile, email, address, children)
- Our shared info (what we shared with them)
- **Signet words** — the hero feature, large 3-word display with countdown
- Vouch button (if not already vouched)
- Remove connection

### 4. Scan Screen

Full-screen camera viewfinder for QR scanning:
- Camera permission request
- Scan → parse QR payload → show their info preview
- "Select what to share" — toggleable list (name, mobile, email, address, child keys)
- "Connect" button → establishes ECDH connection, saves to IndexedDB
- Success confirmation with their name and the first signet words

### 5. Signet Screen (within Contact Detail)

The centrepiece UI:
```
┌──────────────────────────────┐
│                              │
│    ocean · tiger · marble    │
│                              │
│  ████████████░░░░░░  18s     │
│                              │
│  [Verify words read to me]   │
│                              │
└──────────────────────────────┘
```

- Large, clear typography
- Progress bar counting down to next rotation (30s epoch)
- Words update live when epoch changes
- "Verify" mode: tap button, enter 3 words someone read to you, shows match/no-match

### 6. Backup Screen

**View backup:**
- Option to reveal 12-word mnemonic (requires confirmation)
- Shamir split: choose 2-of-3 or 3-of-5
- Display each share as words
- QR code for each share (so shares can be given to trusted contacts by scanning)

**Restore:**
- Enter M shares to reconstruct
- Validates and recovers the mnemonic

### 7. Verifier Screen (role-gated)

Only visible for Verifier accounts:
- Register as verifier (enter profession, jurisdiction, licence info)
- Issue Tier 3 credential (scan/enter subject's pubkey, confirm in-person verification)
- Issue Tier 4 credential (same + child age range)
- Issuance history list

### 8. Settings Screen

- **Theme**: System / Light / Dark
- **Account type**: Change role (Adult ↔ Verifier)
- **Certificate**: Download `.pem` file + install instructions per platform:
  - iOS Safari
  - Android Chrome
  - Desktop browsers
- **Export data**: Download all connections + preferences as encrypted JSON
- **Import data**: Upload previously exported data
- **Danger zone**: Delete identity (requires confirmation)

## Data Model (IndexedDB)

```
Store: "identity"
  - mnemonic (encrypted with a derived key from a PIN/password)
  - publicKey
  - privateKey (encrypted)
  - role: "adult" | "child" | "verifier"
  - displayName
  - createdAt

Store: "connections"
  - pubkey (primary key)
  - sharedSecret
  - theirInfo: ContactInfo
  - ourInfo: ContactInfo
  - connectedAt
  - method

Store: "preferences"
  - theme: "system" | "light" | "dark"
  - role
```

## Theming

CSS custom properties on `:root` and `[data-theme="dark"]`:

```css
--bg-primary, --bg-secondary, --bg-card
--text-primary, --text-secondary, --text-muted
--accent, --accent-hover
--border, --border-subtle
--success, --warning, --danger
--signet-word (large, bold — the hero colour)
```

Default follows `prefers-color-scheme`. Manual override stored in preferences.

## Security

- Private key and mnemonic are encrypted in IndexedDB using a key derived from a user-set PIN (PBKDF2)
- Shared secrets stored in IndexedDB (encrypted alongside identity)
- No data ever sent to a server
- Self-signed cert is for local development only — production would use a real cert
- Camera permission scoped to scan screen only

## File Structure

```
app/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── cert/                    — self-signed cert + key
│   ├── generate-cert.sh
│   ├── signet.pem
│   └── signet-key.pem
├── public/
│   └── signet.pem          — downloadable from settings page
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css           — global styles + theme variables
│   ├── pages/
│   │   ├── Onboarding.tsx
│   │   ├── Home.tsx
│   │   ├── Connections.tsx
│   │   ├── ContactDetail.tsx
│   │   ├── Scan.tsx
│   │   ├── Backup.tsx
│   │   ├── Verifier.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Layout.tsx       — nav bar, page container
│   │   ├── QRCode.tsx       — QR code renderer
│   │   ├── QRScanner.tsx    — camera-based scanner
│   │   ├── SignetWords.tsx   — the 3-word display with countdown
│   │   ├── TierBadge.tsx    — checkmark display
│   │   ├── TrustScore.tsx   — score bar with breakdown
│   │   ├── WordGrid.tsx     — mnemonic word display/input
│   │   ├── ProgressBar.tsx  — countdown timer bar
│   │   └── ThemeToggle.tsx
│   ├── hooks/
│   │   ├── useIdentity.ts   — identity CRUD from IndexedDB
│   │   ├── useConnections.ts — connection CRUD from IndexedDB
│   │   ├── usePreferences.ts — theme, role preferences
│   │   ├── useSignetWords.ts — live-updating signet words
│   │   └── useCamera.ts     — camera permission + stream
│   ├── lib/
│   │   ├── db.ts            — IndexedDB wrapper
│   │   ├── crypto.ts        — PIN-based encryption for stored keys
│   │   └── signet.ts        — re-exports from signet-protocol for convenience
│   └── types/
│       └── index.ts         — app-specific types
└── dist/                    — production build output
```

## Non-Goals (for this version)

- No relay integration (no publishing events to Nostr relays)
- No real-time sync between devices
- No push notifications
- No PWA service worker (can add later)
- No organisation accounts
- No automated licence verification against public registries
