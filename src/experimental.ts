/**
 * signet-protocol/experimental — UNSTABLE, UNRELEASED draft contracts.
 *
 * The private vault checkpoint (docs/private-vault-v1.md) and the bot ownership
 * profile (docs/bot-ownership-v1.md) are still under protocol review. Anything
 * exported here may change or be removed in any release, including a minor or
 * patch, without a deprecation period. Do not depend on it for production data.
 * None of these names are exported from the package root.
 */
// Private vault: dedicated dataset keys (flat derivation; index means rotation).
export { vaultPurpose, parseVaultPurpose, vaultKeyContext, deriveVaultIdentity, vaultIdentityFromMnemonic } from './vault-keys.js'
export type { VaultDataset } from './vault-keys.js'
export { VAULT_EVENT_KIND, MAX_VAULT_CHUNKS, MAX_VAULT_DEVICES, MAX_VAULT_CONTROL_BYTES,
  MAX_VAULT_CHUNK_BYTES, vaultCheckpointTag, vaultContentHash, parseVaultCheckpoint,
  matchesVaultChunk } from './vault-checkpoint.js'
export type { VaultCheckpoint, VaultChunkRef } from './vault-checkpoint.js'
export { readVaultSnapshot, readVaultRotations, readVaultHeads, readVaultHeadRotations } from './vault-recovery.js'
export type { VaultReadResult, VaultReader, VaultHeadsResult } from './vault-recovery.js'

export { createVaultRelayReader, fetchVaultEvents } from './vault-relay.js'

export { BOT_OWNERSHIP_TYPE, BOT_OWNERSHIP_POLICY, buildBotOwnership, buildBotOwnershipRevocation,
  readBotOwnership, readBotOwnershipSync, botOwnershipRenewalDue } from './bot-ownership.js';
export type { BotOwnershipClaim, BotOwnershipResult } from './bot-ownership.js';
