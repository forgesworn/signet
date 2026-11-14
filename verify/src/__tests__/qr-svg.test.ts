import { describe, it, expect } from 'vitest';
import { decode, encode } from '@forgesworn/qr';
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

  it('keeps the requested pixel size and a one-module quiet zone', () => {
    const svg = generateQRSvg('hello world', 240);
    const side = encode('hello world', { ecc: 'L' }).size + 2;
    expect(svg).toContain('width="240" height="240"');
    expect(svg).toContain(`viewBox="0 0 ${side} ${side}"`);
  });

  it('draws modules that read back to the payload', () => {
    const payload = 'signet-verify-request:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    const qr = encode(payload, { ecc: 'L' });
    const margin = 1;
    const scale = 4;
    const side = (qr.size + margin * 2) * scale;
    const data = new Uint8ClampedArray(side * side * 4).fill(255);
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.modules[y * qr.size + x] !== 1) continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const i = (((y + margin) * scale + dy) * side + (x + margin) * scale + dx) * 4;
            data[i] = data[i + 1] = data[i + 2] = 0;
          }
        }
      }
    }
    expect(decode({ data, width: side, height: side })?.text).toBe(payload);
  });
});
