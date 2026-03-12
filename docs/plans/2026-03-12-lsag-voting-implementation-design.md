# LSAG & Voting Implementation Design

**Date:** 2026-03-12
**Status:** Draft
**Depends on:** spec/voting.md, src/ring-signature.ts (SAG), src/secp256k1-utils.ts

## Overview

Implement linkable ring signatures (LSAG) and the voting protocol (kinds 30482-30484) for the Signet voting extension. LSAG enables one-person-one-vote enforcement via deterministic key images while preserving ballot secrecy through ring signature anonymity.

## Prerequisites

Before implementation begins:

1. **Update `spec/voting.md` kind numbers**: 30478 -> 30482, 30479 -> 30483, 30480 -> 30484 throughout the document body (sections 3.2, 4, and all examples). Add note about Dominion 30480-30481 reservation.
2. **Fix `spec/voting.md` section 5.3 step 3**: Remove misleading "random c_i" language; challenges are computed sequentially from the hash chain, not randomly generated.
3. **Update `spec/voting.md` section 6.1**: Change cipher specification to "AEAD cipher (AES-256-GCM recommended)" rather than mandating ChaCha20-Poly1305, since the reference implementation uses AES-256-GCM (available in Web Crypto API).

## Architecture

Two new modules following the existing codebase pattern of one file per concern:

```
src/lsag.ts       - LSAG crypto primitives (sign, verify, key image)
src/voting.ts     - Election protocol (create, cast, verify, tally)
tests/lsag.test.ts
tests/voting.test.ts  (extends current type-only tests with protocol-level tests)
```

Both modules reuse `secp256k1-utils.ts` for point arithmetic, `hashToScalar`, `randomScalar`, and related helpers. The existing SAG in `ring-signature.ts` is not modified.

## Changes to `src/secp256k1-utils.ts`

### `hashToPoint`

```typescript
function hashToPoint(data: Uint8Array): ProjectivePoint
```

Add a new `hashToPoint` function using the try-and-increment pattern. **Note:** `createGeneratorH` keeps its own implementation with its original seed (`Signet-Pedersen-Generator-H-v1`) because `hashToPoint` uses a different domain prefix (`signet-hash-to-point-v1`). Changing `H`'s derivation would break all existing Pedersen commitments. The two functions share the same pattern but produce different points.

Maps arbitrary bytes to a valid secp256k1 curve point using try-and-increment:
1. Domain prefix: `signet-hash-to-point-v1`
2. For counter `i` in `0..255`: compute `SHA-256(prefix || data || i)`, prepend `02`, attempt `Point.fromHex()`
3. Return the first valid point

Exported from `secp256k1-utils.ts` for use by `lsag.ts`.

### Key image

```typescript
function computeKeyImage(privateKey: string, publicKey: string, electionId: string): string
```

- Computes `I = x * H_p(P || electionId)` where `H_p` is `hashToPoint`
- Input encoding: concatenate the compressed (33-byte, `02`-prefixed) public key bytes with the UTF-8 bytes of the election ID d-tag. No separator needed; the fixed-length 33-byte prefix makes parsing unambiguous.
- Returns compressed point hex
- Deterministic: same inputs always produce the same key image
- Different election IDs produce different key images (cross-election unlinkability)

### Types

```typescript
interface LsagSignature {
  keyImage: string;      // compressed point hex
  c0: string;            // starting challenge scalar hex
  responses: string[];   // one scalar hex per ring member
  ring: string[];        // x-only pubkey hex array (internally converted to compressed points via '02' prefix, same as SAG)
  message: string;       // the signed message
  electionId: string;    // binds key image to this election
}
```

### Signing

```typescript
function lsagSign(
  message: string,
  ring: string[],
  signerIndex: number,
  privateKey: string,
  electionId: string
): LsagSignature
```

Following spec/voting.md section 5.3:

1. Validate ring size >= 2, signer index in range
2. Validate all pubkeys are 64-char hex (reuses `validatePubkeyHex` pattern from ring-signature.ts)
3. Apply BIP-340 parity fix (same as SAG)
4. Compute key image: `I = x * H_p(P_s || electionId)`
5. Generate random nonce `alpha`
6. Compute initial commitments: `L_s = alpha * G`, `R_s = alpha * H_p(P_s || electionId)`
7. Compute `c_{s+1} = hashToScalar(domainPrefix, msgBytes, ringBytes, L_s.toRawBytes(true), R_s.toRawBytes(true))`
8. For each non-signer index `i` (wrapping), generate random `r_i`:
   - `L_i = r_i * G + c_i * P_i`
   - `R_i = r_i * H_p(P_i || electionId) + c_i * I`
   - `c_{i+1} = hashToScalar(domainPrefix, msgBytes, ringBytes, L_i.toRawBytes(true), R_i.toRawBytes(true))`
9. Close the ring: `r_s = alpha - c_s * x_s (mod N)`
10. Return `{ keyImage, c0, responses, ring, message, electionId }`

**Fiat-Shamir hash construction:** Every challenge hash includes the domain prefix (`signet-lsag-v1` as UTF-8 bytes), the message bytes, the serialised ring (all x-only pubkeys concatenated, matching the SAG pattern of `ring.join(',')` encoded as UTF-8), and the two commitment points `L_i` and `R_i` as compressed bytes. Including the ring binds the signature to the specific ring (consistent with SAG). The `electionId` is already bound via the key image's `H_p` input.

### Verification

```typescript
function lsagVerify(sig: LsagSignature): boolean
```

