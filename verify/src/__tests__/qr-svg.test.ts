import { describe, it, expect } from 'vitest';
import { generateQRSvg } from '../qr-svg';

describe('generateQRSvg', () => {
  it('generates valid SVG markup', () => {
    const svg = generateQRSvg('hello world');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  it('generates different SVGs for different data', () => {
    const a = generateQRSvg('test-a');
    const b = generateQRSvg('test-b');
    expect(a).not.toBe(b);
  });

  it('handles a realistic verify request payload', () => {
    const payload = JSON.stringify({
      type: 'signet-verify-request',
      requestId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      requiredAgeRange: '18+',
      relayUrl: 'wss://nos.lol',
      timestamp: 1710000000,
    });
    const svg = generateQRSvg(payload);
    expect(svg).toContain('<svg');
    expect(svg.length).toBeGreaterThan(100);
  });
});
