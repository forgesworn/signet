import { useState, useEffect, useCallback } from 'react';
import { getConnections, saveConnection, deleteConnection as dbDeleteConnection, type StoredConnection } from '../lib/db';

export function useConnections() {
  const [connections, setConnections] = useState<StoredConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const conns = await getConnections();
    setConnections(conns);
  }, []);

  useEffect(() => {
    reload().then(() => setLoading(false));
  }, [reload]);

  const addConnection = useCallback(async (connection: StoredConnection) => {
    await saveConnection(connection);
    await reload();
  }, [reload]);

  const removeConnection = useCallback(async (pubkey: string) => {
    await dbDeleteConnection(pubkey);
    await reload();
  }, [reload]);

  return { connections, loading, addConnection, removeConnection, reload };
}
