import { useState, useCallback } from 'react';
import type { SignetIdentity } from '../types';
import { splitSecret, shareToWords, mnemonicToEntropy, BIP39_WORDLIST } from '../lib/signet';

interface Props {
  identity: SignetIdentity;
  onBack?: () => void;
}

// Split the mnemonic into 3 Shamir shares (threshold 2-of-3).
// Converts the mnemonic to entropy bytes first, then uses the
// real GF(256) Shamir implementation and BIP-39 word encoding.
function splitMnemonic(mnemonic: string): string[][] {
  const entropy = mnemonicToEntropy(mnemonic, BIP39_WORDLIST);
  const shares = splitSecret(entropy, 2, 3);
  return shares.map((share) => shareToWords(share));
}

// Renders a numbered word grid matching the Settings "Backup Words" style
function WordGrid({ words }: { words: string[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 12,
      }}
    >
      {words.map((word, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              minWidth: 18,
            }}
          >
            {i + 1}.
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--signet-word, var(--text-primary))',
              fontFamily: 'monospace',
            }}
          >
            {word}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ShamirBackup({ identity, onBack }: Props) {
  const [shares, setShares] = useState<string[][] | null>(null);
  const [expandedShare, setExpandedShare] = useState<number | null>(null);

  const isBackedUp = identity.backedUp === true;

  const handleSplit = useCallback(() => {
    const result = splitMnemonic(identity.mnemonic);
    setShares(result);
    setExpandedShare(0);
  }, [identity.mnemonic]);

  const toggleShare = useCallback((index: number) => {
    setExpandedShare((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className="fade-in" role="main">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              color: 'var(--accent)',
              cursor: 'pointer',
              padding: '8px 12px 8px 0',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Back"
          >
            &#8592;
          </button>
        )}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Shamir Backup
        </h1>
      </div>

      {/* Backup status */}
      <div className="card section">
        <div className="section-title">Backup Status</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0 4px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isBackedUp ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: isBackedUp ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)',
            }}
          >
            {isBackedUp ? 'Backed up' : 'Not yet backed up'}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="card section">
        <div className="section-title">What is Shamir Backup?</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 0 }}>
          Split your backup words between people you trust. Any 2 of 3 shares
          can recover your account — no single person holds enough to access it
          on their own.
        </p>
      </div>

      {/* Split button (before generating) */}
      {!shares && (
        <div className="section">
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSplit}>
            Split my backup
          </button>
        </div>
      )}

      {/* Generated shares */}
      {shares && (
        <>
          <div className="card section">
            <div className="section-title">Your 3 Shares</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
              Give Share 1 to one person, Share 2 to another, keep Share 3 yourself.
              Store each share separately — never keep all three in the same place.
            </p>

            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--warning, #f59e0b)',
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              Write these down now. They cannot be shown again without re-splitting.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shares.map((shareWords, i) => {
                const isExpanded = expandedShare === i;
                const labels = [
                  'Give to Person A',
                  'Give to Person B',
                  'Keep yourself',
                ];
                return (
                  <div
                    key={i}
                    className="card"
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
                    {/* Collapsible header */}
                    <button
                      onClick={() => toggleShare(i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        minHeight: 44,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'block',
                          }}
                        >
                          Share {i + 1} of 3
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {labels[i]}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 18,
                          color: 'var(--text-muted)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          display: 'inline-block',
                        }}
                      >
                        &#9660;
                      </span>
                    </button>

                    {/* Share words — collapsible body */}
                    {isExpanded && (
                      <div style={{ padding: '0 18px 18px 18px' }}>
                        <WordGrid words={shareWords} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Re-split option */}
          <div className="section">
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => {
                setShares(null);
                setExpandedShare(null);
              }}
            >
              Start over
            </button>
          </div>
        </>
      )}
    </div>
  );
}
