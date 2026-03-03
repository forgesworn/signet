import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  data: string;
  size?: number;
}

export function QRCode({ data, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCodeLib.toCanvas(canvas, data, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000ff',
        light: '#00000000', // transparent background
      },
    }).catch((err: unknown) => {
      console.error('QR code generation failed:', err);
    });
  }, [data, size]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          padding: 8,
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}
