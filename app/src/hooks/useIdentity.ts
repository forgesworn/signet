import { useState, useEffect, useCallback } from 'react';
import { getIdentity, saveIdentity, deleteIdentity as dbDeleteIdentity, type StoredIdentity } from '../lib/db';
import { createNewIdentity, importIdentity } from '../lib/signet';

export function useIdentity() {
  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIdentity().then((id) => {
      setIdentity(id ?? null);
      setLoading(false);
    });
  }, []);

  const create = useCallback(async (role: StoredIdentity['role'], displayName: string) => {
    const newIdentity = createNewIdentity(role, displayName);
    await saveIdentity(newIdentity);
    setIdentity(newIdentity);
    return newIdentity;
  }, []);

  const importMnemonic = useCallback(async (mnemonic: string, role: StoredIdentity['role'], displayName: string) => {
    const imported = importIdentity(mnemonic, role, displayName);
    await saveIdentity(imported);
    setIdentity(imported);
    return imported;
  }, []);

  const remove = useCallback(async () => {
    await dbDeleteIdentity();
    setIdentity(null);
  }, []);

  return { identity, loading, create, importMnemonic, deleteIdentity: remove };
}
