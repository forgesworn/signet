interface TierBadgeProps {
  tier: number; // 1-4
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const fontSize = sizeMap[size];
  const color = tier >= 3 ? 'var(--success)' : 'var(--text-muted)';

  if (tier <= 1) {
    return (
      <span
        style={{
          fontSize: fontSize - 2,
          color: 'var(--text-muted)',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}
        aria-label="Tier 1 - self-declared"
      >
        T1
      </span>
    );
  }

  const checks = tier - 1; // Tier 2 = 1 check, Tier 3 = 2, Tier 4 = 3

  return (
    <span
      style={{
        fontSize,
        color,
        fontWeight: 700,
        letterSpacing: -1,
        lineHeight: 1,
      }}
      aria-label={`Tier ${tier} - ${'✓'.repeat(checks)}`}
    >
      {'✓'.repeat(checks)}
    </span>
  );
}
