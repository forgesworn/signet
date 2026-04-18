import { describe, it, expect } from 'vitest';
import { routeQR } from '../src/index.js';

const VALID_SESSION_PUBKEY = '1'.repeat(64);
const VALID_RELAY = 'wss://relay.example.com';

function authBase(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'signet-auth-request',
    requestId: 'a'.repeat(32),
    challenge: 'b'.repeat(32),
    origin: 'https://example.com',
    timestamp: Math.floor(Date.now() / 1000),
    ...extra,
  });
}

function loginBase(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'signet-login-request',
    requestId: 'a'.repeat(32),
    challenge: 'b'.repeat(32),
    origin: 'https://example.com',
    timestamp: Math.floor(Date.now() / 1000),
    ...extra,
  });
}

describe('routeQR — sessionPubkey validation on AuthRequest', () => {
  it('accepts matched relay + sessionPubkey pair', () => {
    const qr = authBase({ relay: VALID_RELAY, sessionPubkey: VALID_SESSION_PUBKEY });
    const result = routeQR(qr);
    expect(result.type).toBe('auth');
  });

  it('rejects sessionPubkey without relay', () => {
    const qr = authBase({ sessionPubkey: VALID_SESSION_PUBKEY });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('rejects relay without sessionPubkey', () => {
    const qr = authBase({ relay: VALID_RELAY });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('rejects malformed sessionPubkey (non-hex)', () => {
    const qr = authBase({ relay: VALID_RELAY, sessionPubkey: 'not-a-hex-pubkey' });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('rejects malformed sessionPubkey (wrong length)', () => {
    const qr = authBase({ relay: VALID_RELAY, sessionPubkey: '1'.repeat(63) });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('accepts request with neither relay nor sessionPubkey', () => {
    const qr = authBase();
    const result = routeQR(qr);
    expect(result.type).toBe('auth');
  });
});

describe('routeQR — sessionPubkey validation on LoginRequest', () => {
  it('accepts matched relay + sessionPubkey pair', () => {
    const qr = loginBase({ relay: VALID_RELAY, sessionPubkey: VALID_SESSION_PUBKEY });
    const result = routeQR(qr);
    expect(result.type).toBe('login');
  });

  it('rejects sessionPubkey without relay', () => {
    const qr = loginBase({ sessionPubkey: VALID_SESSION_PUBKEY });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('rejects relay without sessionPubkey', () => {
    const qr = loginBase({ relay: VALID_RELAY });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('rejects malformed sessionPubkey', () => {
    const qr = loginBase({ relay: VALID_RELAY, sessionPubkey: 'z'.repeat(64) });
    const result = routeQR(qr);
    expect(result.type).toBe('unknown');
  });

  it('accepts request with neither relay nor sessionPubkey', () => {
    const qr = loginBase();
    const result = routeQR(qr);
    expect(result.type).toBe('login');
  });
});
