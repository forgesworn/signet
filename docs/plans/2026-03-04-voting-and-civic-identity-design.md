# Voting, Civic Identity, and Adversarial Resilience Design

**Date:** 2026-03-04
**Status:** Accepted — implemented as spec/voting.md and spec/protocol.md §18-19

> **Architecture note:** The final implementation uses linkable ring signatures (not blind signatures as originally proposed in §2.3) for ballot secrecy. Option C from §5.3 was the chosen approach: civic identity in core spec, voting as a standalone extension.

## 1. Overview

This document explores three interconnected extensions to the Signet protocol:

1. **Voting** — cryptographically secure elections at organisational, community, and national scale
2. **Civic identity** — government-recognised Signet ID, warrant status verification, and privacy-preserving police interactions
3. **Adversarial resilience** — defences against government weaponisation of mandated digital identity

These emerged from a single thread: Signet already answers "is this a real, unique, verified person?" — which is the hardest unsolved problem in both digital voting and civic identity. The question is how far the protocol should extend beyond identity verification.

## 2. Voting

### 2.1 The Problem

Every voting fraud vector traces back to identity:

| Problem | Root Cause | Category |
|---|---|---|
| Impersonation fraud | Can't prove who you are | Identity |
| Multiple voting | Can't prove uniqueness | Identity |
| Ballot harvesting | Third parties submit ballots on behalf of voters | Chain of custody |
| Vote buying / bribery | Voter can prove how they voted to a buyer | Ballot secrecy |
| Coercion / undue influence | Voter can be forced to reveal or prove their vote | Ballot secrecy |
| Treating | Votes linkable to identity, enabling reward/punishment | Ballot secrecy |

Signet solves the identity problems (top rows). The ballot secrecy problems (bottom rows) require additional cryptography.

### 2.2 Three Scales

| Scale | Stakeholders | Secrecy Needs | Coercion Risk | Complexity |
|---|---|---|---|---|
| **Organisational** | Board members, committee, DAO governance | Often non-secret or low stakes | Low | Simple |
| **Community** | Relay governance, meetups, party policy votes | Ballot secrecy needed | Moderate | Moderate |
| **National** | Citizens of a country | Full secrecy + coercion resistance | High | Very high |

The pragmatic path: start with organisational/community voting. Get it bulletproof. National-scale is a future goal, not a launch requirement.

### 2.3 Architecture

**Eligibility** — handled by existing Signet credentials:
- Entity type determines who can vote (Natural Persons only? Juridical Persons too?)
- Verification tier sets the eligibility floor
- Community/organisation membership verified via existing vouch/credential events

**Ballot secrecy** — ~~blind signatures~~ **linkable ring signatures** (see architecture note at top):

> **Superseded:** The original design below proposed blind signatures. The final implementation uses linkable ring signatures instead — voters sign ballots using a ring of eligible pubkeys, proving membership without revealing identity. Link tags detect double-voting without a central authority. See `spec/voting.md` for the implemented design.

~~1. Voter proves eligibility to an election authority~~
~~2. Authority blind-signs a ballot token — cannot see the vote content, but confirms the voter is eligible and hasn't already received a token~~
~~3. Voter submits the blind-signed ballot anonymously~~
~~4. Anyone can verify: all ballots carry valid blind signatures, tally is correct, no ballot is double-counted~~

**One-person-one-vote** — ~~the blind signing authority tracks "has this pubkey received a ballot token for this election?" without knowing what's on the ballot.~~ linkable ring signatures produce a deterministic link tag per election; duplicate link tags reveal double-voting without revealing the voter.

**Coercion resistance** — re-voting (last vote counts):
- Voter receives a coerced instruction: "vote X while I watch"
- Voter complies, submits ballot for X
- Later, from a safe context, voter re-submits with a new ballot for Y
- Protocol rule: most recent valid ballot with a given link tag replaces all previous ones
- Coercer cannot determine whether the voter re-voted

This is not full JCJ-level coercion resistance, but it is practical, simple to implement, and sufficient for organisational/community elections. Full coercion resistance (fake credentials, deniable encryption) can be layered on later for national-scale elections.

