# Signet

[![GitHub Sponsors](https://img.shields.io/github/sponsors/TheCryptoDonkey?logo=githubsponsors&color=ea4aaa&label=Sponsor)](https://github.com/sponsors/TheCryptoDonkey)

**Decentralised identity verification for Nostr.**

Signet is an open protocol that enables users to prove claims about their identity — age, parenthood, professional status — using zero-knowledge proofs, without revealing personal data or relying on a central authority.

## What It Does

- **4 verification tiers**: self-declared → web-of-trust → professional adult → professional adult+child
- **Signet IQ** (0-200, where 100 = government standard): weighted by professional verification > in-person vouches > online vouches > account age
- **Verifier anti-corruption**: 6 layers of accountability for professional verifiers
- **ZKP age proofs**: prove "child aged 8-12" without revealing exact date of birth
- **Blue checkmarks for Nostr**: decentralised, cryptographic social proof for everyone
- **Community policies**: any relay, client, or community sets their own minimum verification requirements

## Why

Nostr has no identity layer. Anyone can claim to be anyone. This matters for child safety (a predator can create a fake child account), for trust (no way to prove "I met this person"), and for regulation (age verification laws are coming worldwide).

Signet solves this without centralised data collection. A professional verifies your identity in person. A ZKP credential attests to the result. No personal data is stored. No database to breach.

## Quick Start

```bash
npm install signet-protocol
```

Requires Node ≥22. ESM only (no CommonJS `require` export).

Display a verification badge for any Nostr user (Level 1: a weekend to integrate):

```typescript
import { computeBadge, buildBadgeFilters, fetchFromRelay, meetsMinimumTier } from 'signet-protocol';

const filters = buildBadgeFilters(['<hex-pubkey>']);
const events = await fetchFromRelay('wss://relay.example.com', filters);
const badge = await computeBadge('<hex-pubkey>', events, { verifySignatures: true });

// badge.tier => 3, badge.score => 106, badge.displayLabel => "Verified (Tier 3)"
// (illustrative values; badge.score is a Level 1 approximation, see the notes below)
if (meetsMinimumTier(badge, 2)) {
  // allow posting in verified-only community
}
```

`fetchFromRelay(relayUrl, filters)` is the package's own minimal relay client and returns `Promise<NostrEvent[]>`. Any other Nostr client works too: pass `buildBadgeFilters` output as the REQ filters and hand the resulting events to `computeBadge`. `computeBadge` is async and returns `Promise<BadgeInfo>`.

Three things to know before you copy this:

- `verifySignatures` defaults to `false`. A call such as `computeBadge(pubkey, events)` checks no signatures and trusts every event it is given, so keep `{ verifySignatures: true }` unless the events were already verified. `fetchFromRelay` drops events with an invalid signature or id by default; events from any other source are not checked for you.
- `badge.score` is on the 0-200 Signet IQ scale but is a Level 1 approximation of `computeTrustScore(...).score`: it ignores account age and identity bridges and applies none of the per-type caps (1 professional verification, 3 in-person vouches, 5 online vouches). Use `computeTrustScore` when you need the full score.
- `computeBadge` does not check who issued a Tier 3 or Tier 4 credential, and `buildBadgeFilters` does not fetch verifier or revocation events. Any key can sign an event that carries `tier: 3`, and it will count. To require that the issuer is an activated, unrevoked verifier, fetch the verifier credentials, their vouches and revocations yourself, apply `checkCrossVerification(...).activated` and `isVerifierRevoked(...)`, and drop other issuers' Tier 3 and Tier 4 credentials before calling `computeBadge`. [llms.txt](llms.txt) has the steps.

See [Signet in 5 Minutes](docs/signet-in-5-minutes.md) for a full developer overview, or the [full flow example](examples/full-flow.ts) for all 4 tiers, trust scoring, policies, and verifier lifecycle.

For LLM and agent tooling, [llms.txt](llms.txt) is a concise API overview and [llms-full.txt](llms-full.txt) adds the full protocol and voting specifications and the developer guides in one file. Both ship in the npm package, as do `spec/`, `examples/` and the four `docs/` pages linked from this README and `llms.txt` (`signet-in-5-minutes.md`, `implementation-levels.md`, `private-vault-v1.md` and `bot-ownership-v1.md`), so those relative links resolve inside `node_modules/signet-protocol/`. Other files under `docs/`, `legal/` and `tests/` stay in the repository only.

## Protocol

The full specification is at [`spec/protocol.md`](spec/protocol.md).

### Event Kinds

All identity attestations use a single NIP-VA kind (31000), differentiated by `type` tag:

| Kind | Type Tag | Name | Purpose |
|------|----------|------|---------|
| 31000 | `credential` | Verification Credential | Attests to a subject's verification tier |
| 31000 | `vouch` | Vouch Attestation | Peer vouch for another user |
| 30078 | — | Community Verification Policy | Minimum verification requirements (NIP-78) |
| 31000 | `verifier` | Verifier Credential | Professional declares verifier status |
| 31000 | `challenge` | Verifier Challenge | Challenge a verifier's legitimacy |
| 31000 | `revocation` | Verifier Revocation | Community confirms challenge, revokes verifier |
| 31000 | `identity-bridge` | Identity Bridge | Link two keypairs via ring signature |
| 31000 | `delegation` | Delegation | Guardian or agent delegation with scoped permission |

Voting extension: kinds 30482 (election), 30483 (ballot) and 30484 (election result) are specified in [`spec/voting.md`](spec/voting.md) and implemented in the separate [`nostr-anon-vote`](https://github.com/forgesworn/nostr-anon-vote) package, not in `signet-protocol`.

### Crypto Stack

```
Layer 1: Schnorr (secp256k1) — zero new dependencies
         Credential signing, Merkle selective disclosure,
         ring signatures for issuer privacy, MuSig2

Layer 2: Pedersen range proofs (secp256k1): age range proofs
         via @forgesworn/range-proof, no trusted setup

Layer 3: General-purpose ZK (future, if needed)
         Complex threshold proofs, recursive composition
```

## Status

**Status:** spec complete, TypeScript library implemented, reference apps functional. Seeking community feedback.

All identity attestations use kind 31000 (NIP-VA, Verifiable Attestations), differentiated by `type` tag.

## Implementation

This repo includes:
- `src/` — TypeScript protocol library (`signet-protocol` on npm)

The identity-tree API includes `deriveDependantIdentity(root, index)`, the
canonical My Signet/Fledgling derivation for `dependant-N-np` and
`dependant-N-persona`. Exact mnemonic-to-key vectors are frozen in the test
suite so recovery-compatible paths cannot drift silently.

Signet is a standalone protocol. Any Nostr client can implement it independently.

## Regulatory Compatibility

Signet is designed to satisfy identity verification requirements across jurisdictions:

| Regulation | Position |
|------------|----------|
| **UK Online Safety Act** | Tier 4 exceeds Ofcom's "highly effective age assurance" standard |
| **US COPPA** | No PII collected — exceeds FTC's March 2026 flexibility policy |
| **EU eIDAS 2.0** | Compatible with selective disclosure direction |
| **ISO/IEC 27566-1:2025** | Compatible with outcomes-based age assurance framework |
| **Australia under-16 ban** | Proves age range without central verification |

## Contributing

Feedback, NIP discussion, and contributions are welcome. Open an issue or submit a PR.

## Part of the ForgeSworn Toolkit

[ForgeSworn](https://forgesworn.dev) builds open-source cryptographic identity, payments, and coordination tools for Nostr.

| Library | What it does |
|---------|-------------|
| [nsec-tree](https://github.com/forgesworn/nsec-tree) | Deterministic sub-identity derivation |
| [ring-sig](https://github.com/forgesworn/ring-sig) | SAG/LSAG ring signatures on secp256k1 |
| [range-proof](https://github.com/forgesworn/range-proof) | Pedersen commitment range proofs |
| [canary-kit](https://github.com/forgesworn/canary-kit) | Coercion-resistant spoken verification |
| [spoken-token](https://github.com/forgesworn/spoken-token) | Human-speakable verification tokens |
| [toll-booth](https://github.com/forgesworn/toll-booth) | L402 payment middleware |
| [geohash-kit](https://github.com/forgesworn/geohash-kit) | Geohash toolkit with polygon coverage |
| [nostr-attestations](https://github.com/forgesworn/nostr-attestations) | NIP-VA verifiable attestations |
| [dominion](https://github.com/forgesworn/dominion) | Epoch-based encrypted access control |
| [nostr-veil](https://github.com/forgesworn/nostr-veil) | Privacy-preserving Web of Trust |

## Licence

MIT
