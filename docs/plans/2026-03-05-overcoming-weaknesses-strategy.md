# Overcoming Signet's Seven Weaknesses — Strategic Analysis

> This is a strategic document, not a code implementation plan. It identifies leverage points, sequences dependencies, and proposes concrete solutions for each weakness.

---

## The Seven Weaknesses

1. **Bootstrapping** — who verifies the first verifiers?
2. **Professional bodies not equally strong globally** — billions of people in weak jurisdictions
3. **Complexity** — 11 event kinds, 9 entity types, 4 tiers
4. **No formal security audit** — composition unreviewed
5. **Adoption is a social problem** — institutional buy-in needed
6. **Nullifier depends on document uniqueness** — weak documents undermine the model
7. **Reference app is a demo** — not production software

---

## 1. Bootstrapping: The Trust Inception Problem

### Why it's hard
You cannot derive trust from a system that has no trust yet. The first verifiers must be trusted for reasons OUTSIDE the protocol. PGP's Web of Trust never solved this — it peaked at ~60K keys. Every CA-based system punted to browser vendors.

### The solution: One jurisdiction, one profession, hub-and-spoke

**Don't bootstrap globally. Bootstrap in the UK with solicitors.**

Why the UK specifically:
- SRA (Solicitors Regulation Authority) has a **free REST API** for registry cross-checks
- Solicitors already verify identity professionally (certifying passport copies is existing practice)
- UK Online Safety Act creates immediate commercial demand for age verification
- Common-law bridge to Australia, Canada, Singapore, Hong Kong

Why solicitors specifically:
- "Verify identity and sign a cryptographic attestation" maps directly onto "certify a copy of this passport" — minimal conceptual leap
- Revenue incentive: verification fees are a new service to offer
- Professional prestige: "founding member of a new professional standards body for digital identity"

**Concrete sequence:**
1. Identify 2-3 UK solicitors already active in Nostr/Bitcoin communities (Bitcoin Legal Defence Fund has contacts)
2. They recruit 3-5 colleagues from professional networks
3. Founding ceremony in London: in-person, video-documented, domain proofs published, SRA numbers cross-checked
4. 6-8 founding verifiers become the UK trust nucleus
5. UK solicitors verify UK residents → UK professionals in other fields become verifiers → UK-based international law firms bridge to other jurisdictions

**From one nucleus, the propagation path is organic.** Bitcoin started with one node.

---

## 2. Professional Bodies Not Equally Strong Globally

### Three distinct failure modes

| Mode | Example | Affected population |
|------|---------|-------------------|
| **Captured/corrupt bodies** | State-controlled "professional bodies" | ~1.5B people |
| **Nonexistent bodies** | No formal professional regulation | ~2B people |
| **Competent but non-digital** | Paper-based registries, no APIs | ~1B people |

### Solutions by failure mode

**Captured bodies → Cross-jurisdiction verification.** A person in a captured-body jurisdiction can be verified by a professional in a free-body jurisdiction (tourists, expats, international business, video call with enhanced safeguards). The spec already addresses government coercion (§18).

**Nonexistent bodies → Embassy model.** International NGOs (Red Cross, MSF) employ professionals licensed in high-confidence jurisdictions. International law firms have global offices. These serve as remote trust anchors.

**Non-digital bodies → Time solves this.** eIDAS 2.0 mandates machine-readable interfaces by December 2026. In the meantime, manual registry cross-checks (weighted lower than automated ones) serve as a bridge.

### The uncomfortable truth

Signet will not achieve universal Tier 3 coverage. The question is whether the coverage gap correlates with the need gap. Children in the UK, EU, US, Australia, and East Asia — where child safety demand is highest — are exactly the jurisdictions where professional bodies are strongest. For everyone else, **Tier 1 + Tier 2 (self-declared + peer vouches) are always available.** "Some trust" is infinitely better than "no trust," which is what Nostr has today.

### Implementation

A `jurisdictionConfidence` score has been added to `src/jurisdictions.ts`, computed from professional body coverage, public register availability, digital credential issuance, data protection maturity, mutual recognition partnerships, e-signature recognition, and legal system type. Clients can use `getJurisdictionConfidence()` to weight credentials from different jurisdictions accordingly.

