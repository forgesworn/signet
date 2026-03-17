/**
 * Signet Credential Presentation Protocol
 *
 * Handles age verification requests from websites.
 * Two modes:
 *   - Same device: BroadcastChannel communication
 *   - Cross device: QR code → relay-based response
 */

export interface VerifyRequest {
  type: 'signet-verify-request';
  requestId: string;
  requiredAgeRange: string;
  callbackUrl?: string;
  relayUrl?: string;
  timestamp: number;
}

export interface VerifyResponse {
  type: 'signet-verify-response';
  requestId: string;
  credential: {
    id: string;
    kind: number;
    pubkey: string;
    tags: string[][];
    content: string;
    sig: string;
    created_at: number;
  };
  subjectPubkey: string;
}

/**
 * Parse a verification request from a QR code payload
 */
export function parseVerifyRequest(data: string): VerifyRequest | null {
  try {
    // Try direct JSON first
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      // Try base64 decode (from signet:verify: prefix)
      const base64 = data.startsWith('signet:verify:') ? data.slice(14) : data;
      parsed = JSON.parse(atob(base64));
    }

    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (obj.type !== 'signet-verify-request') return null;
    if (typeof obj.requestId !== 'string') return null;
    if (typeof obj.requiredAgeRange !== 'string') return null;

    return {
      type: 'signet-verify-request',
      requestId: obj.requestId as string,
      requiredAgeRange: obj.requiredAgeRange as string,
      callbackUrl: typeof obj.callbackUrl === 'string' ? obj.callbackUrl : undefined,
      relayUrl: typeof obj.relayUrl === 'string' ? obj.relayUrl : undefined,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

/**
 * Build a verification response
 */
export function buildVerifyResponse(
  requestId: string,
  credential: VerifyResponse['credential'],
  subjectPubkey: string,
): VerifyResponse {
  return {
    type: 'signet-verify-response',
    requestId,
    credential,
    subjectPubkey,
  };
}

/**
 * Send response via BroadcastChannel (same-device flow)
 */
export function sendResponseViaBroadcast(response: VerifyResponse): void {
  const channel = new BroadcastChannel('signet-verify');
  channel.postMessage(response);
  channel.close();
}

/**
 * Check if the user's credential satisfies the request
 */
export function credentialSatisfiesRequest(
  credentialTags: string[][],
  requiredAgeRange: string,
): boolean {
  const ageRange = credentialTags.find(t => t[0] === 'age-range')?.[1];
  if (!ageRange) return false;

  if (requiredAgeRange === '18+') return ageRange === '18+';
  return ageRange === requiredAgeRange;
}
