# My Signet App — v2 Specification

> Status: Ready to build
> Date: 2026-03-14
> This document is self-contained. No other files are needed for full context.

---

## 0. Protocol Context

This section summarises the Signet protocol — enough for anyone reading this spec to understand every decision below. The full protocol spec is at `spec/protocol.md` but is not required reading.

### 0.1 What Signet is

Signet is an open protocol for decentralised identity verification on Nostr (a decentralised social protocol). It lets people prove claims about their identity — age, parenthood, professional status — using zero-knowledge proofs, without revealing personal data or relying on a central authority. Any Nostr client can implement Signet. Any community can set verification policies. Any licensed professional can become a verifier.

**Child safety is the killer app.** A child can prove they're 8-12 years old to a game without revealing their name. A parent can prove they are the legal guardian. A deepfake caller can be detected in real time with time-based spoken words.

### 0.2 Verification tiers

| Tier | Name | How you get it | What it proves |
|------|------|---------------|----------------|
| 0 | Unverified | Create an account | Nothing — just a keypair |
| 1 | Self-declared | Sign a statement "I am an adult" | Self-attestation only (weak) |
| 2 | Peer-vouched | 3+ verified people vouch for you | Community trust (medium) |
| 3 | Professional (adult) | A solicitor/doctor/notary checks your passport | Government-grade identity |
| 4 | Professional (child) | Same + birth certificate + guardian confirmation | Child identity + legal guardian binding |

Tiers 3 and 4 are the focus of this app. They produce the two-credential ceremony (see §0.5).

### 0.3 Nostr event kinds

Signet defines 11 event kinds on the Nostr network. The ones relevant to this app:

| Kind | Name | What it is |
|------|------|-----------|
| 30470 | Credential | A signed statement about someone's identity (tier, age range, entity type). This is the core event — issued by a verifier during the ceremony. |
| 30471 | Vouch | "I've met this person" — peer endorsement. Creates Tier 2 trust. |
| 30473 | Verifier | A professional body (Law Society, medical board) confirming someone is a registered professional. Without this, credentials they issue show as "pending." |
| 30475 | Revocation | Cancel a previously issued credential. |
| 30477 | Delegation | A guardian granting scoped, time-limited permissions to another adult (e.g., grandma can approve contacts this weekend). |

All events are signed with Schnorr signatures (secp256k1). Events are published to Nostr relays but the ceremony itself is local computation — no network required.

### 0.4 Entity types

Every credential has an `entity-type` tag:

| Entity type | What it means | Key property |
|-------------|--------------|--------------|
| `natural_person` | A real, identified human | Has nullifier + Merkle root — provable, unique identity |
| `persona` | An anonymous alias | Has age range only — no name, no nullifier, no Merkle root |

A single person has BOTH — their Natural Person credential (real identity) and their Persona credential (anonymous). These are issued together in the two-credential ceremony. Clients MUST display the entity type: "Person" vs "Alias."

### 0.5 The two-credential ceremony

When a professional verifies someone, they issue TWO credentials simultaneously:

**Natural Person credential (Keypair A):**
- `entity-type`: `natural_person`
- `nullifier`: SHA-256 hash of document details (prevents same passport verifying twice)
- `merkle-root`: Root of a Merkle tree containing name, nationality, DOB, document type, nullifier
- `age-range`: e.g., `18+`, `8-12`
- `guardian` tags: parent pubkeys (if child)
- Tier: 3 (adult) or 4 (child)

**Persona credential (Keypair B):**
- `entity-type`: `persona`
- `age-range`: same as above
- `guardian` tags: same (if child)
- NO nullifier, NO merkle-root, NO name
- Tier: 3 or 4

The link between keypairs A and B is known only to the subject and the verifier, protected by professional confidentiality (solicitor-client privilege, notary secrecy, medical confidentiality).

**Nullifier computation:**
```
SHA-256(
  uint16be(len(documentType))  || documentType  ||
  uint16be(len(countryCode))   || countryCode   ||
  uint16be(len(documentNumber))|| documentNumber ||
  uint16be(len("signet-nullifier-v2")) || "signet-nullifier-v2"
)
```
The document number is NEVER stored or published. Only the one-way hash appears in the credential.

**Merkle tree (5 leaves):**
- name, nationality, documentType, dateOfBirth, nullifier
- Uses RFC 6962 domain separation (0x00 leaf prefix, 0x01 internal prefix)
- Only the root is published. The subject keeps the leaves and proofs privately.
- Selective disclosure: the subject can prove any single attribute (e.g., nationality to a bank) by providing the leaf + Merkle proof, without revealing the other leaves.

**Age ranges:** `0-3 | 4-7 | 8-12 | 13-17 | 18+`

### 0.6 Guardian delegation (Kind 30477)

A guardian (parent with Tier 4 credential) can grant scoped, time-limited permissions to another verified adult:

| Scope | What it allows |
|-------|---------------|
| `full` | Everything — co-parent or trusted step-parent |
| `activity-approval` | Approve/deny child's participation in activities |
| `content-management` | Set or override content filters |
| `contact-approval` | Approve/reject new contact requests for the child |

Delegations can have an expiry timestamp. They are revocable at any time.

### 0.7 Signet IQ (trust score)

A continuous 0-200 score called the Identification Quotient. Like IQ, the distribution is non-linear — getting to 100 is straightforward, getting to 200 requires sustained effort from multiple independent sources. The score incentivizes progressive verification: each new document, each new verifier, each new connection pushes you higher, but with diminishing returns.

**Score ranges:**

| Range | Meaning | What it typically takes |
|-------|---------|----------------------|
| 0-40 | Unverified | New account, maybe some peer connections |
| 40-80 | Emerging | One professional verification |
| 80-120 | Solid | First verification + second document or peer vouches |
| 120-160 | Strong | Multiple verifiers + social proof + diverse attributes |
| 160-200 | Exceptional | Cross-verification + longevity + strong web of trust |

100 = government-acceptable standard. Most people will sit at 80-120. 200 is aspirational.

**Signal categories:**

*Professional verification (core identity):*

| Signal | First time | Diminishing returns |
|--------|-----------|-------------------|
| Professional verification (passport/ID) | 80 | — (one-time) |
| Additional document, same verifier | 15, then 8, then 4 | Same trust source |
| Additional document, different verifier | 25, then 15, then 8 | Independent confirmation — worth more |
| New attribute type (address, NI, etc.) | 10, then 8, then 5 | Supplementary attributes |
| Cross-verification (same attribute, different verifier) | 10, then 5, then 3 | Redundancy bonus |

*Web of trust (social proof):*

