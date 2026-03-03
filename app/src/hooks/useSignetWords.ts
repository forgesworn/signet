import { useState, useEffect } from 'react';
import { getSignetDisplay } from 'signet-protocol';

interface SignetWordsState {
  words: string[];
  formatted: string;
  expiresIn: number;
}

export function useSignetWords(sharedSecret: string | null) {
  const [state, setState] = useState<SignetWordsState>({
    words: [],
    formatted: '',
    expiresIn: 0,
  });

  useEffect(() => {
    if (!sharedSecret) return;

    function update() {
      const display = getSignetDisplay(sharedSecret!);
      setState({
        words: display.words,
        formatted: display.formatted,
        expiresIn: display.expiresIn,
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sharedSecret]);

  return state;
}
