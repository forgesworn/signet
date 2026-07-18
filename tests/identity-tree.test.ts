import { describe, it, expect } from 'vitest'
import { generateMnemonic, mnemonicToEntropy, entropyToMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { splitSecret, reconstructSecret } from '@forgesworn/shamir-words'
import {
  createSignetIdentity,
  createSignetIdentityFromNsec,
  deriveAdditionalPersona,
  deriveDependantIdentity,
  deriveSubIdentity,
  createLinkageProof,
  verifyLinkageProof,
  destroyIdentity,
} from '../src/identity-tree.js'
import { derive } from '../src/index.js'
import { bytesToHex } from '@noble/hashes/utils.js'

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

describe('deriveDependantIdentity frozen vectors', () => {
  // Fledgling and My Signet shipped these exact named paths before the API
  // moved here. Do not regenerate silently: mnemonic -> key drift or a path
  // rename would strand an existing dependant identity after restore.
  const vectors = [
    {
      index: 0,
      npPublicKey: '2353d09c8668dfb41e80b5191bcac280bc42ee679f487f310958a88c5202b75a',
      npPrivateKey: 'df1ad1ed87ebf1c4a92d24b1f471b13482bdcfbf138a0eecb97263fcfead4de1',
      personaPublicKey: '0cbbe50a249f6c047580a735a8944c8b50fd82c9533f8c831923b049df951e5f',
      personaPrivateKey: 'f6299a3d9a3df95becc687a8f4b1546d732deb6f4136ce93f44e936710af422f',
    },
    {
      index: 1,
      npPublicKey: 'bfde84e82fa1fd006654a0d44d40219c30f7a8d53f4a0782f0b2135b63442819',
      npPrivateKey: '628767991af35d5ba99021ceb5452b6b6d317b4f3bc980699bac10be6915167a',
      personaPublicKey: 'd5373e1b52c326aaef8390de927b1c8928dc331958dc6a425dcb2a11f38d9525',
      personaPrivateKey: '8a43d863fafa7e85095f18208b6cf0b013e6eff24dea996bd0d0925f54bba1cd',
    },
    {
      index: 2,
      npPublicKey: 'a1bca68cc4351858314922aa1c50eeec267c0f9ce93001b73b13f82342cff8e4',
      npPrivateKey: '0dc2c32ef9a6a2b11651d7719fa72a62108e64c270217d031195dd8337b06483',
      personaPublicKey: '378a2184dd96e67733e3e01a2272f7dd98aa2eef7c06c2ebc462e1535ea015ef',
      personaPrivateKey: '958c6ea704fb28a08f14020b0b301fc7952716563d9f7584f80842b0b939eb35',
    },
  ]

  for (const vector of vectors) {
    it(`freezes dependant-${vector.index}-np and dependant-${vector.index}-persona`, () => {
      const tree = createSignetIdentity('legal winner thank year wave sausage worth useful legal winner thank yellow')
      const dependant = deriveDependantIdentity(tree.root, vector.index)
      expect(dependant.derivationPath).toBe(`dependant-${vector.index}`)
      expect(dependant.naturalPerson.name).toBe(`dependant-${vector.index}-np`)
      expect(dependant.persona.name).toBe(`dependant-${vector.index}-persona`)
      expect(bytesToHex(dependant.naturalPerson.identity.publicKey)).toBe(vector.npPublicKey)
      expect(bytesToHex(dependant.naturalPerson.identity.privateKey)).toBe(vector.npPrivateKey)
      expect(bytesToHex(dependant.persona.identity.publicKey)).toBe(vector.personaPublicKey)
      expect(bytesToHex(dependant.persona.identity.privateKey)).toBe(vector.personaPrivateKey)
      destroyIdentity(tree)
      dependant.naturalPerson.identity.privateKey.fill(0)
      dependant.persona.identity.privateKey.fill(0)
    })
  }

  it('rejects negative, fractional and unsafe indices', () => {
    const tree = createSignetIdentity(TEST_MNEMONIC)
    for (const invalid of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => deriveDependantIdentity(tree.root, invalid)).toThrow()
    }
    destroyIdentity(tree)
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

describe('Shamir backup round-trip', () => {
  it('split mnemonic entropy, reconstruct, create identity — same result', () => {
    const entropyBytes = mnemonicToEntropy(TEST_MNEMONIC, wordlist)

    const shares = splitSecret(entropyBytes, 2, 3)
    const reconstructed = reconstructSecret([shares[0], shares[2]], 2)
    const recoveredMnemonic = entropyToMnemonic(reconstructed, wordlist)

    const original = createSignetIdentity(TEST_MNEMONIC)
    const recovered = createSignetIdentity(recoveredMnemonic)
    expect(recovered.naturalPerson.identity.npub).toBe(original.naturalPerson.identity.npub)
    expect(recovered.persona.identity.npub).toBe(original.persona.identity.npub)
    expect(recovered.root.masterPubkey).toBe(original.root.masterPubkey)
    original.root.destroy()
    recovered.root.destroy()
  })
})

describe('raw derive() re-export', () => {
  it('reproduces a raw-purpose identity, distinct from the persona namespace', () => {
    const identity = createSignetIdentity(TEST_MNEMONIC)

    // A persona named X is purpose nostr:persona:X (PROTOCOL v1.1 §3.1).
    const persona = deriveAdditionalPersona(identity.root, 'social')
    const viaRawPersonaPurpose = derive(identity.root, 'nostr:persona:social', 0)
    expect(viaRawPersonaPurpose.npub).toBe(persona.identity.npub)
    expect(viaRawPersonaPurpose.npub).toBe(
      'npub1qdztfxg9z46k8qg4707n747y9rt7kl3f954lju2pneesmc3ypf2q83gm0e',
    )

    // The RAW purpose "social" is a different identity (e.g. an nsec-tree CLI
    // `derive path social`) — the re-export lets signet reproduce it too.
    const raw = derive(identity.root, 'social', 0)
    expect(raw.npub).not.toBe(persona.identity.npub)

    destroyIdentity(identity)
  })
})
