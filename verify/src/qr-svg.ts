import { encode, toSvg } from '@forgesworn/qr';

/**
 * Generate an inline SVG QR code from arbitrary string data.
 * Uses error correction level L (7%) for maximum data capacity, a one-module
 * quiet zone, black modules on white, and a fixed pixel size.
 */
export function generateQRSvg(data: string, size: number = 200): string {
  const svg = toSvg(encode(data, { ecc: 'L' }), { margin: 1, dark: '#000', light: '#fff' });
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
}
