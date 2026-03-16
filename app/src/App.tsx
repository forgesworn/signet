import { useState, useCallback } from 'react';
import type { Page } from './types';
import type { StoredCredential } from './types';
import { useIdentity } from './hooks/useIdentity';
import { useFamily } from './hooks/useFamily';
import { usePreferences } from './hooks/usePreferences';
import { useDocuments } from './hooks/useDocuments';
import { useCredentials } from './hooks/useCredentials';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Family } from './pages/Family';
import { FamilyMemberDetail } from './pages/FamilyMember';
import { AddMember } from './pages/AddMember';
import { Settings } from './pages/Settings';
import { ChildSettingsPage } from './pages/ChildSettings';
import { GetVerified } from './pages/GetVerified';
import { MyDocuments } from './pages/MyDocuments';
import { VerifySomeone } from './pages/VerifySomeone';
import { ShamirBackup } from './pages/ShamirBackup';
import { IdentityBridge } from './pages/IdentityBridge';
import { CredentialDetail } from './pages/CredentialDetail';
import { getActivePubkey } from './lib/signet';
// getActiveDisplayName, getActivePrivateKey used by child components via props

export function App() {
  const { identity, identities, loading: identityLoading, create, restore, importNsec, remove, markBackedUp, switchPrimary } = useIdentity();
  const { members, addMember, removeMember } = useFamily(identity?.id);
  const { preferences, loading: prefsLoading, setTheme, securityTier, wordCount, setSecurityTier } = usePreferences();
  const activePubkey = identity ? getActivePubkey(identity) : undefined;
  const { documents } = useDocuments(activePubkey);
  const { credentials } = useCredentials();

  const [page, setPage] = useState<Page>('home');
  const [selectedMemberPubkey, setSelectedMemberPubkey] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<StoredCredential | null>(null);
  const [powerMode, setPowerMode] = useState(false);

  const handleCreate = useCallback(async (displayName: string, primaryKeypair: 'natural-person' | 'persona', isChild: boolean, guardianPubkey?: string) => {
    await create(displayName, primaryKeypair, isChild, guardianPubkey);
  }, [create]);

  const handleImport = useCallback(async (mnemonic: string, displayName: string, primaryKeypair: 'natural-person' | 'persona', isChild: boolean, guardianPubkey?: string) => {
    await restore(mnemonic, displayName, primaryKeypair, isChild, guardianPubkey);
  }, [restore]);

  const handleMarkBackedUp = useCallback(async () => {
    await markBackedUp();
  }, [markBackedUp]);

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

  const handleImportNsec = useCallback(async (nsec: string, displayName: string, primaryKeypair: 'natural-person' | 'persona') => {
    await importNsec(nsec, displayName, primaryKeypair);
  }, [importNsec]);

  // Loading
  if (identityLoading || prefsLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  // No identity — show onboarding
  if (!identity) {
    return <Onboarding onCreate={handleCreate} onImport={handleImport} onImportNsec={handleImportNsec} />;
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
          securityTier={securityTier}
          onSetTheme={setTheme}
          onSetSecurityTier={setSecurityTier}
          onDeleteIdentity={remove}
          onOpenChildSettings={() => setPage('child-settings')}
          hasChildren={childIdentities.length > 0}
          powerMode={powerMode}
          onSetPowerMode={setPowerMode}
          onNavigateShamir={() => setPage('shamir')}
          onNavigateBridge={() => setPage('identity-bridge')}
          onSwitchPrimary={(kp) => switchPrimary(kp)}
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
        <FamilyMemberDetail member={member} identity={identity} onRemove={handleRemoveMember} wordCount={wordCount} />
      </Layout>
    );
  }

  // Add member
  if (page === 'add') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Add Family Member" showBack onBack={() => setPage('home')}>
        <AddMember identity={identity} onAddMember={addMember} onDone={handleAddDone} wordCount={wordCount} />
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

  // Get Verified
  if (page === 'get-verified') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Get Verified" showBack onBack={() => setPage('home')}>
        <GetVerified identity={identity} onMarkBackedUp={handleMarkBackedUp} />
      </Layout>
    );
  }

  // My Documents
  if (page === 'my-documents') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="My Documents" showBack onBack={() => setPage('home')}>
        <MyDocuments documents={documents} onAddDocument={() => setPage('add-document')} onSelectDocument={() => {}} />
      </Layout>
    );
  }

  // Verify Someone
  if (page === 'verify-someone') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Verify Someone" showBack onBack={() => setPage('home')}>
        <VerifySomeone identity={identity} />
      </Layout>
    );
  }

  // Shamir Backup
  if (page === 'shamir') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Shamir Backup" showBack onBack={() => setPage('settings')}>
        <ShamirBackup identity={identity} onBack={() => setPage('settings')} />
      </Layout>
    );
  }

  // Identity Bridge
  if (page === 'identity-bridge') {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Identity Bridge" showBack onBack={() => setPage('settings')}>
        <IdentityBridge identity={identity} onBack={() => setPage('settings')} />
      </Layout>
    );
  }

  // Credential Detail
  if (page === 'credential-detail' && selectedCredential) {
    return (
      <Layout activePage={page} onNavigate={setPage} onSettingsOpen={() => setPage('settings')} title="Credential" showBack onBack={() => { setSelectedCredential(null); setPage('home'); }}>
        <CredentialDetail credential={selectedCredential} onBack={() => { setSelectedCredential(null); setPage('home'); }} />
      </Layout>
    );
  }

  // Home (default) — shows family members front and centre
  return (
    <Layout activePage="home" onNavigate={setPage} onSettingsOpen={() => setPage('settings')}>
      <Home
        identity={identity}
        members={members}
        credentials={credentials}
        onSelectMember={handleSelectMember}
        onNavigateAdd={() => setPage('add')}
        onNavigateGetVerified={() => setPage('get-verified')}
        onNavigateDocuments={() => setPage('my-documents')}
        onSelectCredential={(cred) => { setSelectedCredential(cred); setPage('credential-detail'); }}
      />
    </Layout>
  );
}
