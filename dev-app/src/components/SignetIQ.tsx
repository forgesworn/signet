import type { TrustScoreBreakdown } from 'signet-protocol';

const TIER_LABELS = ['', 'Self-declared', 'Web-of-trust', 'Verified', 'Verified (Child Safety)'];

interface SignetIQProps {
  breakdown: TrustScoreBreakdown;
  showBreakdown?: boolean;
}

function getScoreColor(score: number): string {
  if (score < 50) return 'var(--danger)';
  if (score < 100) return 'var(--warning)';
  return 'var(--accent)';
}

function formatAge(days: number): string {
  if (days < 1) return 'New';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function SignetIQ({ breakdown, showBreakdown = false }: SignetIQProps) {
  const clampedScore = Math.max(0, Math.min(200, breakdown.score));
  const barColor = getScoreColor(clampedScore);
  const vouchCount = breakdown.inPersonVouches + breakdown.onlineVouches;

  return (
    <div style={{ width: '100%' }}>
      {/* Score bar row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Track */}
        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            background: 'var(--bg-input)',
            overflow: 'hidden',
          }}
        >
          {/* Fill */}
          <div
            style={{
              width: `${(clampedScore / 200) * 100}%`,
              height: '100%',
              borderRadius: 4,
              background: barColor,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        </div>

        {/* Score text */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: barColor,
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          {clampedScore}
        </span>
      </div>

      {/* Label */}
      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        Signet IQ
      </div>

      {/* Optional breakdown */}
      {showBreakdown && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Verification tier</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {TIER_LABELS[breakdown.tier] || `Tier ${breakdown.tier}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Vouches received</span>
            <span style={{ color: 'var(--text-muted)' }}>{vouchCount}</span>
          </div>
          {breakdown.accountAgeDays > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Account age</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {formatAge(breakdown.accountAgeDays)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
