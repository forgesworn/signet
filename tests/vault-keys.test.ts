import { describe, expect, it } from 'vitest'
import { derive, fromMnemonic, zeroise } from 'nsec-tree'
import { derivePersona } from 'nsec-tree/persona'
import { deriveVaultIdentity, parseVaultPurpose, vaultKeyContext, vaultPurpose } from '../src/vault-keys.js'
import type { VaultDataset } from '../src/vault-keys.js'

const WORDS = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const DATASETS: VaultDataset[] = ['profiles', 'contacts:owner', 'contacts:bots', 'credentials', 'settings', { dependant: 0 }, { dependant: 1 }]

describe('private vault identity contract', () => {
  it('round trips every dataset, including zero-based dependants', () => {
    for (const dataset of DATASETS) expect(parseVaultPurpose(vaultPurpose(dataset))).toEqual(dataset)
    expect(vaultKeyContext({ dependant: 0 }, 1)).toEqual({ purpose: 'signet:vault:contacts:dependant-0', index: 1 })
  })

  it('rejects aliases, unknown datasets and invalid ordinals before deriving', () => {
    for (const value of [-1, 0.5, NaN, Infinity, 4294967296]) {
      expect(() => vaultPurpose({ dependant: value })).toThrow()
      expect(() => vaultKeyContext('profiles', value)).toThrow()
    }
    for (const suffix of ['contacts:dependant-01', 'contacts:dependant--1', 'contacts:dependant-4294967296', 'unknown', 'profiles:0']) {
      expect(parseVaultPurpose(`signet:vault:${suffix}`)).toBeNull()
    }
    expect(parseVaultPurpose('nostr:persona:signet:vault:profiles')).toBeNull()
    expect(() => vaultPurpose('unknown' as VaultDataset)).toThrow()
  })

  it('uses flat derivation and separates datasets, rotations and personas', () => {
    const root = fromMnemonic(WORDS)
    const keys = []
    try {
      for (const dataset of DATASETS) {
        for (const rotation of [0, 1]) {
          const child = deriveVaultIdentity(root, dataset, rotation)
          const raw = derive(root, vaultPurpose(dataset), rotation)
          keys.push(child, raw)
          expect(child.publicKey).toEqual(raw.publicKey)
        }
      }
      const unique = keys.filter((_, i) => i % 2 === 0).map(k => k.npub)
      expect(new Set(unique).size).toBe(DATASETS.length * 2)
      const persona = derivePersona(root, 'signet:vault:profiles')
      keys.push(persona.identity)
      expect(unique).not.toContain(persona.identity.npub)
    } finally {
      keys.forEach(zeroise)
      root.destroy()
    }
  })
})
