import { useState } from 'react';

interface Props {
  onSubmit: (words: string[]) => void;
  wordCount?: number;
}

export function WordInput({ onSubmit, wordCount = 1 }: Props) {
  const [words, setWords] = useState<string[]>(Array(wordCount).fill(''));

  const setWord = (index: number, value: string) => {
    const next = [...words];
    next[index] = value;
    setWords(next);
  };

  const allFilled = words.every(w => w.trim());

  const handleSubmit = () => {
    if (allFilled) {
      onSubmit(words.map(w => w.trim().toLowerCase()));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {words.map((w, i) => (
          <input
            key={i}
            className="input"
            placeholder={wordCount === 1 ? 'Their word' : `Word ${i + 1}`}
            value={w}
            onChange={e => setWord(i, e.target.value)}
            onKeyDown={e => e.key === 'Enter' && allFilled && handleSubmit()}
            autoFocus={i === 0}
          />
        ))}
      </div>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={!allFilled}>
        Check
      </button>
    </div>
  );
}
