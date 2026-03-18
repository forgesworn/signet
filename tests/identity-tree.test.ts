import { describe, it, expect } from 'vitest'
import { generateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import {
  createSignetIdentity,
  createSignetIdentityFromNsec,
  deriveAdditionalPersona,
  deriveSubIdentity,
  createLinkageProof,
  verifyLinkageProof,
  destroyIdentity,
} from '../src/identity-tree.js'

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('createSignetIdentity', () => {
  it('returns SignetIdentity with both required personas', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    expect(identity.root).toBeDefined()
    expect(identity.root.masterPubkey).toMatch(/^npub1/)
    expect(identity.naturalPerson).toBeDefined()
    expect(identity.naturalPerson.name).toBe('natural-person')
    expect(identity.naturalPerson.identity.npub).toMatch(/^npub1/)
    expect(identity.persona).toBeDefined()
    expect(identity.persona.name).toBe('persona')
    expect(identity.persona.identity.npub).toMatch(/^npub1/)
    expect(identity.mnemonic).toBe(TEST_MNEMONIC)
    identity.root.destroy()
  })

  it('produces deterministic output for same mnemonic', () => {
    const a = createSignetIdentity(TEST_MNEMONIC)
    const b = createSignetIdentity(TEST_MNEMONIC)
    expect(a.naturalPerson.identity.npub).toBe(b.naturalPerson.identity.npub)
    expect(a.persona.identity.npub).toBe(b.persona.identity.npub)
    expect(a.root.masterPubkey).toBe(b.root.masterPubkey)
    a.root.destroy()
    b.root.destroy()
  })

  it('produces different output for different mnemonics', () => {
    const other = generateMnemonic(wordlist)
    const a = createSignetIdentity(TEST_MNEMONIC)
    const b = createSignetIdentity(other)
    expect(a.naturalPerson.identity.npub).not.toBe(b.naturalPerson.identity.npub)
    a.root.destroy()
    b.root.destroy()
  })

  it('passphrase changes derived identity', () => {
    const a = createSignetIdentity(TEST_MNEMONIC)
    const b = createSignetIdentity(TEST_MNEMONIC, 'my-passphrase')
    expect(a.naturalPerson.identity.npub).not.toBe(b.naturalPerson.identity.npub)
    expect(a.root.masterPubkey).not.toBe(b.root.masterPubkey)
    a.root.destroy()
    b.root.destroy()
  })

  it('natural person and persona npubs differ from each other and from master', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const npNpub = identity.naturalPerson.identity.npub
    const pNpub = identity.persona.identity.npub
    const masterNpub = identity.root.masterPubkey
    expect(npNpub).not.toBe(pNpub)
    expect(npNpub).not.toBe(masterNpub)
    expect(pNpub).not.toBe(masterNpub)
    identity.root.destroy()
  })
})

describe('createSignetIdentityFromNsec', () => {
  it('returns SignetIdentity with both personas from nsec string', () => {
    const mnemonic = createSignetIdentity(TEST_MNEMONIC)
    const nsec = mnemonic.naturalPerson.identity.nsec
    mnemonic.root.destroy()

    const identity = createSignetIdentityFromNsec(nsec)
    expect(identity.root).toBeDefined()
    expect(identity.naturalPerson).toBeDefined()
    expect(identity.persona).toBeDefined()
    expect(identity.mnemonic).toBeUndefined()
    identity.root.destroy()
  })

  it('returns SignetIdentity from raw Uint8Array private key', () => {
    const mnemonic = createSignetIdentity(TEST_MNEMONIC)
    const privateKey = new Uint8Array(mnemonic.naturalPerson.identity.privateKey)
    mnemonic.root.destroy()

    const identity = createSignetIdentityFromNsec(privateKey)
    expect(identity.root).toBeDefined()
    expect(identity.naturalPerson).toBeDefined()
    expect(identity.persona).toBeDefined()
    identity.root.destroy()
  })

  it('produces deterministic output for same nsec', () => {
    const src = createSignetIdentity(TEST_MNEMONIC)
    const nsec = src.naturalPerson.identity.nsec
    src.root.destroy()

    const a = createSignetIdentityFromNsec(nsec)
    const b = createSignetIdentityFromNsec(nsec)
    expect(a.naturalPerson.identity.npub).toBe(b.naturalPerson.identity.npub)
    expect(a.persona.identity.npub).toBe(b.persona.identity.npub)
    a.root.destroy()
    b.root.destroy()
  })
})

describe('deriveAdditionalPersona', () => {
  it('derives a third persona distinct from the required two', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const professional = deriveAdditionalPersona(identity.root, 'professional')
    expect(professional.name).toBe('professional')
    expect(professional.identity.npub).not.toBe(identity.naturalPerson.identity.npub)
    expect(professional.identity.npub).not.toBe(identity.persona.identity.npub)
    identity.root.destroy()
  })

  it('supports index for persona rotation', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const a = deriveAdditionalPersona(identity.root, 'social', 0)
    const b = deriveAdditionalPersona(identity.root, 'social', 1)
    expect(a.identity.npub).not.toBe(b.identity.npub)
    identity.root.destroy()
  })

  it('rejects empty name', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    expect(() => deriveAdditionalPersona(identity.root, '')).toThrow()
    identity.root.destroy()
  })
})

describe('deriveSubIdentity', () => {
  it('derives a sub-identity under a persona', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const sub = deriveSubIdentity(identity.naturalPerson, 'group-signing', 0)
    expect(sub.npub).toMatch(/^npub1/)
    expect(sub.npub).not.toBe(identity.naturalPerson.identity.npub)
    identity.root.destroy()
  })
})

describe('linkage proofs', () => {
  it('blind proof verifies without revealing purpose/index', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const proof = createLinkageProof(identity.root, identity.naturalPerson.identity, 'blind')
    expect(proof.masterPubkey).toBeDefined()
    expect(proof.childPubkey).toBeDefined()
    expect(proof.purpose).toBeUndefined()
    expect(proof.index).toBeUndefined()
    expect(verifyLinkageProof(proof)).toBe(true)
    identity.root.destroy()
  })

  it('full proof verifies and includes purpose and index', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const proof = createLinkageProof(identity.root, identity.naturalPerson.identity, 'full')
    expect(proof.masterPubkey).toBeDefined()
    expect(proof.childPubkey).toBeDefined()
    expect(proof.purpose).toBe('nostr:persona:natural-person')
    expect(proof.index).toBe(0)
    expect(verifyLinkageProof(proof)).toBe(true)
    identity.root.destroy()
  })

  it('tampered proof does not verify', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const proof = createLinkageProof(identity.root, identity.naturalPerson.identity, 'blind')
    const tampered = { ...proof, childPubkey: proof.masterPubkey }
    expect(verifyLinkageProof(tampered)).toBe(false)
    identity.root.destroy()
  })
})

describe('destroyIdentity', () => {
  it('zeroes root and persona private keys', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)
    const npPrivKey = identity.naturalPerson.identity.privateKey
    const pPrivKey = identity.persona.identity.privateKey
    destroyIdentity(identity)
    expect(npPrivKey.every(b => b === 0)).toBe(true)
    expect(pPrivKey.every(b => b === 0)).toBe(true)
    expect(() => createLinkageProof(identity.root, identity.naturalPerson.identity, 'blind')).toThrow()
  })
})
