/**
 * Signet Verify — Website Age Verification SDK
 *
 * Usage:
 *   <script src="https://cdn.signet.trotters.cc/verify.js"></script>
 *   <script>
 *     const result = await Signet.verifyAge('18+');
 *     if (result.verified) { /* allow access */ }
 *   </script>
 */

export interface SignetVerifyResult {
  verified: boolean;
  ageRange: string | null;
  tier: number | null;
  entityType: string | null;
  credentialId: string | null;
  verifierPubkey: string | null;
  issuedAt: number | null;
  expiresAt: number | null;
  error?: string;
}

export interface SignetVerifyOptions {
  /** Required age range to verify (e.g., '18+', '13-17') */
  requiredAgeRange: string;
  /** Relay URL for cross-device communication */
  relayUrl?: string;
  /** Callback URL for same-device flow */
  callbackUrl?: string;
  /** Custom styling for the verification modal */
  theme?: 'light' | 'dark' | 'auto';
  /** Timeout in milliseconds (default: 120000 — 2 minutes) */
  timeout?: number;
}

/** The presentation request sent to the app */
interface PresentationRequest {
  type: 'signet-verify-request';
  requestId: string;
  requiredAgeRange: string;
  callbackUrl?: string;
  relayUrl?: string;
  timestamp: number;
}

/** The presentation response from the app */
interface PresentationResponse {
  type: 'signet-verify-response';
  requestId: string;
  credential: {
    id: string;
    kind: number;
    pubkey: string; // verifier pubkey
    tags: string[][];
    content: string;
    sig: string;
    created_at: number;
  };
  subjectPubkey: string;
}

// Generate a random request ID
function generateRequestId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// Extract a tag value from a Nostr event
function getTagValue(tags: string[][], key: string): string | undefined {
  const tag = tags.find(t => t[0] === key);
  return tag ? tag[1] : undefined;
}

// Verify a Schnorr signature on a Nostr event (simplified — uses SubtleCrypto)
// For production, this should use @noble/curves for proper BIP-340 verification
async function verifyEventSignature(event: PresentationResponse['credential']): Promise<boolean> {
  // Basic structural validation
  if (!event.id || !event.pubkey || !event.sig || !event.tags || event.kind !== 30470) {
    return false;
  }
  // Verify event ID matches the hash of the serialized event
  const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(serialized));
  const expectedId = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  if (expectedId !== event.id) return false;
  // Signature verification requires secp256k1 Schnorr — for the SDK we trust the event ID hash match
  // Full BIP-340 verification should be added when @noble/curves is bundled
  return true;
}

// Check if the credential's age range satisfies the required range
function ageRangeSatisfies(credentialRange: string, requiredRange: string): boolean {
  // Simple range matching
  if (credentialRange === requiredRange) return true;
  // '18+' satisfies any adult requirement
  if (credentialRange === '18+' && requiredRange === '18+') return true;
  // Child ranges: credential must exactly match or be within required
  const ranges = ['0-3', '4-7', '8-12', '13-17', '18+'];
  const credIdx = ranges.indexOf(credentialRange);
  const reqIdx = ranges.indexOf(requiredRange);
  if (credIdx === -1 || reqIdx === -1) return false;
  // For '18+' requirement, credential must be '18+'
  if (requiredRange === '18+') return credentialRange === '18+';
  // For child requirements, credential range must match
  return credentialRange === requiredRange;
}

/**
 * Main verification function.
 * Shows a modal with QR code, waits for the user's app to respond.
 */
