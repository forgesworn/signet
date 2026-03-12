# LSAG & Voting Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement linkable ring signatures (LSAG) and the voting protocol (kinds 30482-30484) for signet, enabling one-person-one-vote enforcement via key images while preserving ballot secrecy.

**Architecture:** Two new modules: `src/lsag.ts` (crypto primitives) and `src/voting.ts` (election protocol). Both build on `secp256k1-utils.ts` which gains a new `hashToPoint` export. The existing SAG in `ring-signature.ts` is untouched.

**Tech Stack:** @noble/curves (secp256k1), @noble/hashes (sha256, hkdf), Web Crypto API (AES-256-GCM), vitest

**Spec:** `docs/plans/2026-03-12-lsag-voting-implementation-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `spec/voting.md` | Modify | Fix kind numbers, signing step 3, cipher spec |
| `src/secp256k1-utils.ts` | Modify | Extract `hashToPoint`, export it |
| `src/lsag.ts` | Create | LSAG sign, verify, key image, types |
| `src/voting.ts` | Create | Election create/parse, ballot cast/verify, tally, validation |
| `tests/lsag.test.ts` | Create | LSAG crypto primitive tests |
| `tests/voting.test.ts` | Modify | Add protocol-level tests (keep existing type tests) |
| `src/index.ts` | Modify | Export LSAG + voting functions |

---

## Chunk 1: Spec Prerequisites + hashToPoint + LSAG Primitives

### Task 1: Update spec/voting.md

**Files:**
- Modify: `spec/voting.md`

- [ ] **Step 1: Update kind numbers throughout spec**

Find-and-replace in `spec/voting.md`:
- `30478` -> `30482` (Election)
- `30479` -> `30483` (Ballot)
- `30480` -> `30484` (Election Result)

Add a note after the kind table:

```markdown
> **Note:** Kinds 30480-30481 are reserved for the Dominion Protocol (vault share, vault config).
```

- [ ] **Step 2: Fix section 5.3 step 3**

In section 5.3 (LSAG Signing), replace the misleading step 3 that says "generate random scalars c_i and r_i" with:

```markdown
3. For each non-signer index i (wrapping from s+1 back to s), generate a random response r_i. Compute the challenge c_{i+1} sequentially from the hash chain: c_{i+1} = H(m || L_i || R_i).
```

- [ ] **Step 3: Update section 6.1 cipher**

In section 6.1 (Encrypted Ballots), change "ChaCha20-Poly1305" to:

```markdown
AEAD cipher (AES-256-GCM recommended; available in Web Crypto API across all target runtimes)
```

- [ ] **Step 4: Commit**

```bash
git add spec/voting.md
git commit -m "fix: update voting spec kind numbers, signing description, and cipher"
```

---

### Task 2: Extract hashToPoint into secp256k1-utils.ts

**Files:**
- Modify: `src/secp256k1-utils.ts:75-94`

- [ ] **Step 1: Write test for hashToPoint**

Create `tests/secp256k1-utils.test.ts` (or add to existing if present). Since `secp256k1-utils.ts` is internal, test via the public effect: existing tests that use `H` should still pass, plus add a direct test.

Actually, `hashToPoint` will be tested via `lsag.test.ts` (Task 4). For now, just refactor and verify existing tests pass.

- [ ] **Step 2: Extract hashToPoint function**

In `src/secp256k1-utils.ts`, replace lines 75-94 with:

```typescript
/**
 * Hash arbitrary data to a valid secp256k1 curve point using try-and-increment.
 * Domain-separated with the provided seed prefix.
 */
export function hashToPoint(data: Uint8Array): ProjectivePoint {
  const prefix = utf8ToBytes('signet-hash-to-point-v1');
  for (let i = 0; i < 256; i++) {
    const buf = new Uint8Array(prefix.length + data.length + 1);
    buf.set(prefix);
    buf.set(data, prefix.length);
    buf[prefix.length + data.length] = i;
    const h = sha256(buf);
    const hex = '02' + bytesToHex(h);
    try {
      const point = Point.fromHex(hex);
      point.assertValidity();
      return point;
    } catch {
      continue;
    }
  }
  throw new Error('Failed to hash to curve point');
}

/**
 * Generator H: nothing-up-my-sleeve second generator for Pedersen commitments.
 * Created by hashing to a curve point; nobody knows log_G(H).
 */
function createGeneratorH(): ProjectivePoint {
  const seed = utf8ToBytes('Signet-Pedersen-Generator-H-v1');
  for (let i = 0; i < 256; i++) {
    const buf = new Uint8Array(seed.length + 1);
    buf.set(seed);
    buf[seed.length] = i;
    const h = sha256(buf);
    const hex = '02' + bytesToHex(h);
    try {
      const point = Point.fromHex(hex);
      point.assertValidity();
      return point;
    } catch {
      continue;
    }
  }
  throw new Error('Failed to generate H point');
}

export const H = createGeneratorH();
```

**Important:** `createGeneratorH` keeps its own seed (`Signet-Pedersen-Generator-H-v1`) and does NOT use `hashToPoint`, because `hashToPoint` uses a different domain prefix (`signet-hash-to-point-v1`). Changing `H`'s derivation would break all existing Pedersen commitments. The two functions share the same *pattern* but produce different points.

- [ ] **Step 3: Run existing tests to verify no regression**

Run: `cd /Users/darren/WebstormProjects/signet && npm test`
Expected: All 538 tests pass. The `H` generator point must be identical.

- [ ] **Step 4: Commit**

```bash
git add src/secp256k1-utils.ts
git commit -m "refactor: extract hashToPoint from secp256k1-utils for LSAG use"
```

---

### Task 3: LSAG Types and Key Image

**Files:**
- Create: `src/lsag.ts`
- Create: `tests/lsag.test.ts`

- [ ] **Step 1: Write failing tests for hashToPoint and computeKeyImage**

Create `tests/lsag.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeKeyImage, lsagSign, lsagVerify, hasDuplicateKeyImage } from '../src/lsag.js';
import { generateKeyPair } from '../src/crypto.js';

