import { useState, useEffect } from 'react';
import { getSignetMeDisplay, type SignetMeDisplay } from '../lib/signet-me';

export function useSignetMe(
  sharedSecret: string | null,
  myPubkey: string | null,
  theirPubkey: string | null,
  wordCount: number = 1,
) {
  const [display, setDisplay] = useState<SignetMeDisplay>({
    myWords: [], theirWords: [], expiresIn: 0,
  });

  useEffect(() => {
    if (!sharedSecret || !myPubkey || !theirPubkey) return;
    const update = () => {
      setDisplay(getSignetMeDisplay(sharedSecret, myPubkey, theirPubkey, wordCount));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sharedSecret, myPubkey, theirPubkey, wordCount]);

  return display;
}