| Signal | Points | Cap | Notes |
|--------|--------|-----|-------|
| Connected to verified person (passive) | 2 × (their IQ / 200) each | Max 20 total | In your contacts |
| Mutual Signet Me verification | 3 × (their IQ / 200) each | Max 30 total | Both confirmed each other in real time |
| In-person vouch (Kind 30471) | 16 × (voucher's IQ / 200) each | No cap per-vouch | They put their reputation on the line |
| Online vouch | 4 × (voucher's IQ / 200) each | No cap per-vouch | Weaker than in-person |

*Longevity and bridges:*

| Signal | Points |
|--------|--------|
| Account age | 10 per year, max 30 |
| Identity bridge (cross-platform proof) | Up to 50 |

**Key scoring properties:**
- **Independence is rewarded.** Two different verifiers confirming the same identity is worth more than the same verifier confirming two documents.
- **Recursive trust.** The voucher's own IQ scales what their vouch is worth to you. A vouch from someone at IQ 160 is worth 4x more than from someone at IQ 40. Trust flows through the network.
- **Diminishing returns.** The same type of evidence contributes less each time. This prevents gaming (verifying the same passport at 10 different solicitors).
- **Self-reinforcing.** As your connections improve their IQ, your score improves too. A family that all gets verified together lifts each other.

**Example — a family getting verified together:**

Gran starts at IQ 0. She visits a solicitor with her passport → IQ jumps to 80. Her daughter (IQ 95) and son-in-law (IQ 90) both vouch for her → adds ~15. She verifies her address with a bank statement at a different solicitor → adds 25 (different verifier). After 2 years of account age → adds 20. Total: ~140. Strong.

The app shows this as a progress bar with a "next step" prompt:
```
IQ: 140 ██████████████░░
Next: Ask 2 more verified friends to vouch (+12)
```

The app does NOT show a fake score. It either shows the real computed score (when credentials and vouches are available) or shows "Unverified" with no number.

### 0.8 Progressive verification and dynamic attributes

The current protocol has a fixed 5-leaf Merkle tree (name, nationality, documentType, dateOfBirth, nullifier). The v2 model extends this to support **progressive verification** — attributes accumulated over time from different documents and different verifiers.

**Core principles:**
1. **The Merkle tree is dynamic** — arbitrary key-value pairs, not fixed leaves. A credential can have 1 leaf or 50 leaves, depending on what the verifier can confirm.
2. **Credentials are scoped** — each credential covers the attributes one verifier can confirm from one document. A passport credential has name/DOB/nationality. An address credential has address/postcode.
3. **Credentials stack** — the app accumulates verified attributes over time. A user might have 3-4 credentials from different visits, each covering different attributes.
4. **The self-declared profile is the starting point** — users enter their own details first (unverified). When they visit a professional, the verifier confirms what's already entered. Much faster than starting from scratch.
5. **Form auto-fill is the killer UX** — websites can request verified attributes. The user approves, the app shares specific Merkle proofs. No typing, no mistakes, cryptographically verified.

**Attribute namespacing (country-specific):**

| Namespace | Examples |
|-----------|---------|
| `signet:` (universal) | `signet:name`, `signet:dateOfBirth`, `signet:nationality`, `signet:address` |
| `gb:` (UK) | `gb:nationalInsurance`, `gb:nhsNumber` |
| `us:` (USA) | `us:ssn`, `us:driversLicense` |
| `in:` (India) | `in:aadhaar`, `in:pan` |
| `de:` (Germany) | `de:steuerID` |

Different countries have different ID systems. The attribute vocabulary is extensible — any verifier can add country-specific attributes.

**Dual passports / multiple documents:**

A person with British and US passports has two document nullifiers (one per passport). Each can be verified in a separate credential. Both contribute to the same identity. The protocol's `computeNullifierFamily` handles multi-document cases — one nullifier per document type + number + country.

**Example — progressive verification over time:**

| Visit | Document | Credential attributes | IQ contribution |
|-------|----------|----------------------|-----------------|
| Solicitor, March | UK passport | name, DOB, nationality, nullifier | +80 (first verification) |
| Same solicitor, March | Child's birth cert | child: age, guardian relationship | +15 (second document, same verifier) |
| Bank, June | Bank statement | address, postcode | +25 (different verifier) + 10 (new attribute type) |
| HMRC, September | Tax letter | NI number | +10 (new attribute type) |
| GP, November | Medical records | NHS number | +8 (new attribute type, diminishing) |

Total after all visits: ~148. Each visit is 3-5 minutes. The identity gets stronger over time without a single "big bang" ceremony.

### 0.9 Canary-kit

Canary-kit is a separate library (published on npm as `canary-kit`) that provides deepfake-proof spoken verification. It is the engine behind "Signet Me." Key features used by this app:

**Directional pairs:** `deriveDirectionalPair(secret, namespace, [roleA, roleB], counter, encoding)` — derives TWO different words from the same shared secret. Person A gets one word, person B gets a different word. Neither can be derived from the other without the secret. Prevents the echo attack (parroting back what you just heard).

**Spoken-clarity wordlist:** 2048 words filtered for spoken clarity — no homophones, no phonetic near-collisions, all 3-8 characters.

**Encoding options:**
- Words (1-16 words, default 1) — 11 bits per word
- PIN (1-10 digits) — for kids who find words hard
- Hex (1-64 chars) — for developer interfaces

**Features proposed but pending security review:**
- Duress tokens — a personal "safe word" that looks normal but silently signals distress
- Liveness tokens — dead man's switch heartbeats ("I'm safe")
- Encrypted location beacons — AES-256-GCM, precision-controllable
- Duress alerts — emergency location broadcast at full precision

### 0.10 Cryptographic primitives

| Primitive | Used for |
|-----------|---------|
| HMAC-SHA256 | Word derivation (canary-kit CANARY-DERIVE) |
| ECDH (secp256k1) | Shared secrets between family members |
| SHA-256 | Nullifier computation, Merkle tree |
| Schnorr signatures (secp256k1) | Event signing (Nostr standard) |
| AES-256-GCM | Encryption at rest (PBKDF2 key derivation) |
| BIP-39 | Mnemonic generation (12 words) |
| BIP-32 | HD key derivation (NIP-06 path) |

### 0.11 Verified photos

During the verification ceremony, the verifier captures or confirms a photo of the subject. This photo becomes a verified attribute — it proves the person holding the phone matches the credential.

**How it works:**
1. The person takes a selfie in the app (with guidance — face forward, good lighting, no sunglasses)
2. The verifier confirms the photo matches the person in front of them — or takes the photo themselves
3. A fresh photo is preferred over a passport photo (which may be years old and low quality)
4. The verifier uses their professional discretion on photo quality

**Storage — two layers:**

The photo always exists locally. Blossom is optional but required for some scenarios.

| Layer | What | When | Required? |
|-------|------|------|-----------|
| **Local** | Photo stored on device (IndexedDB, encrypted). Hash in the Merkle tree: `signet:photo → SHA-256(photo_bytes)` | Always — created during verification ceremony | Yes — this is the base layer |
| **Blossom** | Photo uploaded to a Blossom server (Nostr blob storage), referenced by hash. URL optionally included in credential metadata. | When the user chooses, or when a scenario requires remote access | No — user's choice |

**When Blossom is needed:**
- Integrated venue systems that fetch your photo remotely (e.g., gate scanner at a stadium)
- Any scenario where a third party needs to see your photo without you showing your phone
- Services that verify credentials server-side

**When local is enough:**
- Showing your phone at a bar or gate (person looks at your screen)
- Any in-person visual check where you're present with your device
- Offline scenarios with no connectivity

**Photo per credential (user's choice):**

| Choice | Privacy | Use case |
|--------|---------|----------|
| Photo on Natural Person only | Persona stays fully anonymous | Bank, airport — where name is required anyway |
| Photo on Persona only | Anonymous but visually verifiable | Pub, football match — age check with face match |
| Photo on both (different photos) | Unlinkable if photos differ | Maximum flexibility |
| Photo on both (same photo) | **Linkable — the app warns against this** | Convenience, but breaks persona privacy |
| No photo | Maximum privacy, no visual check | Online-only use cases |

**Pairing warning:** If the user puts the same photo on both credentials, anyone who sees both can match the hashes and link the identities. The app must warn: "Using the same photo on both identities will link them."

**Venue presentation — two modes:**

*Mode 1: Local (no infrastructure needed)*
1. Fan opens app, shows credential screen with photo + age badge
2. Steward compares face on phone screen to person in front of them
3. Works offline, works at any venue, zero infrastructure
4. Photo comes from the device's local storage

*Mode 2: Remote/Blossom (integrated venues)*
1. Ticket QR contains the fan's Persona pubkey
2. Steward/system scans the ticket QR
3. System fetches credential from relay + photo from Blossom (by hash)
4. Photo appears on the steward's screen — independent of the fan's device
5. Steward compares face to person

```
┌─────────────────────────────┐
│  GATE VERIFICATION          │
│                             │
│  ┌──────────┐               │
│  │  [Photo] │  Age: 18+ ✓   │
│  │          │  IQ: 95       │
│  └──────────┘  Tier 3       │
│                             │
│  Name: [not disclosed]      │
│  Persona credential         │
│                             │
│  [ADMIT]  [DENY]            │
└─────────────────────────────┘
```

Mode 2 is stronger because the venue system fetches the photo independently — it doesn't trust what the fan's phone displays. A fake app can't change what Blossom serves. But Mode 2 requires:
- The Persona credential published to a relay
- The photo uploaded to Blossom
- Connectivity at the venue

Most venues will start with Mode 1 (just eyeballs) and move to Mode 2 as adoption grows.

For offline venues: the person's app could show the photo + credential locally (the current flow). The steward compares visually. No Blossom fetch needed — the photo is on the person's device.

**Biometric unlock (additional protection):** The app should require FaceID / fingerprint to show credentials. Even if someone borrows the phone, they can't open the Signet app. Two layers: biometric lock (prevents casual borrowing) + verified photo (visual check by a human).

### 0.12 IQ erosion (time-based decay)

Instead of credentials having a hard 2-year expiry (verified one day, expired the next), the IQ contribution gradually decays over time. This creates a gentle incentive to renew without breaking anything overnight.

**Half-life model:**
```
contribution = basePoints × 2^(-age_years / halfLife)
```

Different signals decay at different rates because real-world confidence changes differently:

| Signal | Half-life | Rationale |
|--------|-----------|-----------|
| Document verification (passport) | 3 years | Documents valid ~10 years, but circumstances change |
| Photo | 2 years | Appearance changes faster than documents |
| Vouches | 2 years | Relationships change, people move on |
| Address verification | 1.5 years | People move frequently |
| Account age | Never decays | Factual — the account has existed since X |
| Identity bridge | 3 years | Key ownership is stable |

**Example — IQ erosion without renewal:**

| Time | Document (80) | Vouches (15) | Account age | Total IQ |
|------|:---:|:---:|:---:|:---:|
| Year 0 (fresh) | 80 | 15 | 20 | **115** |
| Year 1 | 63 | 12 | 20 | **95** |
| Year 2 | 50 | 8 | 20 | **78** |
| Year 3 | 40 | 5 | 20 | **65** |
| Year 4 | 32 | 3 | 20 | **55** |
| Year 5 | 25 | 2 | 20 | **47** |

The app nudges before the score drops too far:
```
Your IQ has dropped to 78.
Your verification is 2 years old.
Renew at your next appointment to restore your score.
```

**Why this fits the confidence model:** Over time, the probability that a verification is still accurate decreases. People change names, move countries, documents can be compromised. A 5-year-old verification is genuinely less trustworthy than a fresh one. The decay represents real-world confidence erosion.

**Renewal:** Same ceremony as the first time. Visit a verifier, check documents, new photo, issue new credentials. The new credential supersedes the old one. IQ jumps back up. Takes 5 minutes.

**Photo decay specifically:** A photo decays faster (2-year half-life) because appearance changes. The app could nudge: "Your verified photo is 18 months old. Update it at your next appointment." This keeps the visual check useful for venue scenarios.

### 0.13 Key design decisions already made

- **Offline-first.** The app works without a server or relay. All core features (Signet Me, QR pairing, key management) are local.
- **No central authority.** Professional bodies (Law Society, medical boards) are the trust anchors — not Signet, not any company.
- **Privacy by default.** The Persona credential proves age without revealing name. The Natural Person credential uses a Merkle tree so attributes can be selectively disclosed.
- **The protocol is audited.** The `signet-protocol` TypeScript library has been through security review. New features that touch the protocol require security team approval before merging. The app can use canary-kit directly (via Vite alias) to avoid modifying audited code.

---

## 1. What This App Is

My Signet is **the** Signet app. One app for everyone — grandparents, parents, teenagers, solicitors, doctors. It is not a "family app" or a "developer tool." It is the single interface through which people interact with the Signet identity protocol.

A separate **Signet Developer** app exists for protocol exploration, event inspection, and testing. That is not this app.

### 1.1 Design principles

- **Basic should feel complete.** A user who never opens settings should never feel like they're missing something.
- **No crypto jargon.** No "mnemonic," "pubkey," "keypair," "hex," or "relay" in any user-facing text. These concepts exist but are expressed in human terms.
- **Capabilities expand based on who you are.** The app is the same download for everyone. Features surface based on your credentials and registrations — not which SKU you installed.
- **The physical presence moment is sacred.** When someone is in the room with a professional, passport in hand — capture the verification. Don't waste it on bureaucracy that can happen later.

---

## 2. Identity Model

### 2.1 Two keypairs, always

Every user has two keypairs, derived from a single 12-word mnemonic using BIP-32 HD derivation (NIP-06):

| Keypair | Derivation path | Purpose |
|---------|----------------|---------|
| Natural Person | `m/44'/1237'/0'/0/0` | Real identity — name, verified attributes |
| Persona | `m/44'/1237'/1'/0/0` | Anonymous identity — age range only, no name |

Both keypairs are **always generated during onboarding**. The user chooses which one is their primary (day-to-day) identity. The other exists silently, ready for when it's needed.

The link between the two keypairs is known only to the user and (after verification) their verifier. It is protected by professional confidentiality.

### 2.2 Choosing a primary identity

During onboarding, the user is asked:

> "Do you want to use your real name, or a nickname?"

- **Real name** → Natural Person keypair is the primary. The Persona keypair exists but is dormant. This is the path for gran, for parents, for most people.
- **Nickname** → Persona keypair is the primary. The Natural Person keypair exists but is dormant. This is the path for teenagers, privacy-conscious users, or anyone who already has an online handle.

The user can switch their primary identity later in settings. Both keypairs share the same mnemonic backup — recovering one recovers both.

### 2.3 Data model

```typescript
interface SignetIdentity {
  id: string;                          // Primary keypair pubkey
  mnemonic: string;                    // Shared 12-word seed (encrypted at rest)
  naturalPerson: {
    publicKey: string;
    privateKey: string;                // Encrypted at rest
    displayName: string;               // Real name (e.g., "Margaret Smith")
  };
  persona: {
    publicKey: string;
    privateKey: string;                // Encrypted at rest
    displayName: string;               // Nickname (e.g., "DarkWolf99")
  };
  primaryKeypair: 'natural-person' | 'persona';
  isChild: boolean;
  guardianPubkey?: string;             // Parent's pubkey (if child)
  createdAt: number;                   // Unix timestamp
}
```

The `id` field is the pubkey of whichever keypair is currently primary.

---

## 3. Onboarding

### 3.1 Create flow

**Step 1 — Welcome**
```
Welcome to Signet
Know it's really them. Not a deepfake.

[Create My Signet]
[I have my 12 backup words]
```

**Step 2 — Name choice**
```
Do you want to use your real name, or a nickname?

[Use my real name]    → goes to Step 3a
[Use a nickname]      → goes to Step 3b
```

**Step 3a — Real name (Natural Person primary)**
```
What's your name?
This is how people will see you.

[_____________]
[Continue]
```

**Step 3b — Nickname (Persona primary)**
```
Pick a nickname.
This is how people will see you. Your real name stays private.

[_____________]
[Continue]
```

**Step 4 — Child check**
```
Is this account for a child?
Child accounts are linked to a parent for safety.

[No, this is for me]
[Yes, for a child]
```

If child → **Step 4a: Link to parent**
```
Ask the parent to open their Signet app and tap "Copy" under their Signet ID. Then paste it here.

[_____________]
[Continue]
```

**Step 5 — Backup words**
```
Your 12 backup words
Write these down on paper and keep them somewhere safe.
If you lose your phone, these words are the only way to get your Signet back.

  1. apple     7. garden
  2. river     8. marble
  3. ocean     9. falcon
  4. tiger    10. beacon
  5. cloud    11. silver
  6. brave    12. puzzle

[ ] I've written these down
[Continue]
```

**Step 6 — Done**
App detects identity exists, shows home screen.

### 3.2 Import flow

1. "Enter your 12 backup words" → validates with BIP-39
2. "Do you want to use your real name, or a nickname?" → same as create flow
3. Name input
4. Done — both keypairs derived from the imported mnemonic

### 3.3 What happens behind the scenes

On account creation:
1. Generate BIP-39 mnemonic (12 words, English wordlist)
2. Derive Natural Person keypair at `m/44'/1237'/0'/0/0`
3. Derive Persona keypair at `m/44'/1237'/1'/0/0`
4. Set primary based on user's name choice
5. Store encrypted in IndexedDB (PBKDF2 + AES-256-GCM)

No credentials are issued. No events are published. The user is Tier 0 (unverified) until they visit a professional. This is fine — Signet Me verification works without any tier.

---

## 4. Home Screen

The home screen adapts based on who you are.

### 4.1 Regular user (everyone)

```
┌─────────────────────────────┐
│ Margaret              [gear]│
│ ○ Unverified                │
│                             │
│ MY FAMILY                   │
│ ┌─────────────────────────┐ │
│ │ Tom           Verified  │ │
│ │ Tap to verify           │ │
│ ├─────────────────────────┤ │
│ │ Sophie     Child Account│ │
│ │ Tap to verify           │ │
│ └─────────────────────────┘ │
│                             │
│ YOUR SIGNET ID              │
│ npub1abc...xyz              │
│ [Copy]  [Share]             │
│                             │
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│   Get verified at your      │
│   next appointment →        │
│ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                             │
│ [My Signet]  [+]  [Family] │
└─────────────────────────────┘
```

The "Get verified" prompt is a subtle, dashed-border card. Not a nag. Not a gate. A gentle suggestion.

### 4.2 Verified user

Same layout, but:
- Badge changes from "Unverified" to "Verified (Tier 3)" or similar
- "Get verified" card disappears
- Family members show their real tier badges

### 4.3 Registered verifier

Same layout as verified user, **plus one card**:

```
┌─────────────────────────────┐
│  Verify Someone             │
│  Tap when a patient or      │
│  client needs verifying     │
└─────────────────────────────┘
```

This card only appears after verifier activation (see §8). It is never visible to regular users.

### 4.4 Empty state (no family members)

```
Add your first family member
Once connected, you can verify it's really them
— not a deepfake — with Signet Me.

[Add someone]
```

---

## 5. Signet Me — Directional Verification

### 5.1 How it works

When two people are connected (via QR exchange), each person sees **different words** derived from their shared secret. This prevents the echo attack where someone parrots back what they just heard.

Uses canary-kit's `deriveDirectionalPair(secret, namespace, [myPubkey, theirPubkey], counter, encoding)`.

- Namespace: `signet:me`
- Counter: `floor(unix_seconds / 30)` — words rotate every 30 seconds
- Tolerance: ±1 counter (accepts previous/next 30-second window for clock skew)
- Roles: the two parties' pubkeys (deterministic, unique)

### 5.2 Security tiers

The number of words per side is controlled by a global setting:

| Tier | Words per side | Entropy | Use case |
|------|---------------|---------|----------|
| Basic | 1 | 11 bits (1 in 2,048) | "Is it really you?" |
| Standard | 2 | 22 bits (1 in 4.2M) | Approving something |
| Expert | 3 | 33 bits (1 in 8.6B) | High-security actions |

Default: **Basic** (1 word each). Changed in Settings → Verification Security.

### 5.3 UI — Display mode

```
┌─────────────────────────────┐
│  Signet Me                  │
│                             │
│  YOU SAY                    │
│  ┌─────────┐                │
│  │ marble  │                │
│  └─────────┘                │
│                             │
│  THEY SAY                   │
│  ┌─────────┐                │
│  │ falcon  │  (green)       │
│  └─────────┘                │
│                             │
│  Refreshes in 24s           │
│                             │
│  [Verify what they said]    │
└─────────────────────────────┘
```

Standard tier (2 words):
```
  YOU SAY
  ┌─────────┐ ┌─────────┐
  │ marble  │ │ ocean   │
  └─────────┘ └─────────┘

  THEY SAY
  ┌─────────┐ ┌─────────┐
  │ falcon  │ │ river   │
  └─────────┘ └─────────┘
```

### 5.4 UI — Verify mode

Tapping "Verify what they said" shows input fields matching the word count:

```
┌─────────────────────────────┐
│  What did they say?         │
│  ┌─────────────────────┐    │
│  │ [their word]        │    │
│  └─────────────────────┘    │
│  [Check]  [Cancel]          │
└─────────────────────────────┘
```

Results:
- **Match** → "Confirmed — it's really them." (green, auto-dismisses after 2s)
- **No match** → "Doesn't match. This might not be who they claim to be." (red, stays until dismissed)

### 5.5 Where Signet Me appears

- **Family member detail page** — prominently, at the top
- **After adding a new member** — in the success step
- **Home screen** — each family member row shows "Tap to verify" which navigates to their detail page

---

## 6. Getting Verified (Subject Side)

This is the flow for a regular user who wants to get their identity professionally verified.

### 6.1 Entry point

A subtle card on the home screen (dashed border, muted text):
```
Get verified at your next appointment →
```

Tapping it opens the Get Verified screen.

### 6.2 Get Verified screen

```
┌─────────────────────────────┐
│  Get Verified               │
│                             │
│  Visit any registered       │
│  Signet verifier — your     │
│  solicitor, doctor, or      │
│  notary — and show them     │
│  this QR code.              │
│                             │
│  They'll check your ID and  │
│  verify your account on     │
│  the spot.                  │
│                             │
│  ┌───────────────┐          │
│  │               │          │
│  │   [QR CODE]   │          │
│  │               │          │
│  └───────────────┘          │
│                             │
│  This QR contains your two  │
│  Signet IDs. No personal    │
│  data is shared until the   │
│  verifier checks your       │
│  documents in person.       │
│                             │
│  [Find a verifier near me]  │
│  (future — not MVP)         │
└─────────────────────────────┘
```

### 6.3 QR payload

The QR code contains both pubkeys:

```typescript
interface VerificationQRPayload {
  type: 'signet-verify-request';
  naturalPersonPubkey: string;   // Keypair A
  personaPubkey: string;         // Keypair B
  displayName: string;           // Current primary display name
  isChild: boolean;
  guardianPubkey?: string;       // If child, the parent's pubkey
}
```

Serialised as JSON, same pattern as the existing `createQRPayload`.

### 6.4 Receiving credentials

After the verifier runs the ceremony, credentials are delivered back to the user's app. Transport options (in priority order):

1. **QR exchange** — verifier's app shows a QR containing the two signed credential events. Subject's app scans and stores them. Works offline.
2. **Local network** — if both devices are on the same WiFi, direct transfer. Future enhancement.
3. **Nostr relay** — verifier publishes the credentials to a relay. Subject's app subscribes and receives them. Requires connectivity.

For MVP: **QR exchange only**. The verifier's app renders the two credential events as a QR code (or sequence of QR codes if too large). The subject scans and stores.

### 6.5 Pending credentials

If the verifier is not yet registered (their Kind 30473 hasn't been issued by their professional body), the credentials are still cryptographically valid — they're signed by the verifier's key. They just lack the trust chain.

The subject's app shows:

```
Verified by Dr. Patel
Registration pending — your verification will be
confirmed when Dr. Patel's professional registration
is processed. No action needed from you.
```

When the Kind 30473 appears (checked via relay or manual refresh), the status updates to:

```
Verified by Dr. Patel ✓
General Medical Council
```

The subject never needs to revisit the verifier.

### 6.6 Credential storage

Both credentials (Natural Person and Persona) are stored in IndexedDB alongside the identity:

```typescript
interface StoredCredentials {
  naturalPersonCredential?: NostrEvent;   // Kind 30470, entity-type: natural_person
  personaCredential?: NostrEvent;         // Kind 30470, entity-type: persona
  merkleLeaves?: Record<string, string>;  // Private — name, nationality, DOB, docType, nullifier
  merkleProofs?: MerkleProof[];           // For selective disclosure
  verifierPubkey?: string;               // Who issued the credentials
  verifiedAt?: number;                    // Unix timestamp
  verifierStatus: 'confirmed' | 'pending'; // Whether verifier's 30473 has been seen
}
```

The `merkleLeaves` and `merkleProofs` are private — they never leave the device unless the user explicitly chooses to disclose an attribute.

---

## 7. Verifying Someone (Professional Side)

### 7.1 Activation — hidden by design

The verifier capability is **never visible** to regular users. It is activated through a deliberate, hidden gesture — similar to Android developer mode.

**Activation method:**

1. Go to Settings
2. Scroll to "About" section at the bottom
3. Tap the version number ("My Signet v1.0.0") **5 times**
4. A prompt appears: "Enter your professional registration number"
5. User enters their GMC / SRA / notary commission number
6. A second prompt: "Select your professional body" (dropdown or search)
7. App stores the registration locally and sends a verification request to the professional body (or provides instructions for the body's website)
8. Verifier mode is now active — "Verify Someone" card appears on home screen

**Deactivation:** Settings → Verifier Settings → "Deactivate verifier mode"

The professional body's confirmation (Kind 30473 event) may arrive later. The verifier can issue credentials immediately — they will show as "pending" on recipients' apps until the 30473 is confirmed.

### 7.2 Verifier registration data

```typescript
interface VerifierRegistration {
  registrationNumber: string;        // GMC number, SRA ID, notary commission, etc.
  professionalBody: string;          // "General Medical Council", "Solicitors Regulation Authority", etc.
  profession: string;                // "doctor", "solicitor", "notary", etc.
  jurisdiction: string;              // "GB", "US-CA", "DE", etc.
  activatedAt: number;               // Unix timestamp
  verifierCredential?: NostrEvent;   // Kind 30473, when received from professional body
  status: 'pending' | 'confirmed';
}
```

### 7.3 Verify Someone flow

**Step 1 — Scan subject's QR**

The verifier taps "Verify Someone" on the home screen, then scans the subject's QR code (from their "Get Verified" screen).

```
┌─────────────────────────────┐
│  Verify Someone             │
│                             │
│  Scan their QR code         │
│                             │
│  ┌───────────────────┐      │
│  │                   │      │
│  │   [CAMERA VIEW]   │      │
│  │                   │      │
│  └───────────────────┘      │
│                             │
│  Ask them to open their     │
│  Signet app and tap         │
│  "Get Verified."            │
└─────────────────────────────┘
```

**Step 2 — Confirm subject**

After scanning, the verifier sees the subject's details:

```
┌─────────────────────────────┐
│  Verify: Margaret Smith     │
│                             │
│  ○ Adult account            │
│    or                       │
│  ○ Child (guardian: npub..) │
│                             │
│  Check their identity       │
│  documents now.             │
│                             │
│  [Continue with documents]  │
│  [Cancel]                   │
└─────────────────────────────┘
```

**Step 3 — Document entry**

The verifier fills in details from the physical documents (passport, birth certificate, etc.):

```
┌─────────────────────────────┐
│  Identity Documents         │
│                             │
│  Full name                  │
│  [Margaret Anne Smith     ] │
│                             │
│  Date of birth              │
│  [1965-03-22             ]  │
│                             │
│  Nationality                │
│  [British                ]  │
│                             │
│  Document type              │
│  [Passport / ID Card / ..] │
│                             │
│  Document number             │
│  [123456789              ]  │
│                             │
│  Issuing country            │
│  [GB                     ]  │
│                             │
│  [Issue Credentials]        │
│  [Cancel]                   │
└─────────────────────────────┘
```

For child accounts, additional fields:
- Guardian's pubkey (pre-filled from QR)
- Relationship confirmation ("I confirm this person is the legal guardian")

**Step 4 — Confirmation**

```
┌─────────────────────────────┐
│  Confirm & Issue            │
│                             │
│  Name: Margaret Anne Smith  │
│  DOB: 22 March 1965        │
│  Age range: 18+            │
│  Document: Passport (GB)   │
│  Tier: 3 (Professional)    │
│                             │
│  Two credentials will be    │
│  issued:                    │
│  • Person credential        │
│    (verified identity)      │
│  • Persona credential       │
│    (anonymous, age only)    │
│                             │
│  The document number is     │
│  never stored or published. │
│  Only a one-way hash is     │
│  recorded to prevent        │
│  duplicates.                │
│                             │
│  [Confirm & Issue]          │
│  [Back]                     │
└─────────────────────────────┘
```

**Step 5 — Credential delivery**

The ceremony runs locally (`createTwoCredentialCeremony`). The app then shows the credentials as a QR code for the subject to scan:

```
┌─────────────────────────────┐
│  Credentials Issued ✓       │
│                             │
│  Ask them to scan this      │
│  QR code to receive their   │
│  credentials.               │
│                             │
│  ┌───────────────┐          │
│  │               │          │
│  │   [QR CODE]   │          │
│  │               │          │
│  └───────────────┘          │
│                             │
│  [Done]                     │
└─────────────────────────────┘
```

**Step 6 — Done**

Both parties return to their home screens. The subject's credentials are now stored. The verifier's home screen is unchanged.

### 7.4 What happens during the ceremony

All local computation — no network required:

1. Parse subject's two pubkeys from QR payload
2. Compute nullifier: `SHA-256(len||docType || len||country || len||docNumber || len||"signet-nullifier-v2")`
3. Compute age range from DOB: `0-3 | 4-7 | 8-12 | 13-17 | 18+`
4. Determine tier: `18+` → Tier 3 (adult), child range → Tier 4 (adult+child)
5. Build Merkle tree from 5 leaves: name, nationality, documentType, dateOfBirth, nullifier
6. Sign Natural Person credential (Kind 30470): entity-type, merkle-root, nullifier, age-range, guardian tags
7. Sign Persona credential (Kind 30470): entity-type=persona, age-range, guardian tags — NO nullifier, NO merkle-root
8. Return both signed events + Merkle proofs to caller

The document number itself is used only to compute the nullifier hash, then discarded. It is never stored in the credential, in IndexedDB, or anywhere on the device.

### 7.5 Batch verification (family scenario)

A common scenario: a family of four visits a solicitor. The verifier flow supports rapid sequential verification:

1. Verify parent A → scan QR, check passport, issue credentials
2. Verify parent B → scan QR, check passport, issue credentials
3. Verify child 1 → scan QR, check birth certificate, confirm guardian, issue credentials
4. Verify child 2 → same

Each takes 3-5 minutes. Total: ~15-20 minutes for the whole family.

The app does not have an explicit "batch mode." Each verification is independent. The speed comes from the flow being short (scan → fill form → confirm → deliver).

---

## 8. Settings

### 8.1 Structure

```
Settings
├── My Name
│   └── Display name (editable)
├── My Identity
│   ├── Primary: Real name / Nickname (switchable)
│   ├── Natural Person ID: npub1abc... [Copy]
│   └── Persona ID: npub1xyz... [Copy]
├── Verification Security
│   ├── ○ Basic — 1 word each (quick check)
│   ├── ● Standard — 2 words each (approvals)
│   └── ○ Expert — 3 words each (high security)
├── Backup Words
│   └── [View my 12 words] (hidden by default)
├── Appearance
│   └── System / Light / Dark
├── Child Accounts (if applicable)
│   └── [Manage linked children]
├── Verifier Settings (only if activated)
│   ├── Registration: GMC 1234567
│   ├── Status: Confirmed ✓ / Pending
│   └── [Deactivate verifier mode]
├── Delete My Signet
└── About
    └── My Signet v1.0.0  ← tap 5 times to activate verifier
```

### 8.2 Switching primary identity

In "My Identity," the user can switch between Natural Person and Persona as their primary. This changes:
- Which pubkey is shown as "Your Signet ID" on the home screen
- Which keypair is used for new family connections
- Which display name appears in the app header

Existing family connections are **not affected** — they are bound to the specific keypair used when the connection was made.

---

## 9. Credential Display

### 9.1 Badge on home screen

| State | Badge | Colour |
|-------|-------|--------|
| No credentials | "Unverified" | Grey |
| Credentials from pending verifier | "Pending" | Amber |
| Credentials from confirmed verifier | "Verified (Tier 3)" or "Verified (Tier 4)" | Green |
| Child with verified guardian | "Child Account ✓" | Blue |

### 9.2 Credential detail (tappable badge)

Tapping the badge shows:

```
┌─────────────────────────────┐
│  Your Verification          │
│                             │
│  Tier: 3 — Professional     │
│  Verified by: Dr. A. Patel  │
│  Issued: 14 March 2026      │
│  Expires: 14 March 2028     │
│                             │
│  Age range: 18+             │
│  Entity: Person             │
│                             │
│  Your Persona credential    │
│  proves your age without    │
│  revealing your name.       │
│                             │
│  [Share age proof]          │
│  (future — not MVP)         │
└─────────────────────────────┘
```

---

## 10. Proposed Features (Pending Security Review)

These features use canary-kit capabilities not yet integrated. They require review by the security team before implementation.

### 10.1 Duress detection (safe words)

Each person has personal "safe words" — time-based words derived from `deriveDuressTokenBytes(secret, context + ":duress", identity, counter)`. If spoken during a Signet Me verification instead of the real words, the other party's app silently shows a safety alert.

**Protocol change required:** Add `verifySignetWordsEnhanced()` to signet-protocol that returns `'valid' | 'duress' | 'invalid'`. See separate proposal: [Duress Detection Proposal](#appendix-a).

**UI:** A "Your safe words" section on the family member detail page (hidden by default, expandable).

### 10.2 Liveness check-in

One-tap "I'm safe" using canary-kit's `deriveLivenessToken`. Family members see when each person last checked in. Uses HMAC with `:alive` domain separator.

### 10.3 Shamir backup split

Split the 12-word mnemonic into 2-of-3 shares using `splitSecret`. Each share is encoded as BIP-39 words. Give one share to your partner, one to a grandparent. Any two can recover the account.

### 10.4 Location beacons (Expert tier)

Encrypted location sharing using canary-kit's `encryptBeacon`. Precision controllable: 1.2km (neighbourhood) to 3m (full precision for emergencies). AES-256-GCM encryption — only family members can decrypt.

### 10.5 Duress alerts with location (Expert tier)

If a safe word is detected, broadcast the distressed person's location at full precision to all family members. Silent, encrypted, automatic.

---

## 11. Technical Architecture

### 11.1 Data storage

All data is stored in IndexedDB with the following object stores:

| Store | Key | Contents |
|-------|-----|----------|
| `identity` | pubkey | SignetIdentity (encrypted private keys) |
| `credentials` | pubkey | StoredCredentials (signed events + Merkle proofs) |
| `family` | pubkey + index:ownerPubkey | FamilyMember (shared secrets) |
| `child-settings` | childPubkey | ChildSettings (contact policies) |
| `preferences` | `'current'` | AppPreferences (theme, tier, active account) |
| `verifier` | `'registration'` | VerifierRegistration (if activated) |

### 11.2 Canary-kit integration

The app imports canary-kit directly via Vite alias — NOT through signet-protocol. This keeps the audited protocol library untouched.

```typescript
// vite.config.ts
resolve: {
  alias: {
    'signet-protocol': path.resolve(__dirname, '../src'),
    'canary-kit': path.resolve(__dirname, '../../canary-kit/src'),
  },
}
```

Features using canary-kit:
- `deriveDirectionalPair` — directional Signet Me words
- `WORDLIST` — spoken-clarity wordlist (2048 words)

Features proposed (pending security review):
- `deriveDuressTokenBytes` — duress/safe words
- `deriveLivenessToken` — check-in heartbeats
- `encryptBeacon` / `encryptDuressAlert` — location features

### 11.3 Protocol library usage

The app uses signet-protocol for:
- `generateMnemonic` / `validateMnemonic` — BIP-39 mnemonic management
- `deriveNostrKeyPair` / `deriveChildAccount` — key derivation
- `computeSharedSecret` — ECDH for family connections
- `createQRPayload` / `parseQRPayload` — QR exchange
- `encodeNpub` — npub display
- `createTwoCredentialCeremony` — professional verification (verifier side)
- `computeNullifier` — duplicate detection

### 11.4 What requires a relay (future)

The MVP is fully offline. These features require Nostr relay connectivity:

| Feature | Why it needs a relay |
|---------|---------------------|
| Checking verifier status (Kind 30473) | To confirm pending → confirmed |
| Duplicate nullifier detection | To check if a document was already verified |
| Publishing credentials for other apps | So Fathom and other clients can see your tier |
| Receiving guardian delegation events | For cross-app delegation enforcement |
| "Find a verifier near me" | Verifier directory lookup |

---

## 12. File Structure

```
family-app/                         → rename to my-signet/ when ready
├── src/
│   ├── main.tsx
│   ├── App.tsx                     — Router, state orchestrator
│   ├── types.ts                    — All data types
│   ├── styles/
│   │   └── global.css              — Design system
│   ├── pages/
│   │   ├── Home.tsx                — Family-first home screen
│   │   ├── Onboarding.tsx          — Two-keypair creation
│   │   ├── Family.tsx              — Family member list
│   │   ├── FamilyMember.tsx        — Member detail + Signet Me
│   │   ├── AddMember.tsx           — QR scan / enter ID
│   │   ├── GetVerified.tsx         — Subject: show QR for verifier   (NEW)
│   │   ├── VerifySomeone.tsx       — Verifier: scan, form, issue     (NEW)
│   │   ├── CredentialDetail.tsx    — View your credential             (NEW)
│   │   ├── Settings.tsx            — All settings
│   │   └── ChildSettings.tsx       — Guardian controls
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── BottomNav.tsx
│   │   ├── SignetWords.tsx         — Directional "You say / They say"
│   │   ├── WordInput.tsx           — Variable word count input
│   │   ├── QRCode.tsx
│   │   ├── QRScanner.tsx
│   │   ├── StatusBadge.tsx         — Tier-aware badge
│   │   └── TrustBar.tsx            — (unused until relay integration)
│   ├── hooks/
│   │   ├── useIdentity.ts          — Two-keypair identity management  (UPDATED)
│   │   ├── useFamily.ts
│   │   ├── useSignetMe.ts          — Directional word display
│   │   ├── usePreferences.ts       — Theme + security tier
│   │   ├── useCamera.ts
│   │   └── useCredentials.ts       — Load/store credentials           (NEW)
│   └── lib/
│       ├── db.ts                   — IndexedDB (updated schema)
│       ├── signet.ts               — Protocol library wrapper
│       ├── signet-me.ts            — Canary-kit directional pairs
│       └── crypto-store.ts         — PBKDF2 + AES-256-GCM
```

---

## 13. Backup and Recovery

### 13.1 What the mnemonic recovers

The 12-word mnemonic recovers both keypairs (Natural Person + Persona). That's the cryptographic identity. But locally-stored data — credentials, family connections, photos, Merkle proofs — needs its own backup strategy.

### 13.2 Optional Blossom/relay backup

The user can opt to back up credential data:

| Data | Backup destination | How |
|------|-------------------|-----|
| Credentials (signed events) | Nostr relay | Publish Kind 30470 events — they're already designed for relay storage |
| Merkle proofs | Blossom | Encrypted blob, referenced by hash |
| Verified photos | Blossom | Encrypted blob (already there if user opted for Blossom photo) |
| Family connections (shared secrets) | NOT backed up remotely | Re-establish via QR scan after recovery — shared secrets should never leave the device |

### 13.3 Recovery flow

1. Install app on new device
2. Import 12 backup words → keypairs recovered
3. App checks relays for any published credentials → restored automatically
4. App checks Blossom for any backed-up proofs/photos → restored if found
5. Family connections must be re-established in person (QR scan) — this is a feature, not a bug. It confirms the recovered identity is still held by the same person.

### 13.4 Shamir recovery

If the user has split their mnemonic (2-of-3 Shamir), two share holders can reconstruct the mnemonic and perform the recovery. Shares go to **people you trust** — not automatically to legal next-of-kin. This is about trust and connection, not legal succession.

### 13.5 Death / succession

When someone dies, the Shamir share holders can reconstruct the mnemonic and access the account. This is a deliberate choice made by the user when they split their backup — they chose who to trust. The app does not have an automatic inheritance mechanism. The trust graph IS the succession plan.

---

## 14. Child Aging and Credential Lifecycle

### 14.1 Date of birth, not age range

The app stores the child's **date of birth** (as entered during the verification ceremony), not a computed age range. The credential may publish an age range (`8-12`, `13-17`, `18+`) but the source of truth is the DOB, stored privately in the Merkle tree.

This matters because:
- Platforms typically require DOB (stored on their servers) — the Merkle proof for DOB can be shared selectively
- Sharing only the birth year (not full date) is significantly more private than sharing the full DOB, while still allowing age calculation
- The age range in the credential tag is a convenience — the DOB in the Merkle leaf is the authoritative attribute

### 14.2 Age boundary transitions

Age ranges in credentials are snapshots — they reflect the age at verification time. They do NOT auto-update.

When a child crosses an age boundary (e.g., turns 13, turns 18), the credential's age range becomes stale. The app can detect this (it knows the DOB) and prompt:

```
Sophie turned 13 last month.
Her credential still shows "8-12."
Visit a verifier to update her age range.
```

**No automatic ceremonies.** The user must visit a verifier to get a new credential with the updated age range. This is a deliberate design choice — age transitions are significant events (especially 18) and should involve professional confirmation, not automated updates.

### 14.3 Turning 18

When a child turns 18:
- Their Tier 4 credential (`adult+child` scope) should be superseded by a Tier 3 credential (`adult` scope)
- The `guardian` tags are removed — they are now an independent adult
- They visit a verifier with their own documents (no parent needed)
- The old credential is superseded, the new one stands alone
- Their IQ score transitions — guardian-based signals drop off, adult signals take over

The app prompts at the right time:
```
Sophie is now 18.
She can get her own adult verification.
Her child credential will be replaced
with an independent adult credential.
```

---

## 15. Corrupt Verifier Handling

### 15.1 The problem

A verifier (doctor, solicitor) issues fraudulent credentials. Their professional body discovers this and revokes their Kind 30473 verifier registration.

### 15.2 Impact on issued credentials

When a verifier's registration is revoked, **all credentials they've signed become suspect.** This affects every person they verified.

**The IQ impact uses decay, not an instant cliff:**

| Time after revocation | Effect on IQ contribution |
|----------------------|--------------------------|
| Day 0 (revocation announced) | Credential contribution drops to 50% |
| Week 1 | Drops to 30% |
| Month 1 | Drops to 10% |
| Month 3 | Drops to 0% |

This 3-month decay window gives affected users time to get re-verified by a different (trustworthy) verifier. Their IQ drops gradually rather than crashing to zero overnight — they can still attend their football match tomorrow while they sort out a new verification appointment.

### 15.3 User notification

The app notifies affected users immediately:

```
Your verifier Dr. Patel has been deregistered
by the General Medical Council.

Your credentials are still valid for 3 months,
but your IQ will gradually decrease.

Get re-verified by a different professional
to maintain your score.

[Find a verifier]
```

### 15.4 Prevention through multiple verifiers

This risk is **mitigated by having credentials from multiple independent verifiers.** If one verifier is compromised:
- Credentials from other verifiers are unaffected
- The user's IQ only partially drops (the compromised portion decays, the rest holds)
- The statistical confidence model handles this naturally — removing one independent source reduces confidence but doesn't eliminate it

This is another incentive for progressive verification with different professionals. Two verifiers = resilience against one going bad.

---

## 16. PIN Mode for Kids

### 16.1 The problem

Young children can't read words like "nebula" or "falcon." The spoken-clarity wordlist is designed for adults.

### 16.2 PIN encoding

Canary-kit supports `encodeAsPin(bytes, digits)` — converting the same HMAC output into a numeric code instead of words. Same cryptography, different presentation.

### 16.3 How it works

In Settings → Verification Security, alongside the word count tiers, there's a format toggle:

```
Verification format:
  ● Words (marble, falcon)
  ○ PIN (4821)
```

When PIN mode is selected:

```
┌─────────────────────────────┐
│  Signet Me                  │
│                             │
│  YOU SAY                    │
│  ┌──────────────┐           │
│  │     4821     │           │
│  └──────────────┘           │
│                             │
│  THEY SAY                   │
│  ┌──────────────┐           │
│  │     7390     │  (green)  │
│  └──────────────┘           │
│                             │
│  Refreshes in 24s           │
└─────────────────────────────┘
```

Still directional (different PINs for each side). Still rotates every 30 seconds. Same security properties — just numbers instead of words.

### 16.4 PIN digit count follows security tier

| Tier | Words | PIN equivalent |
|------|-------|---------------|
| Basic | 1 word (11 bits) | 4 digits (~13 bits) |
| Standard | 2 words (22 bits) | 7 digits (~23 bits) |
| Expert | 3 words (33 bits) | 10 digits (~33 bits) |

### 16.5 When to use PIN mode

- Children under ~8 who can read numbers but not complex words
- Users with reading difficulties
- Any situation where numeric entry is easier (e.g., phone keypad)

The parent can set PIN mode on a per-child-account basis, or the child's account can default to PIN mode based on age range.

---

## 17. Offline Verification Trust

### 17.1 The problem

At a venue with no connectivity, the steward scans your credential QR. They can verify the Schnorr signature locally (pure maths, no network). But how do they know the verifier who signed it is legitimate, without checking the Kind 30473 on a relay?

### 17.2 Solution: local trust cache + mutual QR verification

**For venue scenarios (e.g., Belper FC):**

The venue's app/device maintains a local cache of known verifier pubkeys (downloaded when connectivity was available). When scanning a fan's credential offline, the app:

1. Verifies the credential's Schnorr signature (local, no network)
2. Checks the signing pubkey against the cached verifier list
3. If found → trusted. If not found → "unrecognised verifier" warning (not rejected — just flagged)

The cache is updated whenever the device has connectivity. For a small club, this might be "steward connects to WiFi at the clubhouse before the match."

**For person-to-person scenarios (e.g., two fans meeting):**

If both parties have the Signet app, they can verify each other through a mutual QR scan. Each person's app verifies the other's credential signature locally. If both apps have the verifier's Kind 30473 cached (from when they last had connectivity), the verification is fully trusted offline.

---

## 18. Notifications

### 18.1 When the app notifies

| Event | Notification | Priority |
|-------|-------------|----------|
| IQ score has dropped (erosion) | "Your IQ dropped to 78. Renew at your next appointment." | Low — shown on next app open |
| Incoming vouch | "Dave vouched for you. Your IQ increased." | Medium — push if enabled |
| Verifier confirmed | "Dr. Patel's registration is confirmed. Your credentials are now fully verified." | High — push if enabled |
| Verifier deregistered | "Your verifier has been deregistered. Get re-verified within 3 months." | High — push |
| Signet Me request | "Tom wants to verify you. Tap to respond." | High — push if enabled |
| Child age boundary | "Sophie turned 13. Update her credential at your next appointment." | Low — shown on next app open |
| Photo getting stale | "Your verified photo is 18 months old. Consider updating." | Low — shown on next app open |

### 18.2 Signet Me via notification

When someone wants to verify you, they don't both need to have the app open simultaneously. The flow:

1. Alice taps "Verify Tom" on her app
2. Tom gets a push notification: "Alice wants to Signet Me. Tap to respond."
3. Tom taps the notification → app opens directly to the Signet Me screen for Alice
4. Both apps now show their directional words
5. They verify over the phone as normal

**Only one person needs to launch the app first.** The other person is pulled in by the notification. This reduces friction — no "hey, open your app" coordination needed.

### 18.3 User control

Notifications are opt-in. The app works without them — events are shown on the home screen when you next open the app. Push notifications just reduce friction for time-sensitive events (Signet Me requests, verifier deregistration).

---

## 19. Accessibility

### 19.1 Design philosophy

The app defaults to an emphasis on design — clean, minimal, beautiful. Accessibility features are available within 1-2 taps from Settings, not buried deep. The accessible version should feel like a first-class experience, not an afterthought bolted on.

**The principle: design-first by default, accessible in two taps.**

```
Settings → Accessibility
  ├── Text size: Default / Large / Extra Large
  ├── High contrast: Off / On
  ├── Reduce motion: Off / On
  ├── Screen reader optimised: Off / On
  └── Verification format: Words / PIN / Audio
```

### 19.2 Screen reader support

The app must work fully with VoiceOver (iOS) and TalkBack (Android).

**Requirements:**
- Every interactive element has an accessible label (not just visual text)
- The Signet Me words are announced clearly: "Your word is marble. Their word is falcon. Refreshes in 24 seconds."
- QR codes have a text alternative: "QR code containing your Signet ID. Tap to copy as text."
- The photo verification result is announced: "Match confirmed" or "Mismatch warning"
- Navigation follows a logical reading order (top to bottom, not visually positioned)
- Focus management on page transitions — screen reader focus moves to the new page title

**Implementation:** Use semantic HTML elements (`button`, `heading`, `img` with alt text), ARIA labels where semantics are insufficient, and `aria-live` regions for dynamic content (word countdown, verification results).

### 19.3 Visual accessibility

**Colour and contrast:**
- All text meets WCAG 2.1 AA contrast ratios (4.5:1 for body text, 3:1 for large text)
- Status indicators never rely on colour alone — always paired with text or icons (e.g., "Verified ✓" not just a green dot)
- High contrast mode increases all contrast ratios to AAA (7:1)
- The design system's CSS custom properties make this a single `data-theme` toggle

**Text size:**
- Default, Large (+25%), Extra Large (+50%)
- Layout must reflow — no horizontal scrolling, no truncated content
- The Signet Me word display scales proportionally

**Motion:**
- `prefers-reduced-motion` media query is respected by default
- The "Reduce motion" toggle in Settings forces this regardless of system setting
- Affected: fade-in animations, checkmark animation, countdown transitions
- Reduced motion replaces animations with instant state changes

### 19.4 Motor accessibility

**Touch targets:**
- Minimum 48×48px for all interactive elements (Apple/Google standard)
- Buttons have generous padding — the existing design system already uses 12px padding, increase to 16px in accessible mode
- No drag gestures, no swipe-to-dismiss, no pinch-to-zoom required for any core flow
- All actions achievable via single tap

**One-tap credential display:**
- From the home screen, tapping your badge opens a full-screen credential view
- Large photo, large age badge, large "Verified" text
- Designed to be shown to another person (bouncer, steward) with no further interaction needed
- Auto-locks after 30 seconds (returns to home screen)

```
┌─────────────────────────────┐
│                             │
│                             │
│       ┌──────────┐          │
│       │          │          │
│       │  [PHOTO] │          │
│       │          │          │
│       └──────────┘          │
│                             │
│         18+  ✓              │
│       Verified              │
│                             │
│                             │
│    Tap anywhere to close    │
└─────────────────────────────┘
```

### 19.5 Cognitive and literacy accessibility

**PIN mode (§16):**
- Numeric codes instead of words
- Already specced — this is the primary accessibility feature for non-readers

**Minimal steps:**
- Core flows use the fewest possible steps
- Show credential: 1 tap from home
- Signet Me verification: 2 taps from home (tap person → words appear)
- No multi-step wizards for daily use — wizards are only for onboarding and verification ceremonies

**Clear visual feedback:**
- Green checkmark = confirmed
- Red cross = mismatch
- Amber warning = attention needed
- These icons are always paired with text labels (for colour blindness and screen readers)

**Simple language:**
- All user-facing text aims for reading age 11 (year 7 / 6th grade)
- No jargon, no technical terms, no acronyms without explanation
- Error messages explain what to do, not what went wrong

### 19.6 Audio verification mode

For users who can't see the screen well enough to read words or PINs:

```
Settings → Accessibility → Verification format → Audio
```

In audio mode, the Signet Me words are spoken aloud by the device:
- "Your word is marble"
- "Their word should be falcon"

The user can tap a "Speak" button to repeat at any time. This works with the phone's text-to-speech engine — no custom audio needed.

The verification input can also be voice: "Say the word they told you" → speech-to-text → matched against expected word.

**Note:** Audio mode in a noisy environment (pub, football ground) may not work well. PIN mode displayed at large size may be more practical in those contexts.

### 19.7 What's NOT covered here (needs further work)

These accessibility concerns require additional design work beyond the app's UI:

- **Non-smartphone users** — see §19.2 (Open Questions): printed QR card
- **Users who cannot take selfies** — alternative photo capture (verifier takes photo, family member assists)
- **Users who cannot attend a verification ceremony in person** — remote verification, home visits, or proxy verification through a trusted person
- **Users with no fixed address** — address verification alternatives

---

## 20. Open Questions (Pre-Production)

These items require further thought before production. They are acknowledged gaps, not oversights.

### 20.1 Credential portability

Users may switch from My Signet to another Signet-compatible app (e.g., Fathom). Credentials are standard Nostr events and can be exported. Merkle proofs could be transferred via QR or recovered from Blossom (if the user opted for Blossom backup).

**Vulnerability concern:** The transfer of Merkle proofs is a sensitive operation — the proofs contain private attribute data (name, DOB, etc.). The transfer mechanism must be end-to-end encrypted and authenticated. QR exchange (in person) is safe. Remote transfer via relay needs encryption. **This needs careful design before production — it is a potential vulnerability point.**

### 20.2 Printed QR card (non-smartphone users)

A downstream app concern, not a protocol issue. The protocol provides everything needed: a published credential with a QR-encodable pubkey, a photo hash in the Merkle tree, and optional Blossom storage for remote photo retrieval. Any app or third-party service can produce a physical card from this data.

Two tiers envisioned:
- **Print at home** — app generates a PDF with photo, age badge, QR code. Free, instant, low physical security. The QR is the real trust — scanning it verifies the credential cryptographically.
- **Professional print** — ordered via API from a card printing service (e.g., The Card Network, Cardaxis). PVC, hologram, tamper-evident. For non-smartphone users who need a standalone physical ID.

**This is an app-level feature, not a protocol change.** To be designed as part of the app's settings/ordering flow.

### 20.3 Physical ID fallback principle

Signet is an enhancement, never a gate. Any venue, service, or platform that accepts Signet SHOULD also accept traditional physical ID (passport, driving licence). Signet provides better privacy and stronger verification, but must never exclude someone who only has a passport.

---

## Appendix A: Duress Detection Proposal

**For security team review.**

Three new functions added to `src/signet-words.ts` (additive, no existing changes):

| Function | Purpose |
|----------|---------|
| `deriveSignetDuressWords(secret, identity, epoch)` | Derive safe words for a specific person |
| `getSignetDuressDisplay(secret, identity)` | UI bundle for safe words (with countdown) |
| `verifySignetWordsEnhanced(secret, words, identities)` | Returns `'valid'` / `'duress'` / `'invalid'` |

New type: `SignetVerifyResult = { status: 'valid' | 'duress' | 'invalid', identity?: string }`

Security considerations:
1. All branches computed before returning (prevents timing side-channels)
2. Uses `constantTimeEqual` for all comparisons
3. HMAC domain separator (`:duress` suffix) prevents collision with normal words
4. `deriveDuressTokenBytes` from canary-kit — same HMAC-SHA256 primitive already in use

Questions for review:
1. Is `deriveDuressTokenBytes` from canary-kit trustworthy for this use case?
2. Is the all-branches-before-return pattern sufficient to prevent timing attacks?
3. Should collision avoidance be added (checking duress words don't match normal words in the tolerance window)?

---

## Appendix B: Migration from Current Family App

The current `family-app/` codebase can be incrementally migrated:

| Current | v2 | Migration |
|---------|-----|-----------|
| Single keypair (`FamilyIdentity`) | Two keypairs (`SignetIdentity`) | Add second keypair, migrate existing as Natural Person |
| `verifySignetWords` (symmetric) | `verifySignetMe` (directional) | Already implemented — uses canary-kit directly |
| 3 hardcoded words | Configurable 1/2/3 via tier | Already implemented — `wordCount` prop |
| "Recovery phrase" language | "Backup words" language | Already implemented |
| Plaintext JSON export | Removed | Already implemented |
| Certificate download | Removed | Already implemented |
| Fake trust score | Removed | Already implemented |
| QR code on home screen | Family-first home | Already implemented |
| No credential storage | IndexedDB credential store | New — `useCredentials` hook + DB schema |
| No verification flow | Get Verified + Verify Someone | New — two new pages |
| No verifier activation | Hidden 5-tap activation | New — Settings enhancement |
