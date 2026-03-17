/**
 * Admin and bootstrap configuration for My Signet.
 *
 * ADMIN_PUBKEY: RenegAid admin key — full admin access.
 * Automatically activates verifier mode, bypasses 5-tap easter egg.
 *
 * BOOTSTRAP_VERIFIERS: Initial trusted verifier seed.
 * The first verified professional(s) in the network that others
 * cross-verify against. These pubkeys are accepted at full Verifier IQ
 * (Method B equivalent) without requiring external confirmation.
 */

/** RenegAid admin pubkey — full admin privileges in the app */
export const ADMIN_PUBKEY = '13d50cd10d6645d0c87c61b21308a69c0cbe2422a8acce72641786839d39f7ec';

/** Bootstrap verifier pubkeys — initial trust anchors for the network */
export const BOOTSTRAP_VERIFIERS: readonly string[] = [
  '13d50cd10d6645d0c87c61b21308a69c0cbe2422a8acce72641786839d39f7ec',
] as const;

/** Check if a pubkey is an admin */
export function isAdmin(pubkey: string): boolean {
  return pubkey === ADMIN_PUBKEY;
}

/** Check if a pubkey is a bootstrap verifier */
export function isBootstrapVerifier(pubkey: string): boolean {
  return BOOTSTRAP_VERIFIERS.includes(pubkey);
}
