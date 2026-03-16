import type { ReactNode } from 'react';
import type { Page } from '../types';
import { BottomNav } from './BottomNav';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onSettingsOpen: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function Layout({ activePage, onNavigate, onSettingsOpen, title, showBack, onBack, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showBack && (
            <button onClick={onBack} style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: '1rem', cursor: 'pointer', padding: '4px 8px',
            }}>
              &larr;
            </button>
          )}
          <h2 style={{ margin: 0 }}>{title || 'My Signet'}</h2>
        </div>
        {!showBack && (
          <button onClick={onSettingsOpen} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontSize: '1.25rem', cursor: 'pointer', padding: '4px 8px',
          }}>
            &#9881;
          </button>
        )}
      </header>
      <main className="page" style={{ flex: 1 }}>
        {children}
      </main>
      {!showBack && <BottomNav activePage={activePage} onNavigate={onNavigate} />}
    </div>
  );
}