1. Validate key image is a valid curve point (not identity)
2. Validate ring size >= 2, responses length matches ring
3. For each `i` from 0 to n-1:
   - `L_i = r_i * G + c_i * P_i`
   - `R_i = r_i * H_p(P_i || electionId) + c_i * I`
   - `c_{i+1} = hashToScalar(domainPrefix, msgBytes, ringBytes, L_i.toRawBytes(true), R_i.toRawBytes(true))`
4. Check `c_n == c_0` (ring closes)
5. Return true/false; catch exceptions and return false

### Utility

```typescript
function hasDuplicateKeyImage(keyImage: string, existingImages: string[]): boolean
```

Simple string comparison for tally/relay use.

## Module 2: `src/voting.ts`

### Election creation

```typescript
async function createElection(
  authorityPrivateKey: string,
  params: ElectionParams
): Promise<NostrEvent>
```

- Builds kind 30482 event with all required tags
- Validates: >= 2 options, closes > opens, >= 1 tally pubkey
- Signs with authority key

### Election parsing

```typescript
function parseElection(event: NostrEvent): ParsedElection | null
```

Parses kind 30482 into the existing `ParsedElection` type from `types.ts`.

### Ballot casting

```typescript
async function castBallot(
  voterPrivateKey: string,
  election: NostrEvent,
  selectedOption: string,
  eligibleRing: string[]
): Promise<{ event: NostrEvent; ephemeralPubkey: string }>
```

1. Validate voter's pubkey is in the eligible ring
2. Validate selected option is in the election's options
3. Validate election is open (current time within opens/closes)
4. Compute key image from voter's private key + election d-tag
5. Generate ephemeral keypair for the ballot event
6. Create LSAG signature over `electionId:selectedOption`
7. Encrypt vote to tally pubkey(s) using ECDH + AES-256-GCM:
   - Generate ephemeral encryption keypair `(k, K = k * G)`
   - Shared secret `S = SHA-256(k * T)` where `T` is tally pubkey
   - Derive key via HKDF-SHA256 with empty salt and info `signet-ballot-encrypt-v1`
   - Encrypt JSON `{"option": "<selected>"}` with AES-256-GCM
   - Output: `hex(K) || hex(nonce) || hex(ciphertext || tag)`
8. Build kind 30483 event signed with ephemeral key
9. Return event and ephemeral pubkey

### Ballot verification

```typescript
function verifyBallot(
  ballot: NostrEvent,
  election: NostrEvent,
  eligibleRing: string[]
): { valid: boolean; errors: string[] }
```

- Verifies LSAG signature against the eligible ring
- Checks key image is a valid point
- Checks election ID matches
- Checks election window (opens/closes)
- Does NOT check key image uniqueness (tally responsibility)

### Tally

```typescript
async function tallyElection(
  ballots: NostrEvent[],
  election: NostrEvent,
  tallyPrivateKey: string,
  eligibleRing: string[]
): Promise<NostrEvent>
```

1. Verify all ballots against the eligible ring
2. Deduplicate by key image: if re-vote allowed, keep ballot with latest `created_at`; if denied, reject duplicates
3. Decrypt vote content using tally private key (reverse the ECDH + AES-256-GCM)
4. Count results per option
5. Build and sign kind 30484 result event with result tags, totals, and invalid count

### Election validation

```typescript
function validateElection(event: NostrEvent): ValidationResult
function validateBallot(event: NostrEvent): ValidationResult
function validateElectionResult(event: NostrEvent): ValidationResult
```

Structural validation following the same pattern as `validateCredential` etc. These stay in `voting.ts` rather than `validation.ts` since the voting module is self-contained.

## Changes to Existing Files

### `src/secp256k1-utils.ts`
- Add new `hashToPoint` function (domain prefix: `signet-hash-to-point-v1`); export it
- `createGeneratorH` unchanged (preserves existing `H` point value with its own seed)

### `src/index.ts`
- Add exports from `lsag.ts` and `voting.ts`

### `src/constants.ts`
- No changes (kinds 30482-30484 already defined)

### `src/types.ts`
- No changes (all voting types already defined)

## Testing

### `tests/lsag.test.ts` - Crypto primitives

| Test | Purpose |
|------|---------|
| Sign and verify valid LSAG | Basic round-trip |
| Key image deterministic | Same inputs = same key image |
| Key image differs across elections | Cross-election unlinkability |
| Key image differs across signers | Different voters produce different images |
| Rejects tampered signature | Integrity |
| Rejects swapped ring member | Ring binding |
| Minimum ring size 2 | Boundary |
| Rejects malformed pubkey hex | Input validation |
| Rejects wrong key image point | Forgery resistance |
| Hash-to-point produces valid curve point | Correctness |
| Hash-to-point is deterministic | Consistency |
| Rejects identity point as key image | Verification safety |
| Ring order matters (different order = different signature) | Ring binding |

### `tests/voting.test.ts` - Protocol flow

| Test | Purpose |
|------|---------|
| Full flow: create election, cast, verify, tally | Integration |
| Re-voting: latest ballot wins | Coercion resistance |
| Re-voting denied: duplicate rejected | Policy enforcement |
| Duplicate key image detection in tally | One-person-one-vote |
| Election not yet open | Time window |
| Election already closed | Time window |
| Voter not in eligible ring | Eligibility |
| Invalid option rejected | Input validation |
| Encrypted vote round-trips | Encryption correctness |
| Multiple voters, correct tally | Accuracy |
| Election structural validation | Event format |

## Out of Scope

- **Threshold decryption** (multi-authority m-of-n) - requires DKG protocol; single tally key for v0.1.0
- **Encrypted ballot timing** (random delay) - client concern
- **National-scale optimisations** - future version per spec roadmap
- **Ballot encryption algorithm** - using AES-256-GCM (available in Node/Web Crypto) rather than ChaCha20-Poly1305; spec does not mandate a specific cipher