**Verifiable tallying:**
- All ring-signed ballots are published (on Nostr relays)
- Anyone can count them and verify the tally
- No ballot can be linked to a voter (ring signature hides identity within the eligible set)
- Election authority cannot manipulate results without detection

### 2.4 Proposed Event Kinds

**Kind 30478 — Election Definition**

A replaceable event published by an election authority defining an election.

```jsonc
{
  "kind": 30478,
  "pubkey": "<election_authority_pubkey>",
  "tags": [
    ["d", "<election_id>"],
    ["title", "<election title>"],
    ["options", "<option_1>", "<option_2>", "..."],  // candidates or choices
    ["eligible-entity-types", "natural_person,persona"],
    ["eligible-min-tier", "2"],
    ["eligible-community", "<community_id>"],         // optional: restrict to community
    ["opens", "<unix_timestamp>"],
    ["closes", "<unix_timestamp>"],
    ["re-vote", "allowed"],                           // "allowed" or "denied"
    ["authority-pubkeys", "<pubkey1>", "<pubkey2>"],   // multiple authorities for decentralisation
    ["L", "signet"],
    ["l", "election", "signet"]
  ],
  "content": "<human-readable description of the election>"
}
```

**Kind 30479 — Ballot**

A replaceable event published anonymously by a voter.

```jsonc
{
  "kind": 30479,
  "pubkey": "<ephemeral_ballot_pubkey>",   // single-use key for this ballot
  "tags": [
    ["d", "<election_id>"],
    ["election", "<kind_30478_event_id>"],
    ["vote", "<selected_option>"],
    ["blind-sig", "<blind_signature_from_authority>"],
    ["token", "<ballot_token>"],           // for re-vote replacement
    ["L", "signet"],
    ["l", "ballot", "signet"]
  ],
  "content": ""
}
```

**Kind 30480 — Election Result**

A replaceable event published by the election authority (or anyone who tallies) with verified results.

```jsonc
{
  "kind": 30480,
  "pubkey": "<tallier_pubkey>",
  "tags": [
    ["d", "<election_id>"],
    ["election", "<kind_30478_event_id>"],
    ["result", "<option_1>", "<count>"],
    ["result", "<option_2>", "<count>"],
    ["total-ballots", "<count>"],
    ["total-eligible", "<count>"],
    ["L", "signet"],
    ["l", "election-result", "signet"]
  ],
  "content": "<optional: detailed breakdown or notes>"
}
```

### 2.5 Reference Use Case: Party Policy Votes

A political party (e.g., Restore Britain) wants to let members vote on policy positions:

1. Party establishes itself as a Juridical Person (verified organisation)
2. Members are verified Natural Persons who hold party membership credentials
3. Party leadership publishes a Kind 30478 election: "Should the party support X?"
4. Each member requests a blind-signed ballot token from the election authority
5. Members cast ballots anonymously (Kind 30479)
6. Anyone can tally and verify the result
7. If a member was coerced, they re-vote later — last ballot counts

This is achievable with existing Signet infrastructure plus the three new event kinds above.

## 3. Civic Identity

### 3.1 Government-Recognised Signet ID

A government could recognise Signet credentials as official identification. The critical difference from traditional national ID:

| Aspect | Traditional National ID | Signet ID |
|---|---|---|
| Who generates the identity | Government issues it | Citizen generates keypair |
| Who holds the master record | Government database | Citizen holds private key |
| What government stores | Name, DOB, address, photo, biometrics | Public key + attestation |
| Single point of failure | Government database breach = mass identity theft | No central database to breach |
| Revocation power | Government can cancel your identity | Government can revoke their attestation; your key still works with other verifiers |
| Surveillance capability | Full — they hold all your data | Limited — they hold a public key |

### 3.2 The Verification Flow

1. Citizen generates a Nostr keypair (12-word mnemonic)
2. Citizen visits a government office (like getting a passport today)
3. Government official verifies identity documents in person
4. Government issues a Signet credential (Kind 30470) to the citizen's pubkey: "This pubkey is a UK citizen"
5. Citizen and government official establish a connection (QR exchange, shared secret)
6. For future interactions, either party can verify the other: "Signet me"

### 3.3 Privacy-Preserving Police Interaction

**Warrant status check without identity disclosure:**