---

## 3. Complexity: The Adoption Killer

### The core insight

Protocol complexity is not the same as implementation complexity. Identity IS complex. The question is whether the complexity is **layered** so developers can implement partially.

### Three implementation levels

**Level 1 — "Read Trust Badges" (a weekend of work)**
- Read 2 event kinds (30470 credential, 30471 vouch)
- Compute basic Signet IQ
- Display tier badges on profiles
- Zero crypto beyond Schnorr signature verification
- This is the NIP-05 equivalent

**Level 2 — "Issue Vouches" (a few days)**
- Level 1 + create kind 30471 (vouches) + read kind 30472 (policies)
- Users can vouch for each other, building Tier 2 networks
- Still no new crypto required
- This is the viral layer — peer vouching creates network effects

**Level 3 — "Full Protocol" (weeks to months)**
- All 11 event kinds, full crypto stack
- Merkle trees, Bulletproofs, ring signatures
- Reference implementation level

### Implementation

- `src/badge.ts` provides a drop-in Level 1 library (two event kinds, badge computation)
- `docs/implementation-levels.md` documents the three levels with code examples
- `docs/signet-in-5-minutes.md` provides the one-page mental model overview

---

## 4. No Formal Security Audit

### Prioritise by blast radius

| Priority | Component | Risk if broken | Estimated cost |
|----------|-----------|---------------|----------------|
| **Critical** | Ring signatures (`src/ring-signature.ts`) | Issuer privacy broken | $15-25K |
| **Critical** | Nullifier computation | Duplicate prevention fails | $10-15K |
| **Critical** | Bulletproofs age-range binding | Age verification broken | $15-25K |
| Important | Signet IQ computation | Gameable but not catastrophic | $10K |
| Deferrable | Anomaly detection | Client-side heuristics | $5K |
| Deferrable | Voting extension | Not needed for core identity | $20K |

**Staged approach:** Audit the 3 critical components first (~$40-65K). This is achievable through grants.

### Funding paths

1. **OpenSats / HRF grants** — both fund privacy tech and Nostr infrastructure. Child safety angle strengthens the application.
2. **Regulatory co-funding** — UK's ICO and Ofcom have innovation sandboxes. A ZKP age verification system is exactly what they want.
3. **Bug bounty** — Launch immediately on GitHub. $1K-$10K per finding for ring signature bypass, nullifier collision, age proof transplant, Signet IQ inflation.

---

## 5. Adoption: The Three-Sided Marketplace Cold Start

### The deadlock

- Professionals won't verify if no clients show badges
- Clients won't show badges if no users are verified
- Users won't get verified if no professionals are available

### The wedge: Child safety on Nostr

**Why this breaks the deadlock:**
1. Parents WANT their children safe online — emotional imperative, not a "nice to have"
2. Nostr has ZERO child safety infrastructure today
3. UK Online Safety Act + Australia's under-16 ban create LEGAL REQUIREMENTS
4. Home-schooling/Bitcoin families are a small but highly motivated early adopter group
5. A single client with Tier 4 child safety creates pull for verifier recruitment

### The adoption sequence

```
1. Build child safety in one client (Fathom)
   ↓ creates demand for verification
2. Recruit 6-8 UK solicitors as founding verifiers
   ↓ creates supply of verification
3. Verify first 50-100 families
   ↓ creates real users with real credentials
4. Ship Level 1 badges in 3-5 Nostr clients
   ↓ creates visibility ("why does that profile have a checkmark?")
5. Peer vouching (Tier 2) goes viral
   ↓ creates network effects without professionals
6. More professionals join (business incentive)
   ↓ creates expanding supply
7. Propose NIP from position of demonstrated adoption
```

### Why every participant has self-interest (not altruism)

| Participant | Incentive |
|-------------|-----------|
| Parent | Child safety. No alternative exists on Nostr. |
| Solicitor | New revenue stream. Professional prestige. |
| Client developer | Badge display is trivial. Users demand it. |
| Regular user | Social proof (checkmark). Access to verified communities. |
| Regulator | Compliance solution for Online Safety Act. |

