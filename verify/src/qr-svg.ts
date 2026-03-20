import { encode } from 'uqr';

/**
 * Generate an inline SVG QR code from arbitrary string data.
 * Uses error correction level L (7%) for maximum data capacity.
 */
export function generateQRSvg(data: string, size: number = 200): string {
  const result = encode(data, { ecc: 'L' });
  const moduleCount = result.size;
  const cellSize = size / moduleCount;

  let paths = '';
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (result.data[y][x]) {
        paths += `M${x * cellSize},${y * cellSize}h${cellSize}v${cellSize}h-${cellSize}z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="white"/><path d="${paths}" fill="black"/></svg>`;
}
