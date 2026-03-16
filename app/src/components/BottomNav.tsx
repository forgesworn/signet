import type { Page } from '../types';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNav({ activePage, onNavigate }: Props) {
  const isActive = (page: Page) => activePage === page;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <NavTab label="My Signet" active={isActive('home')} onClick={() => onNavigate('home')} />
      <AddButton active={isActive('add')} onClick={() => onNavigate('add')} />
      <NavTab label="My Family" active={isActive('family')} onClick={() => onNavigate('family')} />
    </nav>
  );
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: '0.75rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        transition: 'color 200ms ease',
      }}
    >
      {active && <span style={{
        width: 4, height: 4, borderRadius: '50%',
        background: 'var(--accent)', marginBottom: 2,
      }} />}
      <span>{label}</span>
    </button>
  );
}

function AddButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: active ? 'var(--accent-hover)' : 'var(--accent)',
        color: '#FFFFFF',
        border: 'none',
        fontSize: '1.5rem',
        fontWeight: 300,
        cursor: 'pointer',
        marginTop: -20,
        boxShadow: 'var(--shadow-lg)',
        transition: 'background 200ms ease, transform 100ms ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      +
    </button>
  );
}