**This is unlike PGP's Web of Trust**, where participation was pure altruism. Every participant in Signet has a self-interested reason.

### The anti-pattern to avoid

Do NOT try to get Signet adopted as a NIP before it has real-world usage. Ship working code in working clients. Get real users verified. Let adoption create consensus. THEN propose the NIP. Code first, consensus second. The Bitcoin playbook.

---

## 6. Nullifier: Imperfect but Sufficient

### The right comparison

The nullifier doesn't need to be perfect. It needs to be better than the status quo.

- **Without Signet:** Creating a fake Nostr identity costs nothing. Zero detection.
- **With Signet nullifiers:** Requires visiting a different professional with a different document, obtaining a fraudulent document, or finding a corrupt professional. Each has real-world cost and risk.

### Implementation: Multi-document nullifier families

When verifying, nullifiers are now computed for ALL documents presented, not just the primary. The credential includes all nullifiers via `nullifier-family` tags. Collision with ANY nullifier in ANY family triggers detection.

```
nullifier_passport = SHA-256("passport||GB||123456789||signet-v1")
nullifier_licence = SHA-256("driving_licence||GB||SMITH901150J99XX||signet-v1")
nullifier_national_id = SHA-256("national_id||GB||AB123456C||signet-v1")
```

See `computeNullifierFamily()` and `checkNullifierFamilyDuplicate()` in `src/credentials.ts`.

### The eIDAS bridge (massive opportunity)

EU eIDAS 2.0 mandates unique person identifiers for ~450M EU citizens by December 2026. If Signet accepts eIDAS wallet credentials as ceremony input, the eIDAS identifier becomes a de facto perfect nullifier for EU citizens.

---

## 7. Reference App → Verifier Toolkit

The reference app should not try to become a production user app. That's the job of Nostr clients.

**Instead, evolve it into the "Signet Verifier Toolkit"** — the professional's tool for performing verification ceremonies:
- Guided ceremony workflow (scan documents, compute nullifiers, build Merkle tree, generate proofs)
- Offline-capable (verifiers in areas with poor connectivity)
- Record-keeping for professional obligations
- Integration with professional body registries

For end users, the SDKs and Nostr client integrations are the adoption vehicle.

---

## The Single Most Important Leverage Point

If forced to choose ONE action:

**Get trust badges displayed in one major Nostr client.**

Not full protocol support. Not recruit verifiers. Not pass an audit. Just get Damus, Primal, or Amethyst to show "Verified Person" or "Unverified" next to profiles based on Signet credentials.

This is trivial to implement (Level 1 — two event kinds, a weekend). But it creates:
- Visibility for the protocol (every user sees it)
- Demand for verification (users want the badge)
- Motivation for professionals (visible market exists)
- Competitive pressure on other clients
- Data for grant applications and regulatory engagement

The protocol has 431 tests and a comprehensive spec. What it lacks is visibility. One badge in one client changes the game.

---

## Phased Roadmap

### Phase 1: Foundation (Months 1-3)
- Recruit 6-8 UK solicitors as founding verifiers
- Conduct founding ceremony with video, domain proofs, SRA cross-checks
- Write "Signet in 5 Minutes" developer overview
- Build Level 1 badge display as a drop-in library
- Launch bug bounty

### Phase 2: Demand (Months 3-6)
- Verify first 50-100 families through founding verifiers
- Ship Level 1 badges in 3+ Nostr clients
- Launch peer vouching (Tier 2) for viral growth
- Apply for security audit grants (OpenSats, HRF)
- Implement multi-document nullifier families

### Phase 3: Expansion (Months 6-12)
- Complete security audit (critical components)
- Expand to 3+ jurisdictions (AU, CA, one EU country)
- Engage Ofcom/ICO with audit results + adoption data
- Propose Nostr NIP from position of demonstrated adoption

### Phase 4: Maturity (Months 12-24)
- eIDAS 2.0 bridge for EU citizens
- Professional body direct attestation (at least one body)
- Jurisdiction confidence framework
- Reference app → Verifier Toolkit
- Voting extension audit and deployment
