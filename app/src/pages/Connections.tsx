import { useState, useMemo } from 'react';
import type { StoredConnection } from '../lib/db';

interface ConnectionsProps {
  connections: StoredConnection[];
  onSelectContact: (pubkey: string) => void;
}

function timeAgo(timestampSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSeconds;

  if (diff < 60) return 'just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(diff / 86400);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}

export function Connections({ connections, onSelectContact }: ConnectionsProps) {
  const [filter, setFilter] = useState('');

  const sorted = useMemo(() => {
    const filtered = connections.filter((c) => {
      if (!filter.trim()) return true;
      const term = filter.trim().toLowerCase();
      const name = c.theirInfo.name?.toLowerCase() ?? '';
      return name.includes(term) || c.pubkey.toLowerCase().includes(term);
    });
    return [...filtered].sort((a, b) => b.connectedAt - a.connectedAt);
  }, [connections, filter]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 12,
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        Connections
      </h1>

      {/* Search input */}
      <input
        className="input"
        type="text"
        placeholder="Search by name..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: 4 }}
      />

      {/* Empty state */}
      {sorted.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--text-muted)',
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {connections.length === 0
            ? 'No connections yet. Scan a QR code to connect.'
            : 'No connections match your search.'}
        </div>
      )}

      {/* Connection cards */}
      {sorted.map((conn) => {
        const displayName = conn.theirInfo.name || truncatePubkey(conn.pubkey);

        return (
          <button
            key={conn.pubkey}
            onClick={() => onSelectContact(conn.pubkey)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: 'var(--shadow)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Avatar placeholder */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(conn.theirInfo.name?.[0] ?? conn.pubkey[0]).toUpperCase()}
            </div>

            {/* Name & time */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                Connected {timeAgo(conn.connectedAt)}
              </div>
            </div>

            {/* Chevron */}
            <span
              style={{
                fontSize: 18,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              &#8250;
            </span>
          </button>
        );
      })}
    </div>
  );
}
