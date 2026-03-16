import { useState, useEffect, useCallback } from 'react';
import type { FamilyMember } from '../types';
import * as db from '../lib/db';

export function useFamily(ownerPubkey: string | undefined) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!ownerPubkey) { setMembers([]); setLoading(false); return; }
    const all = await db.getFamilyMembers(ownerPubkey);
    setMembers(all.sort((a, b) => b.verifiedAt - a.verifiedAt));
    setLoading(false);
  }, [ownerPubkey]);

  useEffect(() => { reload(); }, [reload]);

  const addMember = useCallback(async (member: FamilyMember) => {
    await db.saveFamilyMember(member);
    await reload();
  }, [reload]);

  const removeMember = useCallback(async (pubkey: string) => {
    await db.deleteFamilyMember(pubkey);
    await reload();
  }, [reload]);

  return { members, loading, addMember, removeMember, reload };
}
