import { useState } from 'react';
import { validateMnemonic } from '../lib/signet';

interface Props {
  onCreate: (displayName: string, isChild: boolean, guardianPubkey?: string) => Promise<{ mnemonic: string }>;
  onImport: (mnemonic: string, displayName: string, isChild: boolean, guardianPubkey?: string) => Promise<void>;
}

type Flow = 'welcome' | 'create' | 'import';
type CreateStep = 'name' | 'child-check' | 'guardian' | 'recovery' | 'done';
type ImportStep = 'phrase' | 'name' | 'done';

export function Onboarding({ onCreate, onImport }: Props) {
  const [flow, setFlow] = useState<Flow>('welcome');
  const [createStep, setCreateStep] = useState<CreateStep>('name');
  const [importStep, setImportStep] = useState<ImportStep>('phrase');

  // Shared state
  const [displayName, setDisplayName] = useState('');
  const [isChild, setIsChild] = useState(false);
  const [guardianPubkey, setGuardianPubkey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [importWords, setImportWords] = useState('');
  const [error, setError] = useState('');
  const [writtenDown, setWrittenDown] = useState(false);

  // --- Create flow ---
  const handleCreateName = () => {
    if (!displayName.trim()) return;
    setCreateStep('child-check');
  };

  const handleChildCheck = (child: boolean) => {
    setIsChild(child);
    if (child) {
      setCreateStep('guardian');
    } else {
      handleCreate(child);
    }
  };

  const handleGuardianSubmit = () => {
    if (guardianPubkey.length !== 64) {
      setError('Please enter a valid 64-character Signet ID');
      return;
    }
    setError('');
    handleCreate(true, guardianPubkey);
  };

  const handleCreate = async (child: boolean, guardian?: string) => {
    const result = await onCreate(displayName.trim(), child, guardian);
    setMnemonic(result.mnemonic);
    setCreateStep('recovery');
  };

  const handleRecoveryDone = () => {
    setCreateStep('done');
  };

  // --- Import flow ---
  const handleImportPhrase = () => {
    const words = importWords.trim().toLowerCase();
    if (!validateMnemonic(words)) {
      setError('Invalid recovery phrase. Please check your 12 words.');
      return;
    }
    setError('');
    setImportStep('name');
  };

  const handleImportComplete = async () => {
    if (!displayName.trim()) return;
    await onImport(importWords.trim().toLowerCase(), displayName.trim(), isChild, guardianPubkey || undefined);
  };

  // --- Render ---
  if (flow === 'welcome') {
    return (
      <div className="page fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ marginBottom: 8 }}>Welcome to Signet</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Your digital identity, owned by you.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setFlow('create')}>Create My Signet</button>
          <button className="btn btn-secondary" onClick={() => setFlow('import')}>I have a recovery phrase</button>
        </div>
      </div>
    );
  }

  if (flow === 'create') {
    if (createStep === 'name') {
      return (
        <div className="page fade-in">
          <h1 style={{ marginBottom: 8 }}>What should people call you?</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This is your display name. You can change it later.</p>
          <input
            className="input"
            placeholder="Your name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateName()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleCreateName} disabled={!displayName.trim()} style={{ marginTop: 16 }}>
            Continue
          </button>
        </div>
      );
    }

    if (createStep === 'child-check') {
      return (
        <div className="page fade-in">
          <h1 style={{ marginBottom: 8 }}>Is this account for a child?</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Child accounts are linked to a parent for safety.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => handleChildCheck(false)}>No, this is for me</button>
            <button className="btn btn-secondary" onClick={() => handleChildCheck(true)}>Yes, this is for a child</button>
          </div>
        </div>
      );
    }

    if (createStep === 'guardian') {
      return (
        <div className="page fade-in">
          <h1 style={{ marginBottom: 8 }}>Link to parent</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Enter the parent's Signet ID. They can find it on their My Signet home screen.
          </p>
          {error && <div style={{ padding: 8, background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12, color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
          <input
            className="input"
            placeholder="Parent's Signet ID (64 characters)"
            value={guardianPubkey}
            onChange={e => setGuardianPubkey(e.target.value.trim())}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleGuardianSubmit} style={{ marginTop: 16 }}>
            Continue
          </button>
          <button className="btn btn-ghost" onClick={() => setCreateStep('child-check')} style={{ marginTop: 8 }}>
            Back
          </button>
        </div>
      );
    }

    if (createStep === 'recovery') {
      return (
        <div className="page fade-in">
          <h1 style={{ marginBottom: 8 }}>Your recovery phrase</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Write these 12 words down and keep them safe. If you lose your phone, these words are the only way to get your Signet back. Never share them with anyone.
          </p>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {mnemonic.split(' ').map((word, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ fontWeight: 600 }}>{word}</span>
                </div>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={writtenDown} onChange={e => setWrittenDown(e.target.checked)} />
            <span style={{ fontSize: '0.9rem' }}>I've written these down</span>
          </label>
          <button className="btn btn-primary" onClick={handleRecoveryDone} disabled={!writtenDown}>
            Continue
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => navigator.clipboard?.writeText(mnemonic)}
            style={{ marginTop: 8 }}
          >
            Copy to clipboard
          </button>
        </div>
      );
    }

    // done — App.tsx will detect identity exists and show home
    return null;
  }

  if (flow === 'import') {
    if (importStep === 'phrase') {
      return (
        <div className="page fade-in">
          <h1 style={{ marginBottom: 8 }}>Enter your recovery phrase</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Type or paste your 12 words, separated by spaces.</p>
          {error && <div style={{ padding: 8, background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12, color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
          <textarea
            className="input"
            rows={4}
            placeholder="word1 word2 word3 ..."
            value={importWords}
            onChange={e => setImportWords(e.target.value)}
            style={{ resize: 'none' }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleImportPhrase} style={{ marginTop: 16 }}>
            Continue
          </button>
          <button className="btn btn-ghost" onClick={() => setFlow('welcome')} style={{ marginTop: 8 }}>
            Back
          </button>
        </div>
      );
    }

    if (importStep === 'name') {
      return (
        <div className="page fade-in">
          <h1 style={{ marginBottom: 8 }}>What should people call you?</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This is your display name.</p>
          <input
            className="input"
            placeholder="Your name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImportComplete()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleImportComplete} disabled={!displayName.trim()} style={{ marginTop: 16 }}>
            Restore My Signet
          </button>
        </div>
      );
    }

    return null;
  }

  return null;
}