Current process:
1. Police stop a person
2. Ask for name
3. Run name through Police National Computer / NCIC
4. Check for warrants
5. If clear, person goes — but name, location, time are all logged

Signet process:
1. Police stop a person
2. Ask to verify status
3. Person's device presents a ZKP: "I hold a valid, non-revoked citizen credential"
4. Officer's device verifies the proof and checks revocation status
5. If clear, person goes — **no identity revealed**

**Mechanism: Revocable "good standing" credential**

- Government issues every verified citizen a "good standing" credential
- When a court issues a warrant, the credential is revoked (Kind 30475)
- The ZKP proves non-membership in the revocation set
- Ring signatures anonymise which specific credential is being proven
- Officer learns exactly one fact: this person is clear

**Legal framework requirement:** Showing the credential must be voluntary. Refusal alone must NOT be grounds for further action. Otherwise this becomes compulsory ID through the back door.

### 3.4 Separation of Official and Private Life

```
Citizen's registered pubkey (Natural Person)
  │  Used ONLY for government interactions:
  │  taxes, official correspondence, warrant checks
  │
  └──► Persona accounts (anonymous aliases)
       │  Used for private life:
       │  social media, communities, personal expression
       │  Ring signature proves "I am a real citizen"
       │  without revealing which one
       │
       └──► Free Personal Agents
            Bots/services under anonymous identity
```

The government knows the citizen's registered pubkey. They cannot link it to any Persona account without breaking the ring signature — which is computationally infeasible.

## 4. Adversarial Model

### 4.1 Threat Scenarios

If a government mandates Signet ID, every capability must be evaluated for adversarial use. The following table compares the current state, the trajectory without a decentralised alternative, and Signet's position.

| Scenario | Current State (2026) | Trajectory Without Decentralised Alt | With Signet |
|---|---|---|---|
| **Identity revocation** | Multiple ID forms exist. Losing one doesn't kill identity. | Centralised digital ID (EU eIDAS, UK DIATF) creates single points of failure. One revocation = locked out. India's Aadhaar locks people out of food rations. | Multiple independent credential issuers. No single revocation kills identity. Government revokes attestation, not identity itself. |
| **Anonymous participation** | Possible via cash, physical post, in-person. Diminishing with CCTV, card-only payments, phone tracking. | Cash elimination. Real-name platform verification (EU DSA, UK OSA). Anonymous speech criminalised or de-platformed. Trajectory: zero anonymity. | Ring signatures provide mathematical anonymity. Persona accounts unlinkable to Natural Person. Anonymous but verified participation is a protocol feature, not a loophole. |
| **Backdoored identity** | Government holds biometrics. Centralised databases. Citizen doesn't control infrastructure. | Mandatory government wallet apps. Closed-source, government-audited. Apple/Google as gatekeepers. Must use their app to have identity. | Open-source clients. Keys generated offline. Open spec anyone can implement. No mandated app. |
| **Retrospective de-anonymisation** | ISP logging (UK IPA). CCTV retained. Much activity still unrecorded. | AI retroactive analysis of CCTV, social media, location, payments. "Reconstruct your 2025" becomes routine. Facial recognition on stored footage. | Risk exists (quantum). Post-quantum crypto migration is plannable. Analogue world has NO defence against retrospective AI analysis. |
| **Mass surveillance** | GCHQ/NSA bulk collection. Smart city sensors. Mobile tracking. Mostly passive. | Real-time AI monitoring. IoT everywhere. China-model normalised as "public safety." Active, not passive. | Relay diversity across jurisdictions. Encrypted connections. Signet words work offline. Can't surveil what doesn't touch your infrastructure. |
| **Statistical de-anonymisation** | Browser fingerprinting, ad IDs, metadata analysis already de-anonymise routinely. | AI correlation attacks improve exponentially. Pseudonymity provides zero real protection. | Ring signatures stronger than pseudonymity — provable unlinkability. Larger rings = stronger guarantees. |
| **Social graph mapping** | Social media, phone contacts, email, payments reveal relationships. Government can request with warrants. | AI real-time social graph analysis. Cross-platform graph merging. No relationship private. | Persona-based connections unlinkable to Natural Person. Government key and social key cryptographically separated. |
| **Family structure exploitation** | Birth certs, school records, tax returns link families. Government knows family structure. | Centralised child identity systems. Family graphs cross-linked across all services. | ZKP proves "parent has child aged 8-12" without revealing which child, which school, any detail. |
| **Verifier coercion** | Government can pressure professionals via licensing. Professionals have some legal protections. | Professional independence eroded. Licensing bodies politicised. "Comply or lose licence" routine. | Multiple verifiers across jurisdictions and professions. No single jurisdiction's coercion captures entire verification chain. |
| **Election manipulation** | Paper ballots work reasonably for secrecy. Postal voting vulnerable. No crypto guarantees. | Digital voting without proper crypto. Centralised "trust us" counting. Convenience over security. | Blind signatures for secrecy. Re-voting for coercion resistance. Verifiable tallying anyone can audit. |

