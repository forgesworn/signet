import { useState } from 'react';
import { useSignetWords } from '../hooks/useSignetWords';
import { verifySignetWords } from '../lib/signet';
import { WordInput } from './WordInput';

interface Props {
  sharedSecret: string;
}

export function SignetWords({ sharedSecret }: Props) {
  const { words, expiresIn } = useSignetWords(sharedSecret);
  const [mode, setMode] = useState<'display' | 'verify'>('display');
  const [result, setResult] = useState<'match' | 'no-match' | null>(null);

  const handleVerify = (inputWords: string[]) => {
    const matched = verifySignetWords(sharedSecret, inputWords);
    setResult(matched ? 'match' : 'no-match');
    if (matched) {
      setTimeout(() => { setResult(null); setMode('display'); }, 2000);
    }
  };

  if (mode === 'verify') {
    return (
      <div className="card section">
        <h3 style={{ marginBottom: 8 }}>Verify their words</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          Enter the 3 words they read to you:
        </p>
        {result === 'no-match' && (
          <div style={{ padding: 8, background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12, color: 'var(--danger)', fontSize: '0.9rem' }}>
            Words don't match. This might not be who they claim to be.
          </div>
        )}
        <WordInput onSubmit={handleVerify} />
        <button className="btn btn-ghost" onClick={() => { setMode('display'); setResult(null); }} style={{ marginTop: 8 }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="card section">
      <h3 style={{ marginBottom: 4 }}>Signet Me</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
        Ask them to read these words aloud:
      </p>
      {result === 'match' && (
        <div className="checkmark-anim" style={{ padding: 8, background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12, color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>
          Confirmed — it's really them.
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        {words.map((word, i) => (
          <span key={i} className="signet-word">{word}</span>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        Words refresh in {expiresIn}s
      </div>
      <button className="btn btn-secondary" onClick={() => setMode('verify')}>
        Verify words read to me
      </button>
    </div>
  );
}
