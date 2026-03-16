interface ProgressBarProps {
  expiresIn: number;  // seconds remaining
  total: number;      // total seconds (e.g. 30)
}

export function ProgressBar({ expiresIn, total }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (expiresIn / total) * 100));
  const seconds = Math.ceil(expiresIn);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
      }}
    >
      {/* Track */}
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'var(--bg-input)',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 3,
            background: 'var(--signet-word)',
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Countdown text */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          minWidth: 28,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {seconds}s
      </span>
    </div>
  );
}
