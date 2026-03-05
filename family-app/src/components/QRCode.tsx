import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface Props {
  data: string;
  size?: number;
}

export function QRCode({ data, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 1,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
    });
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: 'var(--radius)',
        background: '#FFFFFF',
        padding: 8,
        border: '1px solid var(--border)',
      }}
    />
  );
}
