interface ThemeToggleProps {
  current: 'system' | 'light' | 'dark';
  onChange: (theme: 'system' | 'light' | 'dark') => void;
}

const options: { value: ThemeToggleProps['current']; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle({ current, onChange }: ThemeToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderRadius: 999,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg-input)',
      }}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map((opt) => {
        const isActive = current === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={isActive}
            style={{
              flex: 1,
              height: 44,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--accent)' : 'var(--bg-input)',
              color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
              transition: 'background 0.15s, color 0.15s',
              WebkitTapHighlightColor: 'transparent',
              padding: '0 16px',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
