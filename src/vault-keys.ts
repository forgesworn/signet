/** Private dataset identities, derived directly from the tree root.
 * Identity ordinals belong in the purpose; the derivation index is rotation.
 * This does not change any existing persona derivation.
 */
import { derive, fromMnemonic } from 'nsec-tree'
import type { Identity, TreeRoot } from 'nsec-tree'

export type VaultDataset = 'profiles' | 'contacts:owner' | 'contacts:bots' | 'credentials' | 'settings'
  | { dependant: number }

const FIXED = new Set(['profiles', 'contacts:owner', 'contacts:bots', 'credentials', 'settings'])
const MAX_INDEX = 0xffff_ffff

function ordinal(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_INDEX) {
    throw new Error('Vault ordinal must be an unsigned 32-bit integer')
  }
}

export function vaultPurpose(dataset: VaultDataset): string {
  if (typeof dataset === 'string' && FIXED.has(dataset)) return `signet:vault:${dataset}`
  if (dataset && typeof dataset === 'object' && 'dependant' in dataset) {
    ordinal(dataset.dependant)
    return `signet:vault:contacts:dependant-${dataset.dependant}`
  }
  throw new Error('Unknown vault dataset')
}

/** Strict parser: aliases such as dependant-01 would derive a different key. */
export function parseVaultPurpose(purpose: string): VaultDataset | null {
  if (typeof purpose !== 'string' || !purpose.startsWith('signet:vault:')) return null
  const suffix = purpose.slice('signet:vault:'.length)
  if (FIXED.has(suffix)) return suffix as VaultDataset
  const match = /^contacts:dependant-(0|[1-9][0-9]*)$/.exec(suffix)
  if (!match) return null
  const dependant = Number(match[1])
  return Number.isInteger(dependant) && dependant <= MAX_INDEX ? { dependant } : null
}

/** Suitable for Heartwood's per-request context; never a registry persona. */
export function vaultKeyContext(dataset: VaultDataset, rotation = 0): { purpose: string; index: number } {
  ordinal(rotation)
  return { purpose: vaultPurpose(dataset), index: rotation }
}

/** Caller owns and must zeroise the returned child. The supplied root is retained. */
export function deriveVaultIdentity(root: TreeRoot, dataset: VaultDataset, rotation = 0): Identity {
  const { purpose, index } = vaultKeyContext(dataset, rotation)
  return derive(root, purpose, index)
}

/** Keep root construction and use in one module instance (roots are opaque).
 * Caller must zeroise the returned child; the temporary root is always destroyed.
 */
export function vaultIdentityFromMnemonic(mnemonic: string, dataset: VaultDataset, rotation = 0): Identity {
  const root = fromMnemonic(mnemonic)
  try { return deriveVaultIdentity(root, dataset, rotation) }
  finally { root.destroy() }
}
