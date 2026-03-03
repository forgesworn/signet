import { useState, useCallback } from 'react';

interface UseCameraResult {
  hasPermission: boolean | null;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useCamera(): UseCameraResult {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera is not supported on this device');
      setHasPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      // Stop the stream immediately — the QR scanner library manages its own stream
      for (const track of stream.getTracks()) {
        track.stop();
      }

      setHasPermission(true);
    } catch (err) {
      setHasPermission(false);

      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setError('Camera permission was denied. Please allow camera access in your browser settings.');
            break;
          case 'NotFoundError':
            setError('No camera found on this device.');
            break;
          case 'NotReadableError':
            setError('Camera is already in use by another application.');
            break;
          case 'OverconstrainedError':
            setError('No suitable camera found. Try a different device.');
            break;
          default:
            setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access camera.');
      }
    }
  }, []);

  return { hasPermission, error, requestPermission };
}
