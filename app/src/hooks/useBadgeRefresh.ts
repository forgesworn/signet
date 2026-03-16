import { useCallback } from 'react';
import { fetchBadge, type CachedBadge } from '../lib/badge-fetch';
import { getFamilyMember, saveFamilyMember } from '../lib/db';
import type { FamilyMember } from '../types';

const STALE_THRESHOLD = 3600; // 1 hour in seconds

/** FamilyMember extended with optional cached badge data. */
type FamilyMemberWithBadge = FamilyMember & { badge?: CachedBadge };

/** Refresh badge data for a family member if stale. Returns updated badge or null. */
export function useBadgeRefresh(relayUrl?: string) {
  const refreshBadge = useCallback(async (pubkey: string) => {
    if (!relayUrl) return null;

    const member = await getFamilyMember(pubkey) as FamilyMemberWithBadge | undefined;
    if (!member) return null;

    // Skip if fresh
    const now = Math.floor(Date.now() / 1000);
    if (member.badge && (now - member.badge.fetchedAt) < STALE_THRESHOLD) {
      return member.badge;
    }

    const badge = await fetchBadge(pubkey, relayUrl);
    if (badge) {
      await saveFamilyMember({ ...member, badge } as FamilyMember);
    }
    return badge;
  }, [relayUrl]);

  return { refreshBadge };
}
