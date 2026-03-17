/**
 * NIP-46 Remote Signer for My Signet
 *
 * Handles signing requests from websites via Nostr relay.
 * The app listens for requests, prompts the user, signs with their key.
 */

export interface NIP46Request {
  id: string;
  method: string;
  params: string[];
}

export interface NIP46Response {
  id: string;
  result?: string;
  error?: string;
}

export interface SigningRequest {
  id: string;
  method: string;
  origin: string;
  params: string[];
  timestamp: number;
}

/**
 * Parse a NIP-46 request from an encrypted event content
 */
export function parseNIP46Request(content: string): NIP46Request | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.id !== 'string' || typeof obj.method !== 'string' || !Array.isArray(obj.params)) return null;
    if (!obj.params.every((p: unknown) => typeof p === 'string')) return null;
    return { id: obj.id, method: obj.method, params: obj.params as string[] };
  } catch {
    return null;
  }
}

/**
 * Build a NIP-46 response
 */
export function buildNIP46Response(id: string, result?: string, error?: string): string {
  const response: NIP46Response = { id };
  if (result !== undefined) response.result = result;
  if (error !== undefined) response.error = error;
  return JSON.stringify(response);
}

/**
 * Supported NIP-46 methods
 */
export const SUPPORTED_METHODS = [
  'get_public_key',
  'sign_event',
  'get_relays',
  'nip04_encrypt',
  'nip04_decrypt',
] as const;

export type SupportedMethod = typeof SUPPORTED_METHODS[number];

export function isSupportedMethod(method: string): method is SupportedMethod {
  return (SUPPORTED_METHODS as readonly string[]).includes(method);
}
