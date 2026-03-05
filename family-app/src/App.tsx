import { useState, useCallback } from 'react';
import type { Page } from './types';
import { useIdentity } from './hooks/useIdentity';
import { useFamily } from './hooks/useFamily';
import { usePreferences } from './hooks/usePreferences';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Family } from './pages/Family';
import { FamilyMemberDetail } from './pages/FamilyMember';
import { AddMember } from './pages/AddMember';
import { Settings } from './pages/Settings';
import { ChildSettingsPage } from './pages/ChildSettings';

export function App() {
  const { identity, identities, loading: identityLoading, create, restore, remove } = useIdentity();
  const { members, addMember, removeMember } = useFamily(identity?.id);
  const { preferences, loading: prefsLoading, setTheme } = usePreferences();

  const [page, setPage] = useState<Page>('home');
  const [selectedMemberPubkey, setSelectedMemberPubkey] = useState<string | null>(null);

  const handleCreate = useCallback(async (displayName: string, isChild: boolean, guardianPubkey?: string) => {
    const created = await create(displayName, isChild, guardianPubkey);
    return { mnemonic: created.mnemonic };
  }, [create]);

  const handleImport = useCallback(async (mnemonic: string, displayName: string, isChild: boolean, guardianPubkey?: string) => {
    await restore(mnemonic, displayName, isChild, guardianPubkey);
  }, [restore]);

  const handleSelectMember = useCallback((pubkey: string) => {
    setSelectedMemberPubkey(pubkey);
    setPage('member-detail');
  }, []);

  const handleRemoveMember = useCallback(async (pubkey: string) => {
    await removeMember(pubkey);
    setPage('family');
    setSelectedMemberPubkey(null);
  }, [removeMember]);

  const handleAddDone = useCallback(() => {
    setPage('family');
  }, []);

  // Loading
  if (identityLoading || prefsLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  // No identity — show onboarding
  if (!identity) {
    return <Onboarding onCreate={handleCreate} onImport={handleImport} />;
  }

  // Child identities (for parent's child settings)
  const childIdentities = identities.filter(i => i.guardianPubkey === identity.id);

  // Settings page
  if (page === 'settings') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => {}} title="Settings" showBack onBack={() => setPage('home')}>
        <Settings
          identity={identity}
          preferences={preferences}
          onSetTheme={setTheme}
          onDeleteIdentity={remove}
          onOpenChildSettings={() => setPage('child-settings')}
          hasChildren={childIdentities.length > 0}
        />
      </Layout>
    );
  }

  // Child settings
  if (page === 'child-settings') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => {}} title="Child Accounts" showBack onBack={() => setPage('settings')}>
        <ChildSettingsPage identity={identity} childIdentities={childIdentities} />
      </Layout>
    );
  }

  // Member detail
  if (page === 'member-detail' && selectedMemberPubkey) {
    const member = members.find(m => m.pubkey === selectedMemberPubkey);
    if (!member) { setPage('family'); return null; }
    return (
      <Layout activePage="family" onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title={member.displayName} showBack onBack={() => setPage('family')}>
        <FamilyMemberDetail member={member} onRemove={handleRemoveMember} />
      </Layout>
    );
  }

  // Add member
  if (page === 'add') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Add Family Member" showBack onBack={() => setPage('home')}>
        <AddMember identity={identity} onAddMember={addMember} onDone={handleAddDone} />
      </Layout>
    );
  }

  // Family list
  if (page === 'family') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="My Family">
        <Family members={members} onSelectMember={handleSelectMember} />
      </Layout>
    );
  }

  // Home (default)
  return (
    <Layout activePage="home" onNavigate={setPage} onSettingsOpen={() => setPage('settings')}>
      <Home identity={identity} familyCount={members.length} />
    </Layout>
  );
}
