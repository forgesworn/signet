import { useState, useEffect, useCallback } from 'react';
import type { StoredCredential } from '../types';
import * as db from '../lib/db';

export function useCredentials() {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const creds = await db.getAllCredentials();
    setCredentials(creds);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addCredential = useCallback(async (cred: StoredCredential) => {
    await db.saveCredential(cred);
    await loadAll();
  }, [loadAll]);

  return { credentials, loading, addCredential, refresh: loadAll };
}
