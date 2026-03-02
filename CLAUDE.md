# CLAUDE.md — Signet Protocol

## What This Is

Signet is an open-source identity verification protocol for Nostr. It uses zero-knowledge proofs to let users prove claims about their identity without revealing personal data.

This repo contains:
- `spec/protocol.md` — the full protocol specification
- `examples/` — example event payloads and flows (to be added)
- Implementation code (to be added)

## Key Concepts

- **4 verification tiers**: Tier 1 (self-declared) → Tier 2 (web-of-trust) → Tier 3 (professional adult) → Tier 4 (professional adult+child)
- **6 event kinds**: 30470 (credential), 30471 (vouch), 30472 (policy), 30473 (verifier), 30474 (challenge), 30475 (revocation)
- **Crypto stack**: Schnorr (secp256k1 base) + Bulletproofs (age range proofs) + future ZK layer
- **No central authority**: professional bodies (Law Society, medical boards, notary commissions) are the trust anchors

## Relationship to Fathom

Fathom (https://github.com/decented/decented) is the first reference implementation. Signet is protocol-level — it doesn't depend on Fathom or any specific client.

## Development

The protocol is at draft v0.1.0. Kind numbers are placeholders pending NIP allocation.

When implementation begins, the likely structure is:
- `src/` — TypeScript library for Signet credential creation, verification, and trust score computation
- `spec/` — protocol specification
- `examples/` — example events and flows
