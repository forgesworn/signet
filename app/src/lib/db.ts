import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'signet';
const DB_VERSION = 1;

export interface StoredIdentity {
  id: 'current';
  mnemonic: string;
  publicKey: string;
  privateKey: string;
  role: 'adult' | 'child' | 'verifier';
  displayName: string;
  createdAt: number;
}

export interface StoredConnection {
  pubkey: string;
  sharedSecret: string;
  theirInfo: {
    name?: string;
    mobile?: string;
    email?: string;
    address?: string;
    childPubkeys?: string[];
  };
  ourInfo: {
    name?: string;
    mobile?: string;
    email?: string;
    address?: string;
    childPubkeys?: string[];
  };
  connectedAt: number;
  method: string;
}

export interface StoredPreferences {
  id: 'current';
  theme: 'system' | 'light' | 'dark';
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('connections')) {
          db.createObjectStore('connections', { keyPath: 'pubkey' });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Identity
export async function getIdentity(): Promise<StoredIdentity | undefined> {
  const db = await getDB();
  return db.get('identity', 'current');
}

export async function saveIdentity(identity: StoredIdentity): Promise<void> {
  const db = await getDB();
  await db.put('identity', identity);
}

export async function deleteIdentity(): Promise<void> {
  const db = await getDB();
  await db.delete('identity', 'current');
}

// Connections
export async function getConnections(): Promise<StoredConnection[]> {
  const db = await getDB();
  return db.getAll('connections');
}

export async function getConnection(pubkey: string): Promise<StoredConnection | undefined> {
  const db = await getDB();
  return db.get('connections', pubkey);
}

export async function saveConnection(connection: StoredConnection): Promise<void> {
  const db = await getDB();
  await db.put('connections', connection);
}

export async function deleteConnection(pubkey: string): Promise<void> {
  const db = await getDB();
  await db.delete('connections', pubkey);
}

export async function clearConnections(): Promise<void> {
  const db = await getDB();
  await db.clear('connections');
}

// Preferences
export async function getPreferences(): Promise<StoredPreferences> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'current');
  return prefs ?? { id: 'current', theme: 'system' };
}

export async function savePreferences(prefs: StoredPreferences): Promise<void> {
  const db = await getDB();
  await db.put('preferences', prefs);
}
