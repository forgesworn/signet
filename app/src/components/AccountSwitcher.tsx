import { useState } from 'react';
import type { SignetIdentity } from '../types';

interface AccountSwitcherProps {
  identity: SignetIdentity;
  onSwitchPrimary: (keypair: 'natural-person' | 'persona') => void;
}

function truncatePubkey(pubkey: string, start = 8, end = 6): string {
  if (pubkey.length <= start + end + 3) return pubkey;
  return `${pubkey.slice(0, start)}...${pubkey.slice(-end)}`;
}

interface AccountOption {
  key: 'natural-person' | 'persona';
  label: string;
  pubkey: string;
}

export function AccountSwitcher({ identity, onSwitchPrimary }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);

  const accounts: AccountOption[] = [
    {
      key: 'natural-person',
      label: identity.naturalPerson.displayName || 'Natural Person',
      pubkey: identity.naturalPerson.publicKey,
    },
    {
      key: 'persona',
      label: identity.persona.displayName || 'Anonymous Persona',
      pubkey: identity.persona.publicKey,
    },
  ];

  const active = accounts.find((a) => a.key === identity.primaryKeypair) ?? accounts[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          minHeight: 36,
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-expanded={open}
        aria-label="Switch active keypair"
      >
        {/* Avatar initial */}
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {active.label.charAt(0).toUpperCase()}
        </span>

        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {active.label}
        </span>

        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          &#9660;
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            minWidth: 240,
            marginTop: 4,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {accounts.map((account) => {
            const isActive = account.key === identity.primaryKeypair;
            return (
              <button
                key={account.key}
                onClick={() => {
                  onSwitchPrimary(account.key);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: isActive ? 'var(--bg-input)' : 'transparent',
                  cursor: 'pointer',
                  minHeight: 44,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Avatar */}
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: isActive ? 'var(--accent)' : 'var(--border)',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {account.label.charAt(0).toUpperCase()}
                </span>

                {/* Name + pubkey */}
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {account.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {truncatePubkey(account.pubkey)}
                  </div>
                </div>

                {/* Active tick */}
                {isActive && (
                  <span style={{ fontSize: 14, color: 'var(--accent)' }}>&#10003;</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
