import { useState, useEffect } from 'react';
import { getSignetDisplay } from '../lib/signet';

export function useSignetWords(sharedSecret: string | null) {
  const [display, setDisplay] = useState<{ words: string[]; formatted: string; expiresIn: number }>({
    words: [], formatted: '', expiresIn: 0,
  });

  useEffect(() => {
    if (!sharedSecret) return;
    const update = () => {
      const result = getSignetDisplay(sharedSecret);
      setDisplay(result);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sharedSecret]);

  return display;
}
