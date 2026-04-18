import { describe, it, expect } from 'vitest';
import { parseUrlAuthParams } from '../src/index.js';

// Helper to build an auth query string with the current timestamp.
function buildAuthSearch(extra: Record<string, string> = {}, overrides: Partial<Record<'auth' | 'challenge' | 'origin' | 'name' | 'callback' | 't', string>> = {}): string {
  const base: Record<string, string> = {
    auth: '1',
    challenge: 'a'.repeat(64),
    origin: 'https://example.com',
    name: 'Example',
    callback: 'https://example.com/auth/callback',
    t: String(Math.floor(Date.now() / 1000)),
    ...overrides,
    ...extra,
  };
  return '?' + new URLSearchParams(base).toString();
}

const VALID_SESSION_PUBKEY = '1'.repeat(64);
const VALID_RELAY = 'wss://relay.example.com';

describe('parseUrlAuthParams — baseline redirect mode', () => {
  it('parses a minimal valid request with no relay params', () => {
    const result = parseUrlAuthParams(buildAuthSearch());
    expect(result).not.toBeNull();
    expect(result?.type).toBe('signet-login-request');
    expect(result?.challenge).toBe('a'.repeat(64));
    expect(result?.origin).toBe('https://example.com');
    expect(result?.callbackUrl).toBe('https://example.com/auth/callback');
    expect(result?.relay).toBeUndefined();
    expect(result?.sessionPubkey).toBeUndefined();
  });

  it('rejects when required params missing', () => {
    expect(parseUrlAuthParams(buildAuthSearch({}, { challenge: '' }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({}, { origin: '' }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({}, { callback: '' }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({}, { name: '' }))).toBeNull();
  });

  it('rejects malformed challenge', () => {
    expect(parseUrlAuthParams(buildAuthSearch({}, { challenge: 'too-short' }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({}, { challenge: 'z'.repeat(64) }))).toBeNull();
  });

  it('rejects mismatched callback origin', () => {
    expect(parseUrlAuthParams(buildAuthSearch({}, { callback: 'https://attacker.com/cb' }))).toBeNull();
  });

  it('rejects stale timestamp', () => {
    const stale = String(Math.floor(Date.now() / 1000) - 600);
    expect(parseUrlAuthParams(buildAuthSearch({}, { t: stale }))).toBeNull();
  });
});

describe('parseUrlAuthParams — relay delivery mode', () => {
  it('parses a valid relay + sessionPubkey pair', () => {
    const result = parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: VALID_SESSION_PUBKEY }));
    expect(result).not.toBeNull();
    expect(result?.relay).toBe(VALID_RELAY);
    expect(result?.sessionPubkey).toBe(VALID_SESSION_PUBKEY);
  });

  it('accepts ws://localhost for development', () => {
    const result = parseUrlAuthParams(buildAuthSearch({ relay: 'ws://localhost:7777', sessionPubkey: VALID_SESSION_PUBKEY }));
    expect(result).not.toBeNull();
    expect(result?.relay).toBe('ws://localhost:7777');
  });

  it('accepts ws://127.0.0.1 for development', () => {
    const result = parseUrlAuthParams(buildAuthSearch({ relay: 'ws://127.0.0.1:7777', sessionPubkey: VALID_SESSION_PUBKEY }));
    expect(result).not.toBeNull();
  });

  it('normalises sessionPubkey to lowercase', () => {
    const upper = 'A'.repeat(64);
    const result = parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: upper }));
    expect(result?.sessionPubkey).toBe('a'.repeat(64));
  });

  it('rejects relay without sessionPubkey', () => {
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY }))).toBeNull();
  });

  it('rejects sessionPubkey without relay', () => {
    expect(parseUrlAuthParams(buildAuthSearch({ sessionPubkey: VALID_SESSION_PUBKEY }))).toBeNull();
  });

  it('rejects non-wss relay URL', () => {
    expect(parseUrlAuthParams(buildAuthSearch({ relay: 'https://relay.example.com', sessionPubkey: VALID_SESSION_PUBKEY }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({ relay: 'ws://evil.example.com', sessionPubkey: VALID_SESSION_PUBKEY }))).toBeNull();
  });

  it('rejects over-long relay URL', () => {
    const tooLong = 'wss://' + 'a'.repeat(1024) + '.example.com';
    expect(parseUrlAuthParams(buildAuthSearch({ relay: tooLong, sessionPubkey: VALID_SESSION_PUBKEY }))).toBeNull();
  });

  it('rejects malformed sessionPubkey', () => {
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: 'not-hex' }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: '1'.repeat(63) }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: '1'.repeat(65) }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: 'z'.repeat(64) }))).toBeNull();
  });

  it('still enforces all redirect-mode validations when relay params present', () => {
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: VALID_SESSION_PUBKEY }, { challenge: 'too-short' }))).toBeNull();
    expect(parseUrlAuthParams(buildAuthSearch({ relay: VALID_RELAY, sessionPubkey: VALID_SESSION_PUBKEY }, { callback: 'https://attacker.com/cb' }))).toBeNull();
  });
});
