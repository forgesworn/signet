import { describe, it, expect } from 'vitest';
import { nip04Encrypt, nip04Decrypt } from '../src/nip04.js';
import { generateKeyPair, getPublicKey } from '../src/crypto.js';

describe('NIP-04 Encrypted Direct Messages', () => {
  // ── Round-trip ──────────────────────────────────────────────────────────────

  it('round-trip: Alice encrypts, Bob decrypts', async () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();

    const message = 'Hello Bob, this is a secret message!';
    const encrypted = await nip04Encrypt(alice.privateKey, bob.publicKey, message);

    // Verify NIP-04 format: base64 + "?iv=" + base64
    expect(encrypted).toContain('?iv=');

    const decrypted = await nip04Decrypt(bob.privateKey, alice.publicKey, encrypted);
    expect(decrypted).toBe(message);
  });

  // ── Symmetric ──────────────────────────────────────────────────────────────

  it('symmetric: both directions work', async () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();

    const messageFromAlice = 'Message from Alice';
    const messageFromBob = 'Message from Bob';

    // Alice → Bob
    const encryptedByAlice = await nip04Encrypt(alice.privateKey, bob.publicKey, messageFromAlice);
    const decryptedByBob = await nip04Decrypt(bob.privateKey, alice.publicKey, encryptedByAlice);
    expect(decryptedByBob).toBe(messageFromAlice);

    // Bob → Alice
    const encryptedByBob = await nip04Encrypt(bob.privateKey, alice.publicKey, messageFromBob);
    const decryptedByAlice = await nip04Decrypt(alice.privateKey, bob.publicKey, encryptedByBob);
    expect(decryptedByAlice).toBe(messageFromBob);
  });

  // ── Random IV ──────────────────────────────────────────────────────────────

  it('random IV: same message produces different ciphertext', async () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();

    const message = 'Same message encrypted twice';
    const encrypted1 = await nip04Encrypt(alice.privateKey, bob.publicKey, message);
    const encrypted2 = await nip04Encrypt(alice.privateKey, bob.publicKey, message);

    // Ciphertext should differ due to random IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same plaintext
    const decrypted1 = await nip04Decrypt(bob.privateKey, alice.publicKey, encrypted1);
    const decrypted2 = await nip04Decrypt(bob.privateKey, alice.publicKey, encrypted2);
    expect(decrypted1).toBe(message);
    expect(decrypted2).toBe(message);
  });

  // ── Large message (stack overflow regression) ─────────────────────────────

  it('handles large messages without stack overflow', async () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();

    // 100 KB message — previously would throw RangeError from spread operator
    const message = 'A'.repeat(100_000);
    const encrypted = await nip04Encrypt(alice.privateKey, bob.publicKey, message);
    const decrypted = await nip04Decrypt(bob.privateKey, alice.publicKey, encrypted);
    expect(decrypted).toBe(message);
  });

  // ── Malformed ciphertext ──────────────────────────────────────────────────

  it('rejects ciphertext with no ?iv= separator', async () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    await expect(nip04Decrypt(bob.privateKey, alice.publicKey, 'base64only')).rejects.toThrow('Invalid NIP-04 ciphertext format');
  });

  // ── Cross-compatibility with known keys ────────────────────────────────────

  it('cross-compatibility: known privkeys verify ECDH correctness', async () => {
    // Use fixed private keys to ensure deterministic ECDH
    const alicePriv = '0000000000000000000000000000000000000000000000000000000000000001';
    const bobPriv = '0000000000000000000000000000000000000000000000000000000000000002';

    const alicePub = getPublicKey(alicePriv);
    const bobPub = getPublicKey(bobPriv);

    // Verify the derived pubkeys are correct 64-char hex
    expect(alicePub).toMatch(/^[0-9a-f]{64}$/);
    expect(bobPub).toMatch(/^[0-9a-f]{64}$/);

    const message = 'Cross-compatibility test with known keys';

    // Encrypt with Alice's privkey + Bob's pubkey
    const encrypted = await nip04Encrypt(alicePriv, bobPub, message);

    // Decrypt with Bob's privkey + Alice's pubkey — proves ECDH is symmetric
    const decrypted = await nip04Decrypt(bobPriv, alicePub, encrypted);
    expect(decrypted).toBe(message);

    // Also verify the reverse direction
    const encrypted2 = await nip04Encrypt(bobPriv, alicePub, message);
    const decrypted2 = await nip04Decrypt(alicePriv, bobPub, encrypted2);
    expect(decrypted2).toBe(message);
  });
});