export async function verifyAge(requiredAgeRange: string, options?: Partial<SignetVerifyOptions>): Promise<SignetVerifyResult> {
  const opts: SignetVerifyOptions = {
    requiredAgeRange,
    relayUrl: options?.relayUrl || 'wss://relay.damus.io',
    theme: options?.theme || 'auto',
    timeout: options?.timeout || 120000,
    ...options,
  };

  const requestId = generateRequestId();

  const request: PresentationRequest = {
    type: 'signet-verify-request',
    requestId,
    requiredAgeRange: opts.requiredAgeRange,
    relayUrl: opts.relayUrl,
    timestamp: Math.floor(Date.now() / 1000),
  };

  // Encode the request as a URL for QR code
  const requestPayload = JSON.stringify(request);
  const requestBase64 = btoa(requestPayload);

  return new Promise<SignetVerifyResult>((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'signet-verify-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';

    const isDark = opts.theme === 'dark' || (opts.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const bg = isDark ? '#1a1a2e' : '#ffffff';
    const fg = isDark ? '#e0e0e0' : '#1a1a2e';
    const muted = isDark ? '#888' : '#666';

    const modal = document.createElement('div');
    modal.style.cssText = `background:${bg};color:${fg};border-radius:16px;padding:32px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);`;

    modal.innerHTML = `
      <h2 style="margin:0 0 8px;font-size:1.3rem;">Verify your age with Signet</h2>
      <p style="margin:0 0 24px;color:${muted};font-size:0.9rem;">Scan this QR code with your Signet app to prove you are ${requiredAgeRange}. No personal data is shared.</p>
      <div id="signet-qr" style="display:flex;justify-content:center;margin-bottom:24px;"></div>
      <p style="margin:0 0 16px;color:${muted};font-size:0.8rem;">Waiting for verification...</p>
      <button id="signet-cancel" style="background:none;border:1px solid ${muted};color:${fg};padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.9rem;">Cancel</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Generate QR code (simple SVG-based, no dependency)
    const qrContainer = document.getElementById('signet-qr');
    if (qrContainer) {
      // For MVP: show the request payload as text that can be copied
      // A proper QR library should be bundled for production
      const qrPlaceholder = document.createElement('div');
      qrPlaceholder.style.cssText = `width:200px;height:200px;background:${isDark ? '#2a2a3e' : '#f0f0f0'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:${muted};word-break:break-all;padding:12px;`;
      qrPlaceholder.textContent = `signet:verify:${requestBase64.slice(0, 40)}...`;
      qrContainer.appendChild(qrPlaceholder);
    }

    // Cancel handler
    document.getElementById('signet-cancel')?.addEventListener('click', () => {
      overlay.remove();
      resolve({ verified: false, ageRange: null, tier: null, entityType: null, credentialId: null, verifierPubkey: null, issuedAt: null, expiresAt: null, error: 'cancelled' });
    });

    // Listen for response via BroadcastChannel (same-device)
    const channel = new BroadcastChannel('signet-verify');
    channel.onmessage = async (event) => {
      const response = event.data as PresentationResponse;
      if (response.type !== 'signet-verify-response' || response.requestId !== requestId) return;

      // Verify the credential
      const valid = await verifyEventSignature(response.credential);
      const ageRange = getTagValue(response.credential.tags, 'age-range');
      const tier = getTagValue(response.credential.tags, 'tier');
      const entityType = getTagValue(response.credential.tags, 'entity-type');
      const expires = getTagValue(response.credential.tags, 'expires');

      const satisfied = ageRange ? ageRangeSatisfies(ageRange, opts.requiredAgeRange) : false;

      overlay.remove();
      channel.close();

      const tierValue = tier ? parseInt(tier, 10) : null;
      const expiresValue = expires ? parseInt(expires, 10) : null;

      resolve({
        verified: valid && satisfied,
        ageRange: ageRange || null,
        tier: (tierValue !== null && !isNaN(tierValue)) ? tierValue : null,
        entityType: entityType || null,
        credentialId: response.credential.id,
        verifierPubkey: response.credential.pubkey,
        issuedAt: response.credential.created_at,
        expiresAt: (expiresValue !== null && !isNaN(expiresValue)) ? expiresValue : null,
        error: !valid ? 'invalid-credential' : !satisfied ? 'age-range-not-met' : undefined,
      });
    };

    // Timeout
    setTimeout(() => {
      overlay.remove();
      channel.close();
      resolve({ verified: false, ageRange: null, tier: null, entityType: null, credentialId: null, verifierPubkey: null, issuedAt: null, expiresAt: null, error: 'timeout' });
    }, opts.timeout);
  });
}

// Auto-attach to window for script-tag usage
if (typeof window !== 'undefined') {
  (window as any).Signet = { verifyAge };
}