### 4.2 Defence Principles

Every defence follows the same principle: **decentralisation prevents single-entity control.**

1. **Multiple credential issuers** — no single entity's revocation kills your identity
2. **Open-source clients** — no mandated app can be secretly backdoored
3. **Relay diversity** — no single jurisdiction controls the communication layer
4. **Ring signatures with large rings** — statistical de-anonymisation requires infeasible computation
5. **Post-quantum migration path** — build crypto agility into the spec now
6. **Multiple election authorities** — no single signer controls ballot issuance
7. **Cross-jurisdiction verifiers** — professionals in different countries provide independent trust paths
8. **Voluntary credential presentation** — protocol must not enable compulsory ID through the back door

### 4.3 Formal Adversarial Requirement

The protocol MUST ensure that no single entity — including a nation-state — can unilaterally:

- Revoke a person's identity (only their own attestation)
- De-anonymise a Persona (without the private key)
- Coerce a vote (without detection)
- Surveil all activity (relay diversity defeats centralised monitoring)
- Weaponise credentials as social credit (multiple independent issuers)

## 5. Scope Review

### 5.1 What Naturally Belongs in Core Signet

- Entity type classification (already in spec §17) — needed for voter eligibility
- Identity bridge (already in spec §16) — needed for anonymous but verified voting
- Credential revocation (already in spec, Kind 30475) — needed for warrant status
- Signet IQ (already in spec §4) — could determine voting eligibility
- Adversarial resilience principles (§4.2-4.3 above) — should be in core spec as a design philosophy section

### 5.2 What Could Be a Separate Extension

- **Voting protocol** (Kinds 30478-30480) — self-contained, depends on Signet for identity but adds its own event kinds and crypto (blind signatures)
- **Civic identity specifics** — government credential types, warrant status, police interaction flows
- **Post-quantum migration** — crypto agility framework

### 5.3 Suggested Split

**Option A: Everything in core spec**
- Pro: one spec to read, one protocol to adopt
- Con: spec grows large, implementers must understand voting even if they only want identity

**Option B: Core + extensions**
- Core: identity, entity types, trust, adversarial principles
- Extension 1: Voting (Kinds 30478-30480, blind signatures, election flows)
- Extension 2: Civic identity (government credentials, warrant status, police flows)
- Pro: implementers adopt what they need
- Con: extensions may diverge, harder to maintain coherence

**Option C: Core + one extension**
- Core: identity, entity types, trust, adversarial principles, civic identity basics
- Extension: Voting protocol (the most self-contained piece)
- Pro: civic identity is natural for the core (it's just government as a verifier). Voting is genuinely separate crypto (blind signatures).

**Recommendation: Option C.** Civic identity is just "government uses Signet" — no new crypto, no new event kinds, just guidance on how governments fit the existing model. Voting introduces new event kinds and new cryptography (blind signatures). That's the natural split point.

## 6. Future Considerations

- **National-scale voting** — requires full JCJ coercion resistance (fake credentials, deniable encryption). Layer on top of the community voting protocol.
- **Post-quantum ring signatures** — essential for long-term Persona privacy. Build migration hooks into the spec now.
- **International credential recognition** — mutual recognition between governments using Signet. Similar to passport treaties but cryptographic.
- **Accessibility** — not everyone can manage 12-word mnemonics. Hardware tokens, trusted custodians, accessibility tooling.
- **Digital divide** — adoption requires that non-technical people can participate. UX is as important as crypto.
