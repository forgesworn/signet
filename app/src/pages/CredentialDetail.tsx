import type { StoredCredential } from '../types';

interface Props {
  credential: StoredCredential;
  onBack?: () => void;
}

function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-6)}`;
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function CredentialDetail({ credential, onBack }: Props) {
  const isConfirmed = credential.verifierStatus === 'confirmed';

  return (
    <div className="fade-in" role="main">
      {/* Verification status badge */}
      <div className="section" style={{ textAlign: 'center', paddingTop: 24 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 24,
            background: isConfirmed ? 'var(--success-light, #e8f5e9)' : 'var(--warning-light, #fff8e1)',
            border: `1px solid ${isConfirmed ? 'var(--success, #43a047)' : 'var(--warning, #f9a825)'}`,
            color: isConfirmed ? 'var(--success, #2e7d32)' : 'var(--warning, #e65100)',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {isConfirmed ? '✓ Verified' : '⏳ Pending'}
        </div>
      </div>

      {/* Credential details */}
      <div className="card section">
        <div className="section-title">Credential Details</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Keypair type
            </div>
            <div style={{ fontWeight: 600 }}>
              {credential.keypairType === 'natural-person' ? 'Natural Person' : 'Persona'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Verifier
            </div>
            <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {truncatePubkey(credential.verifierPubkey)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Issued
            </div>
            <div style={{ fontWeight: 600 }}>
              {formatDate(credential.verifiedAt)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Status
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: isConfirmed ? 'var(--success-light, #e8f5e9)' : 'var(--warning-light, #fff8e1)',
                color: isConfirmed ? 'var(--success, #2e7d32)' : 'var(--warning, #e65100)',
              }}
            >
              {isConfirmed ? 'Confirmed' : 'Pending verification'}
            </div>
          </div>
        </div>
      </div>

      {/* Credential ID */}
      <div className="card section">
        <div className="section-title">Credential ID</div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            wordBreak: 'break-all',
          }}
        >
          {credential.id}
        </div>
      </div>

      {!isConfirmed && (
        <div
          className="card section"
          style={{
            background: 'var(--warning-light, #fff8e1)',
            borderColor: 'var(--warning, #f9a825)',
          }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
            Your credential is waiting for the verifier to publish their confirmation event to the
            Nostr network. This typically completes within a few minutes.
          </p>
        </div>
      )}

      {onBack && (
        <div className="section">
          <button
            className="btn btn-secondary"
            onClick={onBack}
            aria-label="Go back"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
