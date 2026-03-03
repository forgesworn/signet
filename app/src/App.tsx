import { useState, useCallback } from 'react';
import { useIdentity } from './hooks/useIdentity';
import { usePreferences } from './hooks/usePreferences';
import { useConnections } from './hooks/useConnections';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Connections } from './pages/Connections';
import { ContactDetail } from './pages/ContactDetail';
import { Scan } from './pages/Scan';
import { Backup } from './pages/Backup';
import { Verifier } from './pages/Verifier';
import { Settings } from './pages/Settings';
import { saveIdentity, type StoredIdentity, type StoredConnection } from './lib/db';

export function App() {
  const { identity, loading: identityLoading, create, importMnemonic, deleteIdentity } = useIdentity();
  const { preferences, loading: prefsLoading, setTheme } = usePreferences();
  const { connections, loading: connsLoading, addConnection, removeConnection } = useConnections();

  const [activePage, setActivePage] = useState('home');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // ── Handlers ──

  const handleCreate = useCallback(async (role: StoredIdentity['role'], displayName: string) => {
    await create(role, displayName);
  }, [create]);

  const handleImport = useCallback(async (
    mnemonic: string,
    role: StoredIdentity['role'],
    displayName: string,
  ) => {
    await importMnemonic(mnemonic, role, displayName);
  }, [importMnemonic]);

  const handleConnect = useCallback(async (connection: StoredConnection) => {
    await addConnection(connection);
    setActivePage('connections');
  }, [addConnection]);

  const handleSelectContact = useCallback((pubkey: string) => {
    setSelectedContact(pubkey);
  }, []);

  const handleBackFromContact = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const handleRemoveConnection = useCallback(async (pubkey: string) => {
    await removeConnection(pubkey);
    setSelectedContact(null);
  }, [removeConnection]);

  const handleChangeRole = useCallback(async (role: StoredIdentity['role']) => {
    if (!identity) return;
    const updated = { ...identity, role };
    await saveIdentity(updated);
    // Force reload by navigating
    window.location.reload();
  }, [identity]);

  const handleDeleteIdentity = useCallback(async () => {
    await deleteIdentity();
  }, [deleteIdentity]);

  const handleNavigate = useCallback((page: string) => {
    setSelectedContact(null);
    setActivePage(page);
  }, []);

  // ── Loading ──

  const loading = identityLoading || prefsLoading || connsLoading;

  if (loading) {
    return (
      <div
        className="app"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Onboarding ──

  if (!identity) {
    return <Onboarding onCreate={handleCreate} onImport={handleImport} />;
  }

  // ── Contact Detail (sub-page of Connections) ──

  if (activePage === 'connections' && selectedContact) {
    const connection = connections.find(c => c.pubkey === selectedContact);
    if (connection) {
      return (
        <Layout activePage={activePage} onNavigate={handleNavigate} role={identity.role}>
          <ContactDetail
            connection={connection}
            onBack={handleBackFromContact}
            onRemove={handleRemoveConnection}
          />
        </Layout>
      );
    }
  }

  // ── Page Content ──

  function renderPage() {
    switch (activePage) {
      case 'home':
        return <Home identity={identity!} />;
      case 'connections':
        return (
          <Connections
            connections={connections}
            onSelectContact={handleSelectContact}
          />
        );
      case 'scan':
        return (
          <Scan
            identity={identity!}
            onConnect={handleConnect}
          />
        );
      case 'backup':
        return <Backup identity={identity!} onBack={() => handleNavigate('settings')} />;
      case 'verify':
        return <Verifier identity={identity!} />;
      case 'settings':
        return (
          <Settings
            identity={identity!}
            preferences={preferences}
            connections={connections}
            onSetTheme={setTheme}
            onChangeRole={handleChangeRole}
            onDeleteIdentity={handleDeleteIdentity}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <Home identity={identity!} />;
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate} role={identity.role}>
      {renderPage()}
    </Layout>
  );
}
