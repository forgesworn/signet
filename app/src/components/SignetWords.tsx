import { useState } from 'react';
import { useSignetMe } from '../hooks/useSignetMe';
import { verifySignetMe } from '../lib/signet-me';
import { WordInput } from './WordInput';

interface Props {
  sharedSecret: string;
  myPubkey: string;
  theirPubkey: string;
  /** Number of words per side (1 = Basic, 2 = Standard, 3 = Expert) */
  wordCount?: number;
}

export function SignetWords({ sharedSecret, myPubkey, theirPubkey, wordCount = 1 }: Props) {
  const { myWords, theirWords, expiresIn } = useSignetMe(sharedSecret, myPubkey, theirPubkey, wordCount);
  const [mode, setMode] = useState<'display' | 'verify'>('display');
  const [result, setResult] = useState<'match' | 'no-match' | null>(null);

  const handleVerify = (inputWords: string[]) => {
    const matched = verifySignetMe(sharedSecret, myPubkey, theirPubkey, inputWords, wordCount);
    setResult(matched ? 'match' : 'no-match');
    if (matched) {
      setTimeout(() => { setResult(null); setMode('display'); }, 2000);
    }
  };

  if (mode === 'verify') {
    return (
      <div className="card section">
        <h3 style={{ marginBottom: 8 }}>What did they say?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          Enter the {wordCount === 1 ? 'word' : `${wordCount} words`} they said to you:
        </p>
        {result === 'no-match' && (
          <div style={{ padding: 8, background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12, color: 'var(--danger)', fontSize: '0.9rem' }}>
            Doesn't match. This might not be who they claim to be.
          </div>
        )}
        <WordInput onSubmit={handleVerify} wordCount={wordCount} />
        <button className="btn btn-ghost" onClick={() => { setMode('display'); setResult(null); }} style={{ marginTop: 8 }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="card section">
      <h3 style={{ marginBottom: 12 }}>Signet Me</h3>

      {result === 'match' && (
        <div className="checkmark-anim" style={{ padding: 8, background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12, color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>
          Confirmed — it's really them.
        </div>
      )}

      {/* What I say */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          You say
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} aria-live="polite" aria-label="Your Signet words">
          {myWords.map((word, i) => (
            <span key={i} className="signet-word">{word}</span>
          ))}
        </div>
      </div>

      {/* What they say */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          They say
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} aria-live="polite" aria-label="Their Signet words">
          {theirWords.map((word, i) => (
            <span key={i} className="signet-word" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>{word}</span>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        Refreshes in {expiresIn}s
      </div>

      <button className="btn btn-secondary" onClick={() => setMode('verify')}>
        Verify what they said
      </button>
    </div>
  );
}
