import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  active: boolean;
}

const SCANNER_ELEMENT_ID = 'signet-qr-scanner';

export function QRScanner({ onScan, active }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const onScanRef = useRef(onScan);

  // Keep onScan ref up to date without triggering effect re-runs
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors — scanner may already be stopped
      }
      isRunningRef.current = false;
    }
  }, []);

  const startScanner = useCallback(async () => {
    // Ensure the DOM element exists
    const el = document.getElementById(SCANNER_ELEMENT_ID);
    if (!el) return;

    // Stop any existing scanner first
    await stopScanner();

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScanRef.current(decodedText);
        },
        () => {
          // QR scan errors are expected when no code is in view — ignore
        },
      );

      isRunningRef.current = true;
    } catch {
      // Camera start failed — handled by parent via useCamera hook
      isRunningRef.current = false;
    }
  }, [stopScanner]);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [active, startScanner, stopScanner]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (isRunningRef.current) {
          scannerRef.current.stop().catch(() => {});
          isRunningRef.current = false;
        }
        try {
          scannerRef.current.clear();
        } catch {
          // Ignore clear errors
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000',
        borderRadius: 'var(--radius)',
      }}
    >
      <div
        id={SCANNER_ELEMENT_ID}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
