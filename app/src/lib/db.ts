// IndexedDB storage for My Signet family app

import { openDB, type IDBPDatabase } from 'idb';
import type { FamilyIdentity, FamilyMember, ChildSettings, AppPreferences } from '../types';
import { encryptSecret, decryptSecret } from './crypto-store';

export { encryptSecret, decryptSecret } from './crypto-store';

const DB_NAME = 'my-signet';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('family')) {
          const family = db.createObjectStore('family', { keyPath: 'pubkey' });
          family.createIndex('ownerPubkey', 'ownerPubkey');
        }
        if (!db.objectStoreNames.contains('child-settings')) {
          db.createObjectStore('child-settings', { keyPath: 'childPubkey' });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// --- Identity ---

export async function getIdentity(pubkey: string): Promise<FamilyIdentity | undefined> {
  const db = await getDB();
  return db.get('identity', pubkey);
}

export async function getAllIdentities(): Promise<FamilyIdentity[]> {
  const db = await getDB();
  return db.getAll('identity');
}

/**
 * @deprecated Stores privateKey and mnemonic in plaintext.
 * Use saveIdentityEncrypted instead to protect private key material at rest.
 */
export async function saveIdentity(identity: FamilyIdentity): Promise<void> {
  const db = await getDB();
  await db.put('identity', identity);
}

/**
 * Encrypt privateKey and mnemonic with a passphrase-derived AES-256-GCM key before storing.
 * The stored record has encrypted: true so callers know to decrypt on load.
 */
export async function saveIdentityEncrypted(identity: FamilyIdentity, passphrase: string): Promise<void> {
  const encryptedPrivateKey = await encryptSecret(identity.privateKey, passphrase);
  const encryptedMnemonic = await encryptSecret(identity.mnemonic, passphrase);

  const encryptedIdentity: FamilyIdentity = {
    ...identity,
    privateKey: encryptedPrivateKey,
    mnemonic: encryptedMnemonic,
    encrypted: true,
  };

  const db = await getDB();
  await db.put('identity', encryptedIdentity);
}

/**
 * Load an identity and decrypt privateKey and mnemonic if they were stored encrypted.
 * Returns undefined if no identity exists for the given pubkey.
 * Throws if decryption fails (wrong passphrase).
 */
export async function loadIdentityDecrypted(pubkey: string, passphrase: string): Promise<FamilyIdentity | undefined> {
  const db = await getDB();
  const stored: FamilyIdentity | undefined = await db.get('identity', pubkey);
  if (!stored) return undefined;

  if (!stored.encrypted) return stored;

  const privateKey = await decryptSecret(stored.privateKey, passphrase);
  const mnemonic = await decryptSecret(stored.mnemonic, passphrase);

  return { ...stored, privateKey, mnemonic, encrypted: false };
}

export async function deleteIdentityRecord(pubkey: string): Promise<void> {
  const db = await getDB();
  await db.delete('identity', pubkey);
}

// --- Family Members ---

export async function getFamilyMembers(ownerPubkey: string): Promise<FamilyMember[]> {
  const db = await getDB();
  return db.getAllFromIndex('family', 'ownerPubkey', ownerPubkey);
}

export async function getFamilyMember(pubkey: string): Promise<FamilyMember | undefined> {
  const db = await getDB();
  return db.get('family', pubkey);
}

export async function saveFamilyMember(member: FamilyMember): Promise<void> {
  const db = await getDB();
  await db.put('family', member);
}

export async function deleteFamilyMember(pubkey: string): Promise<void> {
  const db = await getDB();
  await db.delete('family', pubkey);
}

// --- Child Settings ---

export async function getChildSettings(childPubkey: string): Promise<ChildSettings | undefined> {
  const db = await getDB();
  return db.get('child-settings', childPubkey);
}

export async function saveChildSettings(settings: ChildSettings): Promise<void> {
  const db = await getDB();
  await db.put('child-settings', settings);
}

// --- Preferences ---

export async function getPreferences(): Promise<AppPreferences> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'current');
  return prefs || { id: 'current', theme: 'system' };
}

export async function savePreferences(prefs: AppPreferences): Promise<void> {
  const db = await getDB();
  await db.put('preferences', prefs);
}
