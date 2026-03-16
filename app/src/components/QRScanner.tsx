import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  active: boolean;
}

export function QRScanner({ onScan, active }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
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
    if (!active) { stopScanner(); return; }

    const scanner = new Html5Qrcode('signet-qr-scanner');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => { onScanRef.current(text); },
      () => {},
    ).catch(() => {});

    return () => { stopScanner(); };
  }, [active, stopScanner]);

  return <div id="signet-qr-scanner" style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }} />;
}
