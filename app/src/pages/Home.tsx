import type { FamilyIdentity, FamilyMember } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { encodeNpub } from '../lib/signet';
import { useState } from 'react';

interface Props {
  identity: FamilyIdentity;
  members: FamilyMember[];
  onSelectMember: (pubkey: string) => void;
  onNavigateAdd: () => void;
}

export function Home({ identity, members, onSelectMember, onNavigateAdd }: Props) {
  const [copied, setCopied] = useState(false);
  const npub = encodeNpub(identity.publicKey);
  const shortNpub = npub.slice(0, 12) + '...' + npub.slice(-8);

  const copyPubkey = () => {
    navigator.clipboard?.writeText(identity.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fade-in">
      {/* Greeting */}
      <div className="section" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>{identity.displayName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge isVerified={members.length > 0} isChild={identity.isChild} />
          {identity.isChild && identity.guardianPubkey && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Linked to parent
            </span>
          )}
        </div>
      </div>

      {/* Family Members — the heart of the app */}
      {members.length > 0 ? (
        <div className="section">
          <div className="section-title">My Family</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {members.map((member, i) => (
              <button
                key={member.pubkey}
                onClick={() => onSelectMember(member.pubkey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{member.displayName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Tap to verify
                  </div>
                </div>
                <StatusBadge isVerified={true} isChild={member.isChild} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card section" style={{ textAlign: 'center', padding: 32 }}>
          <h2 style={{ marginBottom: 8 }}>Add your first family member</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Once connected, you can verify it's really them — not a deepfake — with Signet Me.
          </p>
          <button className="btn btn-primary" onClick={onNavigateAdd}>
            Add someone
          </button>
        </div>
      )}

      {/* Signet ID — small, at bottom */}
      <div className="card section">
        <div className="section-title">Your Signet ID</div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', marginBottom: 8, color: 'var(--text-secondary)' }}>
          {shortNpub}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={copyPubkey} style={{ flex: 1 }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="btn btn-secondary" onClick={() => {
            navigator.share?.({ title: 'My Signet', text: identity.publicKey });
          }} style={{ flex: 1 }}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