describe('LSAG', () => {
  // Generate test keys once
  const signer = generateKeyPair();
  const other1 = generateKeyPair();
  const other2 = generateKeyPair();
  const ring = [signer.publicKey, other1.publicKey, other2.publicKey];
  const electionId = 'test-election-2026';

  describe('hashToPoint', () => {
    it('produces deterministic results', async () => {
      // hashToPoint is internal, but we can test via computeKeyImage determinism
      const img1 = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      const img2 = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      expect(img1).toBe(img2);
    });
  });

  describe('computeKeyImage', () => {
    it('is deterministic for same inputs', () => {
      const img1 = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      const img2 = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      expect(img1).toBe(img2);
      expect(img1).toMatch(/^[0-9a-f]{66}$/); // compressed point = 33 bytes = 66 hex
    });

    it('differs across elections', () => {
      const img1 = computeKeyImage(signer.privateKey, signer.publicKey, 'election-A');
      const img2 = computeKeyImage(signer.privateKey, signer.publicKey, 'election-B');
      expect(img1).not.toBe(img2);
    });

    it('differs across signers', () => {
      const img1 = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      const img2 = computeKeyImage(other1.privateKey, other1.publicKey, electionId);
      expect(img1).not.toBe(img2);
    });
  });

  describe('hasDuplicateKeyImage', () => {
    it('returns true when key image exists', () => {
      const img = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      expect(hasDuplicateKeyImage(img, [img])).toBe(true);
    });

    it('returns false when key image is new', () => {
      const img = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      expect(hasDuplicateKeyImage(img, [])).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/lsag.test.ts`
Expected: FAIL - cannot resolve `../src/lsag.js`

- [ ] **Step 3: Implement LsagSignature type, computeKeyImage, and hasDuplicateKeyImage**

Create `src/lsag.ts`:

```typescript
// LSAG (Linkable Spontaneous Anonymous Group) Ring Signatures
// Extends SAG with key images for double-vote detection in the voting protocol.

import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import {
  Point,
  N,
  type ProjectivePoint,
  mod,
  randomScalar,
  scalarToHex,
  hexToScalar,
  hashToScalar,
  hashToPoint,
  safeMultiply,
  scalarEqual,
  G,
} from './secp256k1-utils.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LsagSignature {
  /** Compressed point hex (33 bytes / 66 hex chars) */
  keyImage: string;
  /** Starting challenge scalar hex */
  c0: string;
  /** One scalar hex per ring member */
  responses: string[];
  /** X-only pubkey hex array (internally converted via '02' prefix, same as SAG) */
  ring: string[];
  /** The signed message */
  message: string;
  /** Binds key image to this election */
  electionId: string;
}

// ── Domain Prefixes ──────────────────────────────────────────────────────────

const LSAG_DOMAIN = utf8ToBytes('signet-lsag-v1');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Validate an x-only public key is exactly 64 hex characters. */
function validatePubkeyHex(pubkeyHex: string): void {
  if (!/^[0-9a-f]{64}$/i.test(pubkeyHex)) {
    throw new Error(`Invalid x-only public key: expected 64 hex chars, got ${pubkeyHex.length} chars`);
  }
}

/** Load a public key from x-only hex to a curve point (even y). */
function pubkeyToPoint(pubkeyHex: string): ProjectivePoint {
  validatePubkeyHex(pubkeyHex);
  return Point.fromHex('02' + pubkeyHex);
}

/**
 * Compute H_p(P || electionId) - the per-member, per-election hash point.
 * P is the compressed (33-byte, 02-prefixed) public key.
 */
function hashPointForMember(pubkeyHex: string, electionId: string): ProjectivePoint {
  const compressedPubkey = hexToBytes('02' + pubkeyHex);
  const electionBytes = utf8ToBytes(electionId);
  const data = new Uint8Array(compressedPubkey.length + electionBytes.length);
  data.set(compressedPubkey);
  data.set(electionBytes, compressedPubkey.length);
  return hashToPoint(data);
}

// ── Key Image ────────────────────────────────────────────────────────────────

/**
 * Compute a deterministic key image for a voter in a specific election.
 * I = x * H_p(P || electionId)
 *
 * @param privateKey - Voter's private key (hex)
 * @param publicKey - Voter's x-only public key (hex)
 * @param electionId - Election d-tag identifier
 * @returns Compressed point hex (66 chars)
 */
export function computeKeyImage(privateKey: string, publicKey: string, electionId: string): string {
  let x = hexToScalar(privateKey);

  // BIP-340 parity fix: if x*G has odd y, negate x
  const P = G.multiply(x);
  const pAffine = P.toAffine();
  if (pAffine.y % 2n !== 0n) {
    x = mod(N - x);
  }

  const Hp = hashPointForMember(publicKey, electionId);
  const I = Hp.multiply(x);
  return bytesToHex(I.toRawBytes(true)); // compressed, 33 bytes
}

// ── Utility ──────────────────────────────────────────────────────────────────

/** Check if a key image already exists in a list (simple string comparison). */
export function hasDuplicateKeyImage(keyImage: string, existingImages: string[]): boolean {
  return existingImages.includes(keyImage);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/lsag.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lsag.ts tests/lsag.test.ts
git commit -m "feat: add LSAG key image computation and types"
```

---

### Task 4: LSAG Signing

**Files:**
- Modify: `src/lsag.ts`
- Modify: `tests/lsag.test.ts`

- [ ] **Step 1: Add signing test to tests/lsag.test.ts**

Append inside the top-level `describe('LSAG', ...)`:

```typescript
  describe('lsagSign', () => {
    it('produces a valid signature structure', () => {
      const sig = lsagSign('test message', ring, 0, signer.privateKey, electionId);
      expect(sig.keyImage).toMatch(/^[0-9a-f]{66}$/);
      expect(sig.c0).toMatch(/^[0-9a-f]{64}$/);
      expect(sig.responses).toHaveLength(3);
      expect(sig.ring).toEqual(ring);
      expect(sig.message).toBe('test message');
      expect(sig.electionId).toBe(electionId);
    });

    it('rejects ring size < 2', () => {
      expect(() => lsagSign('msg', [signer.publicKey], 0, signer.privateKey, electionId))
        .toThrow('Ring must have at least 2 members');
    });

    it('rejects signer index out of range', () => {
      expect(() => lsagSign('msg', ring, 5, signer.privateKey, electionId))
        .toThrow('Signer index out of range');
    });

    it('rejects malformed pubkey hex', () => {
      expect(() => lsagSign('msg', ['not-a-key', other1.publicKey], 0, signer.privateKey, electionId))
        .toThrow('Invalid x-only public key');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/lsag.test.ts`
Expected: FAIL - `lsagSign is not a function` (not yet implemented)

- [ ] **Step 3: Implement lsagSign in src/lsag.ts**

Add to `src/lsag.ts` after the `hasDuplicateKeyImage` function:

```typescript
// ── Signing ──────────────────────────────────────────────────────────────────

/**
 * Compute the Fiat-Shamir challenge hash for LSAG.
 * H(domainPrefix || message || ring || L || R)
 */
function challengeHash(
  msgBytes: Uint8Array,
  ringBytes: Uint8Array,
  L: ProjectivePoint,
  R: ProjectivePoint,
): bigint {
  return hashToScalar(LSAG_DOMAIN, msgBytes, ringBytes, L.toRawBytes(true), R.toRawBytes(true));
}

/**
 * Create an LSAG ring signature.
 *
 * @param message - The message to sign
 * @param ring - Array of x-only public keys (hex) forming the anonymity set
 * @param signerIndex - Index of the actual signer in the ring
 * @param privateKey - Signer's private key (hex)
 * @param electionId - Election identifier (binds key image to this election)
 * @returns An LSAG signature with key image
 */
export function lsagSign(
  message: string,
  ring: string[],
  signerIndex: number,
  privateKey: string,
  electionId: string,
): LsagSignature {
  if (ring.length < 2) throw new Error('Ring must have at least 2 members');
  if (signerIndex < 0 || signerIndex >= ring.length) throw new Error('Signer index out of range');

  const n = ring.length;
  const pi = signerIndex;
  let x = hexToScalar(privateKey);
  const msgBytes = utf8ToBytes(message);
  const ringBytes = utf8ToBytes(ring.join(','));

  // Load ring public keys as curve points
  const ringPoints = ring.map(pubkeyToPoint);

  // BIP-340 parity fix
  const P = G.multiply(x);
  const pAffine = P.toAffine();
  if (pAffine.y % 2n !== 0n) {
    x = mod(N - x);
  }

  // Compute key image: I = x * H_p(P_s || electionId)
  const HpSigner = hashPointForMember(ring[pi], electionId);
  const I = HpSigner.multiply(x);
  const keyImage = bytesToHex(I.toRawBytes(true));

  // Generate random nonce
  const alpha = randomScalar();

  // Initial commitments
  const L_s = G.multiply(alpha);
  const R_s = HpSigner.multiply(alpha);

  // Compute c_{pi+1}
  const challenges: bigint[] = new Array(n);
  const responses: bigint[] = new Array(n);

  const nextIdx = (pi + 1) % n;
  challenges[nextIdx] = challengeHash(msgBytes, ringBytes, L_s, R_s);

  // Fill non-signer indices
  for (let j = 1; j < n; j++) {
    const i = (pi + j) % n;
    const iNext = (i + 1) % n;

    responses[i] = randomScalar();

    // L_i = r_i * G + c_i * P_i
    const L_i = safeMultiply(G, responses[i]).add(safeMultiply(ringPoints[i], challenges[i]));

    // R_i = r_i * H_p(P_i || electionId) + c_i * I
    const HpI = hashPointForMember(ring[i], electionId);
    const R_i = safeMultiply(HpI, responses[i]).add(safeMultiply(I, challenges[i]));

    if (iNext !== nextIdx || j < n - 1) {
      challenges[iNext] = challengeHash(msgBytes, ringBytes, L_i, R_i);
    }
  }

  // Close the ring: r_s = alpha - c_s * x (mod N)
  responses[pi] = mod(alpha - mod(challenges[pi] * x));

  return {
    keyImage,
    c0: scalarToHex(challenges[0]),
    responses: responses.map(scalarToHex),
    ring,
    message,
    electionId,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/lsag.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lsag.ts tests/lsag.test.ts
git commit -m "feat: implement LSAG signing"
```

---

### Task 5: LSAG Verification

**Files:**
- Modify: `src/lsag.ts`
- Modify: `tests/lsag.test.ts`

- [ ] **Step 1: Add verification tests to tests/lsag.test.ts**

Append inside the top-level `describe('LSAG', ...)`:

```typescript
  describe('lsagVerify', () => {
    it('accepts a valid signature', () => {
      const sig = lsagSign('verify me', ring, 0, signer.privateKey, electionId);
      expect(lsagVerify(sig)).toBe(true);
    });

    it('accepts signature from any ring position', () => {
      // Signer at index 1
      const ring2 = [other1.publicKey, signer.publicKey, other2.publicKey];
      const sig = lsagSign('position test', ring2, 1, signer.privateKey, electionId);
      expect(lsagVerify(sig)).toBe(true);
    });

    it('rejects tampered message', () => {
      const sig = lsagSign('original', ring, 0, signer.privateKey, electionId);
      sig.message = 'tampered';
      expect(lsagVerify(sig)).toBe(false);
    });

    it('rejects tampered response', () => {
      const sig = lsagSign('test', ring, 0, signer.privateKey, electionId);
      // Flip a bit in the first response
      const r = BigInt('0x' + sig.responses[0]);
      sig.responses[0] = (r ^ 1n).toString(16).padStart(64, '0');
      expect(lsagVerify(sig)).toBe(false);
    });

    it('rejects swapped ring member', () => {
      const sig = lsagSign('test', ring, 0, signer.privateKey, electionId);
      const extra = generateKeyPair();
      sig.ring = [extra.publicKey, ...sig.ring.slice(1)];
      expect(lsagVerify(sig)).toBe(false);
    });

    it('rejects wrong key image', () => {
      const sig = lsagSign('test', ring, 0, signer.privateKey, electionId);
      // Use key image from a different election
      const wrongImage = computeKeyImage(signer.privateKey, signer.publicKey, 'other-election');
      sig.keyImage = wrongImage;
      expect(lsagVerify(sig)).toBe(false);
    });

    it('rejects identity point as key image', () => {
      const sig = lsagSign('test', ring, 0, signer.privateKey, electionId);
      // Point at infinity has no standard compressed hex; use a zeroed representation
      // The verification should catch this as invalid
      sig.keyImage = '00'.repeat(33);
      expect(lsagVerify(sig)).toBe(false);
    });

    it('ring order matters', () => {
      const sig = lsagSign('test', ring, 0, signer.privateKey, electionId);
      // Reverse the ring (but keep responses in original order)
      const reversed = [...ring].reverse();
      sig.ring = reversed;
      expect(lsagVerify(sig)).toBe(false);
    });

    it('key image matches computeKeyImage output', () => {
      const sig = lsagSign('test', ring, 0, signer.privateKey, electionId);
      const expected = computeKeyImage(signer.privateKey, signer.publicKey, electionId);
      expect(sig.keyImage).toBe(expected);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/lsag.test.ts`
Expected: FAIL - `lsagVerify is not a function`

- [ ] **Step 3: Implement lsagVerify in src/lsag.ts**

Add after `lsagSign`:

```typescript
// ── Verification ─────────────────────────────────────────────────────────────

/**
 * Verify an LSAG ring signature.
 *
 * @param sig - The LSAG signature to verify
 * @returns true if the signature is valid
 */
export function lsagVerify(sig: LsagSignature): boolean {
  try {
    const { keyImage, c0, responses, ring, message, electionId } = sig;

    if (ring.length < 2) return false;
    if (responses.length !== ring.length) return false;

    // Validate key image is a valid curve point (not identity)
    const I = Point.fromHex(keyImage);
    I.assertValidity();
    if (I.equals(Point.ZERO)) return false;

    const n = ring.length;
    const msgBytes = utf8ToBytes(message);
    const ringBytes = utf8ToBytes(ring.join(','));
    const ringPoints = ring.map(pubkeyToPoint);

    let c = hexToScalar(c0);

    for (let i = 0; i < n; i++) {
      const s = hexToScalar(responses[i]);

      // L_i = r_i * G + c_i * P_i
      const L_i = safeMultiply(G, s).add(safeMultiply(ringPoints[i], c));

      // R_i = r_i * H_p(P_i || electionId) + c_i * I
      const HpI = hashPointForMember(ring[i], electionId);
      const R_i = safeMultiply(HpI, s).add(safeMultiply(I, c));

      // c_{i+1}
      c = challengeHash(msgBytes, ringBytes, L_i, R_i);
    }

    // Ring must close: computed c_n == c_0
    return scalarEqual(c, hexToScalar(c0));
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/lsag.test.ts`
Expected: All 18 tests PASS

- [ ] **Step 5: Run full test suite for regression**

Run: `cd /Users/darren/WebstormProjects/signet && npm test`
Expected: All tests pass (538 existing + 18 new)

- [ ] **Step 6: Commit**

```bash
git add src/lsag.ts tests/lsag.test.ts
git commit -m "feat: implement LSAG verification with full test coverage"
```

---

## Chunk 2: Voting Protocol

### Task 6: Election Creation and Parsing

**Files:**
- Create: `src/voting.ts`
- Modify: `tests/voting.test.ts`

**Context:** Follow the pattern from `src/credentials.ts` (`buildCredentialEvent`) and `src/validation.ts` (`validateCredential`). Election events are kind 30482. Tags come from `src/types.ts:ElectionParams`. Use `signEvent` from `src/crypto.ts`.

- [ ] **Step 1: Write failing tests for createElection and parseElection**

Add to `tests/voting.test.ts` after the existing `describe('voting extension', ...)` block (keeping all existing tests):

```typescript
import {
  createElection,
  parseElection,
  validateElection,
} from '../src/voting.js';
import { generateKeyPair } from '../src/crypto.js';
import type { ElectionParams, NostrEvent } from '../src/types.js';

describe('voting protocol', () => {
  const authority = generateKeyPair();
  const tallyKey = generateKeyPair();
  const now = Math.floor(Date.now() / 1000);

  const validParams: ElectionParams = {
    electionId: 'test-election-2026',
    title: 'Board Election 2026',
    description: 'Annual board member vote',
    options: ['Alice', 'Bob', 'Carol'],
    scale: 'organisational',
    eligibleEntityTypes: ['natural_person'],
    eligibleMinTier: 2,
    opens: now + 3600,
    closes: now + 86400,
    reVote: 'allowed',
    tallyPubkeys: [tallyKey.publicKey],
  };

  describe('createElection', () => {
    it('creates a valid kind 30482 event', async () => {
      const event = await createElection(authority.privateKey, validParams);
      expect(event.kind).toBe(30482);
      expect(event.pubkey).toBe(authority.publicKey);
      expect(event.id).toBeDefined();
      expect(event.sig).toBeDefined();
    });

    it('includes all required tags', async () => {
      const event = await createElection(authority.privateKey, validParams);
      const tag = (name: string) => event.tags.find(t => t[0] === name)?.[1];
      expect(tag('d')).toBe('test-election-2026');
      expect(tag('title')).toBe('Board Election 2026');
      expect(tag('scale')).toBe('organisational');
      expect(tag('opens')).toBe(String(now + 3600));
      expect(tag('closes')).toBe(String(now + 86400));
      expect(tag('re-vote')).toBe('allowed');
      expect(tag('L')).toBe('signet');
      expect(tag('algo')).toBe('secp256k1');
      // Options should be multiple tags
      const options = event.tags.filter(t => t[0] === 'option').map(t => t[1]);
      expect(options).toEqual(['Alice', 'Bob', 'Carol']);
      // Tally pubkeys
      const tally = event.tags.filter(t => t[0] === 'tally-pubkey').map(t => t[1]);
      expect(tally).toEqual([tallyKey.publicKey]);
    });

    it('rejects fewer than 2 options', async () => {
      const bad = { ...validParams, options: ['Only'] };
      await expect(createElection(authority.privateKey, bad)).rejects.toThrow('at least 2 options');
    });

    it('rejects closes <= opens', async () => {
      const bad = { ...validParams, closes: validParams.opens - 1 };
      await expect(createElection(authority.privateKey, bad)).rejects.toThrow('closes must be after opens');
    });

    it('rejects empty tally pubkeys', async () => {
      const bad = { ...validParams, tallyPubkeys: [] };
      await expect(createElection(authority.privateKey, bad)).rejects.toThrow('at least 1 tally pubkey');
    });
  });

  describe('parseElection', () => {
    it('round-trips through create and parse', async () => {
      const event = await createElection(authority.privateKey, validParams);
      const parsed = parseElection(event);
      expect(parsed).not.toBeNull();
      expect(parsed!.electionId).toBe('test-election-2026');
      expect(parsed!.title).toBe('Board Election 2026');
      expect(parsed!.options).toEqual(['Alice', 'Bob', 'Carol']);
      expect(parsed!.scale).toBe('organisational');
      expect(parsed!.opens).toBe(now + 3600);
      expect(parsed!.closes).toBe(now + 86400);
      expect(parsed!.reVote).toBe('allowed');
      expect(parsed!.authorityPubkey).toBe(authority.publicKey);
      expect(parsed!.tallyPubkeys).toEqual([tallyKey.publicKey]);
    });

    it('returns null for wrong kind', () => {
      const bad = { kind: 30470, tags: [], pubkey: '', content: '', id: '', sig: '', created_at: 0 } as NostrEvent;
      expect(parseElection(bad)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: FAIL - cannot resolve `../src/voting.js`

- [ ] **Step 3: Implement createElection and parseElection**

Create `src/voting.ts`:

```typescript
// Signet Voting Protocol
// Election creation, ballot casting, verification, and tally (kinds 30482-30484)

import { getPublicKey, signEvent } from './crypto.js';
import { SIGNET_KINDS, SIGNET_LABEL, DEFAULT_CRYPTO_ALGORITHM } from './constants.js';
import { getTagValue } from './validation.js';
import type { ValidationResult } from './validation.js';
import type {
  NostrEvent,
  UnsignedEvent,
  ElectionParams,
  ParsedElection,
  BallotParams,
  ParsedBallot,
  ElectionResultParams,
  ParsedElectionResult,
  ElectionScale,
  ReVotePolicy,
  EntityType,
  SignetTier,
} from './types.js';

// ── Election Creation ────────────────────────────────────────────────────────

/**
 * Create a kind 30482 Election Definition event.
 *
 * @param authorityPrivateKey - Election authority's private key (hex)
 * @param params - Election parameters
 * @returns Signed NostrEvent
 */
export async function createElection(
  authorityPrivateKey: string,
  params: ElectionParams,
): Promise<NostrEvent> {
  if (params.options.length < 2) {
    throw new Error('Election must have at least 2 options');
  }
  if (params.closes <= params.opens) {
    throw new Error('Election closes must be after opens');
  }
  if (params.tallyPubkeys.length < 1) {
    throw new Error('Election must have at least 1 tally pubkey');
  }

  const pubkey = getPublicKey(authorityPrivateKey);
  const tags: string[][] = [
    ['d', params.electionId],
    ['title', params.title],
    ['scale', params.scale],
    ['opens', String(params.opens)],
    ['closes', String(params.closes)],
    ['re-vote', params.reVote],
    ['algo', DEFAULT_CRYPTO_ALGORITHM],
    ['L', SIGNET_LABEL],
    ['l', SIGNET_LABEL],
  ];

  if (params.description) {
    tags.push(['description', params.description]);
  }

  for (const option of params.options) {
    tags.push(['option', option]);
  }

  for (const entityType of params.eligibleEntityTypes) {
    tags.push(['eligible-entity-type', entityType]);
  }

  tags.push(['eligible-min-tier', String(params.eligibleMinTier)]);

  if (params.eligibleCommunity) {
    tags.push(['eligible-community', params.eligibleCommunity]);
  }

  for (const tpk of params.tallyPubkeys) {
    tags.push(['tally-pubkey', tpk]);
  }

  if (params.tallyThreshold) {
    tags.push(['tally-threshold', `${params.tallyThreshold[0]}/${params.tallyThreshold[1]}`]);
  }

  if (params.ringSize !== undefined) {
    tags.push(['ring-size', String(params.ringSize)]);
  }

  const unsigned: UnsignedEvent = {
    kind: SIGNET_KINDS.ELECTION,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };

  return signEvent(unsigned, authorityPrivateKey);
}

// ── Election Parsing ─────────────────────────────────────────────────────────

/**
 * Parse a kind 30482 Election event into a ParsedElection.
 * Returns null if the event is not a valid election.
 */
export function parseElection(event: NostrEvent): ParsedElection | null {
  if (event.kind !== SIGNET_KINDS.ELECTION) return null;

  const electionId = getTagValue(event, 'd');
  const title = getTagValue(event, 'title');
  const scale = getTagValue(event, 'scale') as ElectionScale | undefined;
  const opensStr = getTagValue(event, 'opens');
  const closesStr = getTagValue(event, 'closes');
  const reVote = getTagValue(event, 're-vote') as ReVotePolicy | undefined;

  if (!electionId || !title || !scale || !opensStr || !closesStr || !reVote) return null;

  const options = event.tags.filter(t => t[0] === 'option').map(t => t[1]);
  const eligibleEntityTypes = event.tags
    .filter(t => t[0] === 'eligible-entity-type')
    .map(t => t[1] as EntityType);
  const eligibleMinTierStr = getTagValue(event, 'eligible-min-tier');
  const tallyPubkeys = event.tags.filter(t => t[0] === 'tally-pubkey').map(t => t[1]);

  if (options.length < 2 || !eligibleMinTierStr || tallyPubkeys.length < 1) return null;

  const result: ParsedElection = {
    electionId,
    title,
    options,
    scale,
    eligibleEntityTypes,
    eligibleMinTier: parseInt(eligibleMinTierStr, 10) as SignetTier,
    opens: parseInt(opensStr, 10),
    closes: parseInt(closesStr, 10),
    reVote,
    tallyPubkeys,
    authorityPubkey: event.pubkey,
    algorithm: (getTagValue(event, 'algo') ?? DEFAULT_CRYPTO_ALGORITHM) as any,
  };

  const description = getTagValue(event, 'description');
  if (description) result.description = description;

  const eligibleCommunity = getTagValue(event, 'eligible-community');
  if (eligibleCommunity) result.eligibleCommunity = eligibleCommunity;

  const thresholdStr = getTagValue(event, 'tally-threshold');
  if (thresholdStr) {
    const [m, n] = thresholdStr.split('/').map(Number);
    if (m && n) result.tallyThreshold = [m, n];
  }

  const ringSizeStr = getTagValue(event, 'ring-size');
  if (ringSizeStr) result.ringSize = parseInt(ringSizeStr, 10);

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: All tests PASS (existing type tests + new protocol tests)

- [ ] **Step 5: Commit**

```bash
git add src/voting.ts tests/voting.test.ts
git commit -m "feat: add election creation and parsing (kind 30482)"
```

---

### Task 7: Ballot Encryption Helpers

**Files:**
- Modify: `src/voting.ts`

**Context:** Ballot encryption uses ECDH + HKDF-SHA256 + AES-256-GCM. These are internal helpers used by `castBallot` and `tallyElection`. We use Node/Web Crypto API for AES-256-GCM and @noble/hashes for HKDF.

- [ ] **Step 1: Write failing test for encrypt/decrypt round-trip**

Add to the `describe('voting protocol', ...)` block in `tests/voting.test.ts`:

```typescript
import { encryptBallotContent, decryptBallotContent } from '../src/voting.js';

describe('ballot encryption', () => {
  it('round-trips encrypted content', async () => {
    const encKey = generateKeyPair();
    const plaintext = JSON.stringify({ option: 'Alice' });
    const encrypted = await encryptBallotContent(plaintext, encKey.publicKey);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(plaintext);
    const decrypted = await decryptBallotContent(encrypted, encKey.privateKey);
    expect(decrypted).toBe(plaintext);
  });

  it('different encryptions produce different ciphertext', async () => {
    const encKey = generateKeyPair();
    const plaintext = JSON.stringify({ option: 'Bob' });
    const enc1 = await encryptBallotContent(plaintext, encKey.publicKey);
    const enc2 = await encryptBallotContent(plaintext, encKey.publicKey);
    expect(enc1).not.toBe(enc2); // different ephemeral keys + nonces
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: FAIL - `encryptBallotContent is not a function`

- [ ] **Step 3: Implement ballot encryption helpers**

Add to `src/voting.ts`:

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { generateKeyPair as genKey } from './crypto.js';

// ── Ballot Encryption ────────────────────────────────────────────────────────

const BALLOT_ENCRYPT_INFO = 'signet-ballot-encrypt-v1';

/**
 * Encrypt ballot content to a tally authority's public key.
 * Uses ECDH + HKDF-SHA256 + AES-256-GCM.
 *
 * Output format: hex(ephemeralPubkey) || hex(nonce) || hex(ciphertext+tag)
 * Total: 64 + 24 + variable hex chars
 *
 * @param plaintext - JSON string to encrypt
 * @param tallyPubkey - Tally authority's x-only public key (hex)
 * @returns Hex-encoded encrypted payload
 */
export async function encryptBallotContent(plaintext: string, tallyPubkey: string): Promise<string> {
  // Generate ephemeral keypair
  const ephemeral = genKey();
  const ephemeralPrivBytes = hexToBytes(ephemeral.privateKey);

  // ECDH: shared point = ephemeralPriv * tallyPub
  const tallyPoint = secp256k1.ProjectivePoint.fromHex('02' + tallyPubkey);
  const ephemeralPrivBigInt = BigInt('0x' + ephemeral.privateKey) % secp256k1.CURVE.n;
  const sharedPoint = tallyPoint.multiply(ephemeralPrivBigInt);
  const sharedX = hexToBytes(sharedPoint.toAffine().x.toString(16).padStart(64, '0'));
  const sharedSecret = sha256(sharedX);

  // Derive AES key via HKDF
  const aesKey = hkdf(sha256, sharedSecret, new Uint8Array(0), BALLOT_ENCRYPT_INFO, 32);

  // AES-256-GCM encryption
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', aesKey, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, utf8ToBytes(plaintext)),
  );

  // Output: ephemeralPubkey (64 hex) + nonce (24 hex) + ciphertext+tag (variable hex)
  return ephemeral.publicKey + bytesToHex(nonce) + bytesToHex(ciphertext);
}

/**
 * Decrypt ballot content using the tally authority's private key.
 *
 * @param encrypted - Hex-encoded encrypted payload from encryptBallotContent
 * @param tallyPrivateKey - Tally authority's private key (hex)
 * @returns Decrypted plaintext string
 */
export async function decryptBallotContent(encrypted: string, tallyPrivateKey: string): Promise<string> {
  // Parse: ephemeralPubkey (64 hex) + nonce (24 hex) + ciphertext (rest)
  const ephemeralPubkey = encrypted.slice(0, 64);
  const nonce = hexToBytes(encrypted.slice(64, 88));
  const ciphertext = hexToBytes(encrypted.slice(88));

  // ECDH: shared point = tallyPriv * ephemeralPub
  const ephemeralPoint = secp256k1.ProjectivePoint.fromHex('02' + ephemeralPubkey);
  const tallyPrivBigInt = BigInt('0x' + tallyPrivateKey) % secp256k1.CURVE.n;
  const sharedPoint = ephemeralPoint.multiply(tallyPrivBigInt);
  const sharedX = hexToBytes(sharedPoint.toAffine().x.toString(16).padStart(64, '0'));
  const sharedSecret = sha256(sharedX);

  // Derive AES key via HKDF
  const aesKey = hkdf(sha256, sharedSecret, new Uint8Array(0), BALLOT_ENCRYPT_INFO, 32);

  // AES-256-GCM decryption
  const key = await crypto.subtle.importKey('raw', aesKey, 'AES-GCM', false, ['decrypt']);
  const plainBytes = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ciphertext),
  );

  return new TextDecoder().decode(plainBytes);
}
```

**Note on imports:** This task adds new imports at the top of `voting.ts`. The `secp256k1`, `sha256`, `hkdf`, `bytesToHex`, `hexToBytes`, `utf8ToBytes`, and `concatBytes` imports should be added alongside the existing imports. The `generateKeyPair` import from `crypto.js` may need an alias (`genKey`) to avoid collision if needed.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/voting.ts tests/voting.test.ts
git commit -m "feat: add ballot encryption/decryption (ECDH + AES-256-GCM)"
```

---

### Task 8: Ballot Casting and Verification

**Files:**
- Modify: `src/voting.ts`
- Modify: `tests/voting.test.ts`

**Context:** `castBallot` creates a kind 30483 event signed with an ephemeral key. `verifyBallot` checks the LSAG signature, election ID, and time window. Uses `lsagSign`/`lsagVerify` from `src/lsag.ts` and `encryptBallotContent` from this file.

- [ ] **Step 1: Write failing tests for castBallot and verifyBallot**

Add to the `describe('voting protocol', ...)` block in `tests/voting.test.ts`:

```typescript
import { castBallot, verifyBallot } from '../src/voting.js';
import { computeKeyImage } from '../src/lsag.js';

describe('castBallot and verifyBallot', () => {
  const voter1 = generateKeyPair();
  const voter2 = generateKeyPair();
  const voter3 = generateKeyPair();
  const eligibleRing = [voter1.publicKey, voter2.publicKey, voter3.publicKey];
  let electionEvent: NostrEvent;

  // Create election before tests
  beforeAll(async () => {
    electionEvent = await createElection(authority.privateKey, {
      ...validParams,
      opens: now - 3600,  // already open
      closes: now + 86400,
    });
  });

  it('casts a valid ballot', async () => {
    const { event, ephemeralPubkey } = await castBallot(
      voter1.privateKey, electionEvent, 'Alice', eligibleRing,
    );
    expect(event.kind).toBe(30483);
    expect(event.pubkey).toBe(ephemeralPubkey);
    // Key image tag present
    const keyImageTag = event.tags.find(t => t[0] === 'key-image');
    expect(keyImageTag).toBeDefined();
    expect(keyImageTag![1]).toBe(
      computeKeyImage(voter1.privateKey, voter1.publicKey, 'test-election-2026'),
    );
  });

  it('verifies a valid ballot', async () => {
    const { event } = await castBallot(
      voter1.privateKey, electionEvent, 'Alice', eligibleRing,
    );
    const result = verifyBallot(event, electionEvent, eligibleRing);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects voter not in ring', async () => {
    const outsider = generateKeyPair();
    await expect(
      castBallot(outsider.privateKey, electionEvent, 'Alice', eligibleRing),
    ).rejects.toThrow('not in the eligible ring');
  });

  it('rejects invalid option', async () => {
    await expect(
      castBallot(voter1.privateKey, electionEvent, 'InvalidOption', eligibleRing),
    ).rejects.toThrow('not a valid option');
  });

  it('rejects ballot for not-yet-open election', async () => {
    const futureElection = await createElection(authority.privateKey, {
      ...validParams,
      opens: now + 99999,
      closes: now + 199999,
    });
    await expect(
      castBallot(voter1.privateKey, futureElection, 'Alice', eligibleRing),
    ).rejects.toThrow('not open');
  });

  it('rejects ballot for already closed election', async () => {
    const closedElection = await createElection(authority.privateKey, {
      ...validParams,
      opens: now - 86400,
      closes: now - 3600,
    });
    await expect(
      castBallot(voter1.privateKey, closedElection, 'Alice', eligibleRing),
    ).rejects.toThrow('not open');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: FAIL - `castBallot is not a function`

- [ ] **Step 3: Implement castBallot and verifyBallot**

Add to `src/voting.ts`:

```typescript
import { computeKeyImage, lsagSign, lsagVerify } from './lsag.js';
import type { LsagSignature } from './lsag.js';

// ── Ballot Casting ───────────────────────────────────────────────────────────

/**
 * Cast a ballot in an election.
 * Creates a kind 30483 event signed with an ephemeral key.
 *
 * @param voterPrivateKey - Voter's private key (hex)
 * @param election - The kind 30482 election event
 * @param selectedOption - The chosen option string
 * @param eligibleRing - Array of x-only public keys of eligible voters
 * @returns The signed ballot event and the ephemeral public key
 */
export async function castBallot(
  voterPrivateKey: string,
  election: NostrEvent,
  selectedOption: string,
  eligibleRing: string[],
): Promise<{ event: NostrEvent; ephemeralPubkey: string }> {
  const parsed = parseElection(election);
  if (!parsed) throw new Error('Invalid election event');

  // Validate voter is in the ring
  const voterPubkey = getPublicKey(voterPrivateKey);
  const signerIndex = eligibleRing.indexOf(voterPubkey);
  if (signerIndex === -1) throw new Error('Voter is not in the eligible ring');

  // Validate option
  if (!parsed.options.includes(selectedOption)) {
    throw new Error(`"${selectedOption}" is not a valid option for this election`);
  }

  // Validate election is open
  const now = Math.floor(Date.now() / 1000);
  if (now < parsed.opens || now > parsed.closes) {
    throw new Error('Election is not open');
  }

  // Compute key image
  const keyImage = computeKeyImage(voterPrivateKey, voterPubkey, parsed.electionId);

  // Create LSAG signature over "electionId:selectedOption"
  const sigMessage = `${parsed.electionId}:${selectedOption}`;
  const ringSig = lsagSign(sigMessage, eligibleRing, signerIndex, voterPrivateKey, parsed.electionId);

  // Encrypt vote content to first tally pubkey
  const encryptedVote = await encryptBallotContent(
    JSON.stringify({ option: selectedOption }),
    parsed.tallyPubkeys[0],
  );

  // Generate ephemeral keypair for ballot event
  const ephemeral = genKey();

  const tags: string[][] = [
    ['d', `${parsed.electionId}:${keyImage}`],
    ['election', election.id],
    ['key-image', keyImage],
    ['ring-sig', JSON.stringify(ringSig)],
    ['encrypted-vote', encryptedVote],
    ['algo', DEFAULT_CRYPTO_ALGORITHM],
    ['L', SIGNET_LABEL],
    ['l', SIGNET_LABEL],
  ];

  const unsigned: UnsignedEvent = {
    kind: SIGNET_KINDS.BALLOT,
    pubkey: ephemeral.publicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };

  const event = await signEvent(unsigned, ephemeral.privateKey);
  return { event, ephemeralPubkey: ephemeral.publicKey };
}

// ── Ballot Verification ──────────────────────────────────────────────────────

/**
 * Verify a ballot event against an election and eligible ring.
 * Does NOT check key image uniqueness (that is the tally's responsibility).
 *
 * @param ballot - The kind 30483 ballot event
 * @param election - The kind 30482 election event
 * @param eligibleRing - Array of x-only public keys of eligible voters
 * @returns Validation result with errors array
 */
export function verifyBallot(
  ballot: NostrEvent,
  election: NostrEvent,
  eligibleRing: string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (ballot.kind !== SIGNET_KINDS.BALLOT) {
    errors.push(`Expected kind ${SIGNET_KINDS.BALLOT}, got ${ballot.kind}`);
    return { valid: false, errors };
  }

  const parsed = parseElection(election);
  if (!parsed) {
    errors.push('Invalid election event');
    return { valid: false, errors };
  }

  // Check election reference
  const electionRef = getTagValue(ballot, 'election');
  if (electionRef !== election.id) {
    errors.push('Ballot election reference does not match');
  }

  // Check time window
  if (ballot.created_at < parsed.opens) {
    errors.push('Ballot was cast before election opened');
  }
  if (ballot.created_at > parsed.closes) {
    errors.push('Ballot was cast after election closed');
  }

  // Verify LSAG signature
  const ringSigStr = getTagValue(ballot, 'ring-sig');
  if (!ringSigStr) {
    errors.push('Missing ring-sig tag');
    return { valid: false, errors };
  }

  let ringSig: LsagSignature;
  try {
    ringSig = JSON.parse(ringSigStr);
  } catch {
    errors.push('Malformed ring-sig JSON');
    return { valid: false, errors };
  }

  // The ring in the signature must match the eligible ring
  if (JSON.stringify(ringSig.ring) !== JSON.stringify(eligibleRing)) {
    errors.push('Ring in signature does not match eligible ring');
  }

  // Election ID must match
  if (ringSig.electionId !== parsed.electionId) {
    errors.push('Ring signature electionId does not match election');
  }

  // Verify the LSAG signature itself
  if (!lsagVerify(ringSig)) {
    errors.push('LSAG signature verification failed');
  }

  // Key image tag must match signature
  const keyImageTag = getTagValue(ballot, 'key-image');
  if (keyImageTag !== ringSig.keyImage) {
    errors.push('Key image tag does not match signature key image');
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/voting.ts tests/voting.test.ts
git commit -m "feat: add ballot casting and verification (kind 30483)"
```

---

### Task 9: Election Tally

**Files:**
- Modify: `src/voting.ts`
- Modify: `tests/voting.test.ts`

- [ ] **Step 1: Write failing tests for tallyElection**

Add to the `describe('voting protocol', ...)` block:

```typescript
import { tallyElection } from '../src/voting.js';

describe('tallyElection', () => {
  let electionEvent: NostrEvent;
  const voter1 = generateKeyPair();
  const voter2 = generateKeyPair();
  const voter3 = generateKeyPair();
  const tallyAuthority = generateKeyPair();
  const eligibleRing = [voter1.publicKey, voter2.publicKey, voter3.publicKey];

  beforeAll(async () => {
    electionEvent = await createElection(authority.privateKey, {
      ...validParams,
      opens: now - 7200,
      closes: now + 86400,
      tallyPubkeys: [tallyAuthority.publicKey],
    });
  });

  it('tallies multiple ballots correctly', async () => {
    const ballot1 = await castBallot(voter1.privateKey, electionEvent, 'Alice', eligibleRing);
    const ballot2 = await castBallot(voter2.privateKey, electionEvent, 'Bob', eligibleRing);
    const ballot3 = await castBallot(voter3.privateKey, electionEvent, 'Alice', eligibleRing);

    const result = await tallyElection(
      [ballot1.event, ballot2.event, ballot3.event],
      electionEvent,
      tallyAuthority.privateKey,
      eligibleRing,
    );

    expect(result.kind).toBe(30484);
    // Parse result tags
    const resultTags = result.tags.filter(t => t[0] === 'result');
    const aliceResult = resultTags.find(t => t[1] === 'Alice');
    const bobResult = resultTags.find(t => t[1] === 'Bob');
    expect(aliceResult?.[2]).toBe('2');
    expect(bobResult?.[2]).toBe('1');

    const totalTag = result.tags.find(t => t[0] === 'total-ballots');
    expect(totalTag?.[1]).toBe('3');
  });

  it('deduplicates by key image (re-vote allowed: latest wins)', async () => {
    // Voter1 votes Alice first, then changes to Bob
    const ballot1a = await castBallot(voter1.privateKey, electionEvent, 'Alice', eligibleRing);
    // Small delay to ensure different created_at
    const ballot1b = await castBallot(voter1.privateKey, electionEvent, 'Bob', eligibleRing);
    // Ensure ballot1b has a later timestamp
    (ballot1b.event as any).created_at = ballot1a.event.created_at + 1;

    const ballot2 = await castBallot(voter2.privateKey, electionEvent, 'Alice', eligibleRing);

    const result = await tallyElection(
      [ballot1a.event, ballot1b.event, ballot2.event],
      electionEvent,
      tallyAuthority.privateKey,
      eligibleRing,
    );

    const resultTags = result.tags.filter(t => t[0] === 'result');
    const aliceResult = resultTags.find(t => t[1] === 'Alice');
    const bobResult = resultTags.find(t => t[1] === 'Bob');
    // voter1's latest vote (Bob) wins; voter2 voted Alice
    expect(aliceResult?.[2]).toBe('1');
    expect(bobResult?.[2]).toBe('1');
  });

  it('rejects duplicate key images when re-vote denied', async () => {
    const noRevoteElection = await createElection(authority.privateKey, {
      ...validParams,
      opens: now - 7200,
      closes: now + 86400,
      reVote: 'denied',
      tallyPubkeys: [tallyAuthority.publicKey],
    });

    const ballot1a = await castBallot(voter1.privateKey, noRevoteElection, 'Alice', eligibleRing);
    const ballot1b = await castBallot(voter1.privateKey, noRevoteElection, 'Bob', eligibleRing);
    const ballot2 = await castBallot(voter2.privateKey, noRevoteElection, 'Alice', eligibleRing);

    const result = await tallyElection(
      [ballot1a.event, ballot1b.event, ballot2.event],
      noRevoteElection,
      tallyAuthority.privateKey,
      eligibleRing,
    );

    // Only first ballot from voter1 should count; duplicate rejected
    const totalTag = result.tags.find(t => t[0] === 'total-ballots');
    const invalidTag = result.tags.find(t => t[0] === 'total-invalid');
    expect(totalTag?.[1]).toBe('2'); // voter1 first + voter2
    expect(parseInt(invalidTag?.[1] ?? '0', 10)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: FAIL - `tallyElection is not a function`

- [ ] **Step 3: Implement tallyElection**

Add to `src/voting.ts`:

```typescript
// ── Tally ────────────────────────────────────────────────────────────────────

/**
 * Tally an election: verify ballots, deduplicate by key image, decrypt votes, count.
 *
 * @param ballots - Array of kind 30483 ballot events
 * @param election - The kind 30482 election event
 * @param tallyPrivateKey - Tally authority's private key (hex)
 * @param eligibleRing - Array of x-only public keys of eligible voters
 * @returns Signed kind 30484 Election Result event
 */
export async function tallyElection(
  ballots: NostrEvent[],
  election: NostrEvent,
  tallyPrivateKey: string,
  eligibleRing: string[],
): Promise<NostrEvent> {
  const parsed = parseElection(election);
  if (!parsed) throw new Error('Invalid election event');

  // Step 1: Verify all ballots
  const verified: Array<{ ballot: NostrEvent; keyImage: string }> = [];
  let invalidCount = 0;

  for (const ballot of ballots) {
    const result = verifyBallot(ballot, election, eligibleRing);
    if (!result.valid) {
      invalidCount++;
      continue;
    }
    const keyImage = getTagValue(ballot, 'key-image');
    if (!keyImage) {
      invalidCount++;
      continue;
    }
    verified.push({ ballot, keyImage });
  }

  // Step 2: Deduplicate by key image
  const deduped = new Map<string, NostrEvent>();

  for (const { ballot, keyImage } of verified) {
    const existing = deduped.get(keyImage);

    if (!existing) {
      deduped.set(keyImage, ballot);
    } else if (parsed.reVote === 'allowed') {
      // Keep latest ballot
      if (ballot.created_at > existing.created_at) {
        deduped.set(keyImage, ballot);
      }
    } else {
      // Re-vote denied: keep first, reject duplicates
      invalidCount++;
    }
  }

  // Step 3: Decrypt and count
  const counts = new Map<string, number>();
  for (const option of parsed.options) {
    counts.set(option, 0);
  }

  for (const ballot of deduped.values()) {
    const encryptedVote = getTagValue(ballot, 'encrypted-vote');
    if (!encryptedVote) {
      invalidCount++;
      continue;
    }

    try {
      const plaintext = await decryptBallotContent(encryptedVote, tallyPrivateKey);
      const voteData = JSON.parse(plaintext);
      const option = voteData.option;

      if (parsed.options.includes(option)) {
        counts.set(option, (counts.get(option) ?? 0) + 1);
      } else {
        invalidCount++;
      }
    } catch {
      invalidCount++;
    }
  }

  // Step 4: Build result event
  const tallyPubkey = getPublicKey(tallyPrivateKey);
  const totalBallots = deduped.size;

  const tags: string[][] = [
    ['d', `${parsed.electionId}:result`],
    ['election', election.id],
    ['total-ballots', String(totalBallots)],
    ['total-eligible', String(eligibleRing.length)],
    ['total-invalid', String(invalidCount)],
    ['algo', DEFAULT_CRYPTO_ALGORITHM],
    ['L', SIGNET_LABEL],
    ['l', SIGNET_LABEL],
  ];

  for (const [option, count] of counts) {
    tags.push(['result', option, String(count)]);
  }

  const unsigned: UnsignedEvent = {
    kind: SIGNET_KINDS.ELECTION_RESULT,
    pubkey: tallyPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
  };

  return signEvent(unsigned, tallyPrivateKey);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/voting.ts tests/voting.test.ts
git commit -m "feat: add election tally with deduplication and decryption (kind 30484)"
```

---

## Chunk 3: Validation, Exports, and Integration

### Task 10: Election Validation Functions

**Files:**
- Modify: `src/voting.ts`
- Modify: `tests/voting.test.ts`

**Context:** Follow `src/validation.ts` pattern: return `{ valid: boolean; errors: string[] }`. Keep these in `voting.ts` since the module is self-contained.

- [ ] **Step 1: Write failing tests for validation functions**

Add to `tests/voting.test.ts`:

```typescript
import { validateElection, validateBallot, validateElectionResult } from '../src/voting.js';

describe('structural validation', () => {
  it('validates a well-formed election event', async () => {
    const event = await createElection(authority.privateKey, validParams);
    const result = validateElection(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects election with wrong kind', () => {
    const bad = { kind: 30470, tags: [['L', 'signet']], pubkey: 'a'.repeat(64), content: '', id: 'x', sig: 'y', created_at: 0 } as NostrEvent;
    const result = validateElection(bad);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('kind');
  });

  it('rejects election missing required tags', () => {
    const bad = { kind: 30482, tags: [['L', 'signet']], pubkey: 'a'.repeat(64), content: '', id: 'x', sig: 'y', created_at: 0 } as NostrEvent;
    const result = validateElection(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates a well-formed ballot event', async () => {
    const electionEvent = await createElection(authority.privateKey, {
      ...validParams, opens: now - 3600, closes: now + 86400,
    });
    const voter = generateKeyPair();
    const ring = [voter.publicKey, generateKeyPair().publicKey, generateKeyPair().publicKey];
    const { event } = await castBallot(voter.privateKey, electionEvent, 'Alice', ring);
    const result = validateBallot(event);
    expect(result.valid).toBe(true);
  });

  it('validates a well-formed election result event', async () => {
    const tallyAuth = generateKeyPair();
    const electionEvent = await createElection(authority.privateKey, {
      ...validParams, opens: now - 7200, closes: now + 86400,
      tallyPubkeys: [tallyAuth.publicKey],
    });
    const v1 = generateKeyPair();
    const v2 = generateKeyPair();
    const ring = [v1.publicKey, v2.publicKey, generateKeyPair().publicKey];
    const b1 = await castBallot(v1.privateKey, electionEvent, 'Alice', ring);
    const b2 = await castBallot(v2.privateKey, electionEvent, 'Bob', ring);
    const result = await tallyElection([b1.event, b2.event], electionEvent, tallyAuth.privateKey, ring);
    const validation = validateElectionResult(result);
    expect(validation.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: FAIL - `validateElection is not a function`

- [ ] **Step 3: Implement validation functions**

Add to `src/voting.ts`:

```typescript
// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a kind 30482 Election event structure.
 */
export function validateElection(event: NostrEvent): ValidationResult {
  const errors: string[] = [];

  if (event.kind !== SIGNET_KINDS.ELECTION) {
    errors.push(`Expected kind ${SIGNET_KINDS.ELECTION}, got ${event.kind}`);
  }

  if (!event.tags.some(t => t[0] === 'L' && t[1] === SIGNET_LABEL)) {
    errors.push('Missing signet protocol label (["L", "signet"])');
  }

  if (!getTagValue(event, 'd')) errors.push('Missing "d" tag (election ID)');
  if (!getTagValue(event, 'title')) errors.push('Missing "title" tag');
  if (!getTagValue(event, 'scale')) errors.push('Missing "scale" tag');
  if (!getTagValue(event, 'opens')) errors.push('Missing "opens" tag');
  if (!getTagValue(event, 'closes')) errors.push('Missing "closes" tag');
  if (!getTagValue(event, 're-vote')) errors.push('Missing "re-vote" tag');

  const options = event.tags.filter(t => t[0] === 'option').map(t => t[1]);
  if (options.length < 2) errors.push('Election must have at least 2 "option" tags');

  const tallyPubkeys = event.tags.filter(t => t[0] === 'tally-pubkey').map(t => t[1]);
  if (tallyPubkeys.length < 1) errors.push('Election must have at least 1 "tally-pubkey" tag');

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a kind 30483 Ballot event structure.
 */
export function validateBallot(event: NostrEvent): ValidationResult {
  const errors: string[] = [];

  if (event.kind !== SIGNET_KINDS.BALLOT) {
    errors.push(`Expected kind ${SIGNET_KINDS.BALLOT}, got ${event.kind}`);
  }

  if (!event.tags.some(t => t[0] === 'L' && t[1] === SIGNET_LABEL)) {
    errors.push('Missing signet protocol label (["L", "signet"])');
  }

  if (!getTagValue(event, 'd')) errors.push('Missing "d" tag');
  if (!getTagValue(event, 'election')) errors.push('Missing "election" tag');
  if (!getTagValue(event, 'key-image')) errors.push('Missing "key-image" tag');
  if (!getTagValue(event, 'ring-sig')) errors.push('Missing "ring-sig" tag');
  if (!getTagValue(event, 'encrypted-vote')) errors.push('Missing "encrypted-vote" tag');

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a kind 30484 Election Result event structure.
 */
export function validateElectionResult(event: NostrEvent): ValidationResult {
  const errors: string[] = [];

  if (event.kind !== SIGNET_KINDS.ELECTION_RESULT) {
    errors.push(`Expected kind ${SIGNET_KINDS.ELECTION_RESULT}, got ${event.kind}`);
  }

  if (!event.tags.some(t => t[0] === 'L' && t[1] === SIGNET_LABEL)) {
    errors.push('Missing signet protocol label (["L", "signet"])');
  }

  if (!getTagValue(event, 'd')) errors.push('Missing "d" tag');
  if (!getTagValue(event, 'election')) errors.push('Missing "election" tag');
  if (!getTagValue(event, 'total-ballots')) errors.push('Missing "total-ballots" tag');
  if (!getTagValue(event, 'total-eligible')) errors.push('Missing "total-eligible" tag');

  const results = event.tags.filter(t => t[0] === 'result');
  if (results.length === 0) errors.push('Missing "result" tags');

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/darren/WebstormProjects/signet && npx vitest run tests/voting.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/voting.ts tests/voting.test.ts
git commit -m "feat: add election, ballot, and result structural validation"
```

---

### Task 11: Exports and Integration

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add LSAG exports to src/index.ts**

After the Ring Signatures section (after line 183), add:

```typescript
// LSAG (Linkable Ring Signatures)
export {
  computeKeyImage,
  lsagSign,
  lsagVerify,
  hasDuplicateKeyImage,
} from './lsag.js';

export type { LsagSignature } from './lsag.js';
```

- [ ] **Step 2: Add Voting exports to src/index.ts**

After the LSAG section, add:

```typescript
// Voting (kinds 30482-30484)
export {
  createElection,
  parseElection,
  castBallot,
  verifyBallot,
  tallyElection,
  encryptBallotContent,
  decryptBallotContent,
  validateElection,
  validateBallot,
  validateElectionResult,
} from './voting.js';
```

- [ ] **Step 3: Run typecheck**

Run: `cd /Users/darren/WebstormProjects/signet && npm run typecheck`
Expected: No errors

- [ ] **Step 4: Run full test suite**

Run: `cd /Users/darren/WebstormProjects/signet && npm test`
Expected: All tests pass (existing 538 + new LSAG + new voting tests)

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: export LSAG and voting protocol from index"
```

---

### Task 12: Full Integration Test

**Files:**
- Modify: `tests/voting.test.ts`

- [ ] **Step 1: Add end-to-end integration test**

Add a final integration test that exercises the entire flow:

```typescript
describe('full voting flow integration', () => {
  it('end-to-end: create, cast 3 ballots, tally', async () => {
    const auth = generateKeyPair();
    const tally = generateKeyPair();
    const voters = [generateKeyPair(), generateKeyPair(), generateKeyPair()];
    const ring = voters.map(v => v.publicKey);
    const now = Math.floor(Date.now() / 1000);

    // 1. Create election
    const election = await createElection(auth.privateKey, {
      electionId: 'integration-test',
      title: 'Integration Test Election',
      options: ['Yes', 'No'],
      scale: 'organisational',
      eligibleEntityTypes: ['natural_person'],
      eligibleMinTier: 1,
      opens: now - 3600,
      closes: now + 86400,
      reVote: 'allowed',
      tallyPubkeys: [tally.publicKey],
    });

    expect(election.kind).toBe(30482);

    // 2. Cast ballots
    const b0 = await castBallot(voters[0].privateKey, election, 'Yes', ring);
    const b1 = await castBallot(voters[1].privateKey, election, 'No', ring);
    const b2 = await castBallot(voters[2].privateKey, election, 'Yes', ring);

    // 3. Verify each ballot
    for (const ballot of [b0, b1, b2]) {
      const v = verifyBallot(ballot.event, election, ring);
      expect(v.valid).toBe(true);
    }

    // 4. All key images are unique
    const keyImages = [b0, b1, b2].map(b =>
      b.event.tags.find(t => t[0] === 'key-image')![1],
    );
    expect(new Set(keyImages).size).toBe(3);

    // 5. Tally
    const result = await tallyElection(
      [b0.event, b1.event, b2.event],
      election,
      tally.privateKey,
      ring,
    );

    expect(result.kind).toBe(30484);
    const yesResult = result.tags.find(t => t[0] === 'result' && t[1] === 'Yes');
    const noResult = result.tags.find(t => t[0] === 'result' && t[1] === 'No');
    expect(yesResult?.[2]).toBe('2');
    expect(noResult?.[2]).toBe('1');
  });
});
```

- [ ] **Step 2: Run full test suite**

Run: `cd /Users/darren/WebstormProjects/signet && npm test`
Expected: All tests pass

- [ ] **Step 3: Run typecheck**

Run: `cd /Users/darren/WebstormProjects/signet && npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add tests/voting.test.ts
git commit -m "test: add full voting flow integration test"
```

---

## Import Summary

### `src/lsag.ts` imports:
```typescript
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { Point, N, type ProjectivePoint, mod, randomScalar, scalarToHex, hexToScalar, hashToScalar, hashToPoint, safeMultiply, scalarEqual, G } from './secp256k1-utils.js';
```

### `src/voting.ts` imports:
```typescript
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { generateKeyPair as genKey, getPublicKey, signEvent } from './crypto.js';
import { SIGNET_KINDS, SIGNET_LABEL, DEFAULT_CRYPTO_ALGORITHM } from './constants.js';
import { getTagValue } from './validation.js';
import { computeKeyImage, lsagSign, lsagVerify } from './lsag.js';
import type { LsagSignature } from './lsag.js';
import type { NostrEvent, UnsignedEvent, ElectionParams, ParsedElection, ElectionScale, ReVotePolicy, EntityType, SignetTier } from './types.js';
import type { ValidationResult } from './validation.js';
```
