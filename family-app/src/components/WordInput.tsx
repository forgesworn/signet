import { useState } from 'react';

interface Props {
  onSubmit: (words: string[]) => void;
}

export function WordInput({ onSubmit }: Props) {
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [w3, setW3] = useState('');

  const handleSubmit = () => {
    if (w1.trim() && w2.trim() && w3.trim()) {
      onSubmit([w1.trim().toLowerCase(), w2.trim().toLowerCase(), w3.trim().toLowerCase()]);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input className="input" placeholder="Word 1" value={w1} onChange={e => setW1(e.target.value)} autoFocus />
        <input className="input" placeholder="Word 2" value={w2} onChange={e => setW2(e.target.value)} />
        <input className="input" placeholder="Word 3" value={w3} onChange={e => setW3(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={!w1.trim() || !w2.trim() || !w3.trim()}>
        Check
      </button>
    </div>
  );
}
