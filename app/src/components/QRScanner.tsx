import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  active: boolean;
}

export function QRScanner({ onScan, active }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
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

    // Use a unique ID per mount to avoid html5-qrcode reuse issues
    const elementId = 'signet-qr-scanner';
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;
    scannedRef.current = false;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 5,
        qrbox: 200,
      },
      (text) => {
        if (!scannedRef.current) {
          scannedRef.current = true;
          stopScanner();
          onScanRef.current(text);
        }
      },
      () => {},
    ).catch(() => {});

    // Let html5-qrcode manage the video element — don't override sizing

    return () => { stopScanner(); };
  }, [active, stopScanner]);

  return (
    <div
      ref={containerRef}
      id="signet-qr-scanner"
      style={{
        width: '100%',
        margin: '0 auto',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    />
  );
}
