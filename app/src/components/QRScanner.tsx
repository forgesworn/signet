import { useEffect, useRef, useCallback, useState } from 'react';
import jsQR from 'jsqr';

interface Props {
  onScan: (data: string) => void;
  active: boolean;
}

/**
 * QR Scanner using native getUserMedia + jsQR decoder.
 * No html5-qrcode for camera — just the browser's video element
 * and jsQR for frame-by-frame decoding. No rendering bugs.
 */
export function QRScanner({ onScan, active }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  onScanRef.current = onScan;

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!active) { stopCamera(); scannedRef.current = false; setError(null); return; }

    let mounted = true;
    scannedRef.current = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        scanFrame();
      } catch {
        if (mounted) setError('Could not access camera. Check permissions.');
      }
    }

    function scanFrame() {
      if (!mounted || scannedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        timerRef.current = setTimeout(scanFrame, 250);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        timerRef.current = setTimeout(scanFrame, 250);
        return;
      }

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);

      if (result && result.data && !scannedRef.current) {
        scannedRef.current = true;
        stopCamera();
        onScanRef.current(result.data);
        return;
      }

      // Scan ~4 times per second
      timerRef.current = setTimeout(scanFrame, 250);
    }

    start();
    return () => { mounted = false; stopCamera(); };
  }, [active, stopCamera]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden' }}>
      {error && (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--danger)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        style={{ width: '100%', display: 'block' }}
        playsInline
        muted
      />
      {active && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 200,
          height: 200,
          border: '2px solid rgba(255,255,255,0.7)',
          borderRadius: 12,
          pointerEvents: 'none',
        }} />
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
