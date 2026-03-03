import { useState, useCallback } from 'react';
import { useSignetWords } from '../hooks/useSignetWords';
import { verifySignetWords } from '../lib/signet';
import { ProgressBar } from './ProgressBar';

const SIGNET_EPOCH_SECONDS = 30;

interface SignetWordsProps {
  sharedSecret: string;
}

export function SignetWords({ sharedSecret }: SignetWordsProps) {
  const { formatted, expiresIn } = useSignetWords(sharedSecret);
  const [mode, setMode] = useState<'display' | 'verify'>('display');
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [word3, setWord3] = useState('');
  const [result, setResult] = useState<'match' | 'no-match' | null>(null);

  const handleVerify = useCallback(() => {
    const words = [word1.trim().toLowerCase(), word2.trim().toLowerCase(), word3.trim().toLowerCase()];
    const ok = verifySignetWords(sharedSecret, words);
    setResult(ok ? 'match' : 'no-match');
  }, [sharedSecret, word1, word2, word3]);

  const handleCancel = useCallback(() => {
    setMode('display');
    setWord1('');
    setWord2('');
    setWord3('');
    setResult(null);
  }, []);

  const handleStartVerify = useCallback(() => {
    setMode('verify');
    setResult(null);
    setWord1('');
    setWord2('');
    setWord3('');
  }, []);

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: '10px 12px',
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'center',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    outline: 'none',
    minHeight: 44,
  };

  // Display mode
  if (mode === 'display') {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: 24,
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Signet words */}
        <div
          key={formatted}
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--signet-word)',
            textAlign: 'center',
            padding: '16px 0',
            letterSpacing: 0.3,
            lineHeight: 1.4,
            animation: 'signetFadeIn 0.3s ease-out',
          }}
        >
          {formatted || '\u00b7 \u00b7 \u00b7'}
        </div>

        {/* Progress bar */}
        <div style={{ margin: '12px 0 16px' }}>
          <ProgressBar expiresIn={expiresIn} total={SIGNET_EPOCH_SECONDS} />
        </div>

        {/* Verify button */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleStartVerify}
        >
          Verify words read to me
        </button>

        {/* Inline keyframe for fade-in animation */}
        <style>{`
          @keyframes signetFadeIn {
            from { opacity: 0.4; transform: scale(0.97); }
            to   { opacity: 1;   transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // Verify mode
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: 24,
        boxShadow: 'var(--shadow)',
      }}
    >
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Enter the 3 words read to you
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          style={inputStyle}
          type="text"
          placeholder="Word 1"
          value={word1}
          onChange={(e) => { setWord1(e.target.value); setResult(null); }}
          autoCapitalize="none"
          autoCorrect="off"
          autoFocus
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="Word 2"
          value={word2}
          onChange={(e) => { setWord2(e.target.value); setResult(null); }}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="Word 3"
          value={word3}
          onChange={(e) => { setWord3(e.target.value); setResult(null); }}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      {/* Result feedback */}
      {result !== null && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: 12,
            fontSize: 16,
            fontWeight: 600,
            color: result === 'match' ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {result === 'match' ? '\u2713 Words match — identity verified!' : '\u2717 Words do not match'}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!word1.trim() || !word2.trim() || !word3.trim()}
          onClick={handleVerify}
        >
          Check
        </button>
      </div>
    </div>
  );
}
