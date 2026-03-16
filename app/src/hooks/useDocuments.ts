import { useState, useEffect, useCallback } from 'react';
import type { IdentityDocument } from '../types';
import * as db from '../lib/db';

export function useDocuments(ownerPubkey?: string) {
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!ownerPubkey) { setDocuments([]); setLoading(false); return; }
    const docs = await db.getDocumentsByOwner(ownerPubkey);
    setDocuments(docs);
    setLoading(false);
  }, [ownerPubkey]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addDocument = useCallback(async (doc: IdentityDocument) => {
    await db.saveDocument(doc);
    await loadAll();
  }, [loadAll]);

  const removeDocument = useCallback(async (id: string) => {
    await db.deleteDocument(id);
    await loadAll();
  }, [loadAll]);

  return { documents, loading, addDocument, removeDocument, refresh: loadAll };
}
