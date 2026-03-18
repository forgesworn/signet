// Pedersen Commitments + Range Proofs — thin re-export from @forgesworn/range-proof
// Proves "value is in [min, max]" without revealing the exact value.
// Used for Tier 4 age range proofs: "child aged 8-12" without revealing exact age.

export {
  type PedersenCommitment,
  type RangeProof,
  commit,
  verifyCommitment,
  createRangeProof,
  verifyRangeProof,
  createAgeRangeProof,
  verifyAgeRangeProof,
  serializeRangeProof,
  deserializeRangeProof,
} from '@forgesworn/range-proof';
