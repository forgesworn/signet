interface BreakdownItem {
  label: string;
  points: number;
}

interface SignetIQProps {
  score: number;
  breakdown?: BreakdownItem[];
}

function getScoreColor(score: number): string {
  if (score < 50) return 'var(--danger, #ef4444)';
  if (score < 100) return 'var(--warning, #f59e0b)';
  return 'var(--accent)';
}

export function SignetIQ({ score, breakdown }: SignetIQProps) {
  const clamped = Math.max(0, Math.min(200, score));
  const barColor = getScoreColor(clamped);
  const pct = Math.round((clamped / 200) * 100);

  return (
    <div className="card section">
      <div className="section-title">Signet IQ</div>

      {/* Large score number */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: barColor,
          lineHeight: 1,
          marginBottom: 10,
        }}
      >
        {clamped}
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginLeft: 4,
          }}
        >
          / 200
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'var(--bg-input)',
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 4,
            background: barColor,
            transition: 'width 0.4s ease, background 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: breakdown && breakdown.length > 0 ? 16 : 0,
        }}
      >
        Trust score based on verification signals
      </div>

      {/* Optional breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {breakdown.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: item.points > 0 ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {item.points > 0 ? `+${item.points}` : item.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
