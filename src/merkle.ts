// Merkle Tree Selective Disclosure
// Credential attributes as Merkle leaves — reveal chosen attributes + sibling paths

import { hashString } from './crypto.js';
import type { MerkleProof, SelectiveDisclosure } from './types.js';

/** Combine two hashes into a parent node */
function hashPair(left: string, right: string): string {
  // Canonical ordering: smaller hash first to ensure deterministic trees
  const [a, b] = left < right ? [left, right] : [right, left];
  return hashString(a + b);
}

/** Build a Merkle tree from leaf values. Returns all levels (bottom-up). */
function buildTree(leaves: string[]): string[][] {
  if (leaves.length === 0) throw new Error('Cannot build tree from empty leaves');

  // Pad to power of 2
  const paddedLeaves = [...leaves];
  while (paddedLeaves.length & (paddedLeaves.length - 1)) {
    paddedLeaves.push(hashString('__padding__' + paddedLeaves.length));
  }

  const levels: string[][] = [paddedLeaves];
  let current = paddedLeaves;

  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(hashPair(current[i], current[i + 1]));
    }
    levels.push(next);
    current = next;
  }

  return levels;
}

export class MerkleTree {
  private levels: string[][];
  private leafHashes: string[];
  readonly root: string;

  constructor(private attributes: Record<string, string>) {
    const entries = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b));
    // Each leaf is hash("key:value")
    this.leafHashes = entries.map(([k, v]) => hashString(`${k}:${v}`));
    this.levels = buildTree(this.leafHashes);
    this.root = this.levels[this.levels.length - 1][0];
  }

  /** Get the Merkle root */
  getRoot(): string {
    return this.root;
  }

  /** Generate a proof for a specific attribute */
  prove(key: string): MerkleProof {
    const entries = Object.entries(this.attributes).sort(([a], [b]) => a.localeCompare(b));
    const idx = entries.findIndex(([k]) => k === key);
    if (idx === -1) throw new Error(`Attribute "${key}" not found`);

    const leafHash = this.leafHashes[idx];
    const siblings: string[] = [];
    let currentIdx = idx;

    // Pad index space to match padded tree
    for (let level = 0; level < this.levels.length - 1; level++) {
      const siblingIdx = currentIdx ^ 1; // flip last bit to get sibling
      if (siblingIdx < this.levels[level].length) {
        siblings.push(this.levels[level][siblingIdx]);
      }
      currentIdx = currentIdx >> 1;
    }

    return {
      leaf: leafHash,
      index: idx,
      siblings,
      root: this.root,
    };
  }

  /** Create a selective disclosure revealing only specified attributes */
  disclose(keys: string[]): SelectiveDisclosure {
    const revealedAttributes: Record<string, string> = {};
    const proofs: MerkleProof[] = [];

    for (const key of keys) {
      const entries = Object.entries(this.attributes).sort(([a], [b]) => a.localeCompare(b));
      const entry = entries.find(([k]) => k === key);
      if (!entry) throw new Error(`Attribute "${key}" not found`);

      revealedAttributes[key] = entry[1];
      proofs.push(this.prove(key));
    }

    return {
      revealedAttributes,
      proofs,
      merkleRoot: this.root,
    };
  }
}

/** Verify a Merkle proof against a root */
export function verifyMerkleProof(
  key: string,
  value: string,
  proof: MerkleProof
): boolean {
  let currentHash = hashString(`${key}:${value}`);
  if (currentHash !== proof.leaf) return false;

  let idx = proof.index;
  for (const sibling of proof.siblings) {
    currentHash = hashPair(currentHash, sibling);
    idx = idx >> 1;
  }

  return currentHash === proof.root;
}

/** Verify an entire selective disclosure */
export function verifySelectiveDisclosure(disclosure: SelectiveDisclosure): boolean {
  const entries = Object.entries(disclosure.revealedAttributes);
  if (entries.length !== disclosure.proofs.length) return false;

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const proof = disclosure.proofs[i];

    if (proof.root !== disclosure.merkleRoot) return false;
    if (!verifyMerkleProof(key, value, proof)) return false;
  }

  return true;
}
