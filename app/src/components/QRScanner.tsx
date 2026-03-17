import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  active: boolean;
}

export function QRScanner({ onScan, active }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* ignore cleanup errors */ }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) { stopScanner(); scannedRef.current = false; return; }

    const scanner = new Html5Qrcode('signet-qr-scanner');
    scannerRef.current = scanner;
    scannedRef.current = false;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 5,                    // lower FPS reduces jerkiness on mobile
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Use 70% of the smaller dimension for the scan box
          const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,          // square aspect ratio prevents split-image bug
        disableFlip: false,        // allow mirrored cameras
      },
      (text) => {
        // Stop scanning after first successful read
        if (!scannedRef.current) {
          scannedRef.current = true;
          stopScanner();
          onScanRef.current(text);
        }
      },
      () => {},
    ).catch(() => {});

    return () => { stopScanner(); };
  }, [active, stopScanner]);

  return (
    <div
      id="signet-qr-scanner"
      style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    />
  );
}
