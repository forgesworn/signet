# Signet Reference App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first React web app that demonstrates the Signet protocol — identity creation, peer connections via QR, and "signet me" 3-word verification.

**Architecture:** React 19 + Vite SPA, all client-side, IndexedDB for persistence, self-signed HTTPS for camera access. Imports `signet-protocol` from the local monorepo. Three user roles (adult, child, verifier) in one app.

**Tech Stack:** React 19, Vite 6, TypeScript 5, IndexedDB (idb wrapper), qrcode (generation), html5-qrcode (scanning), CSS custom properties for theming.

**Port:** 5174 (HTTPS)

---

## Phase 1: Project Scaffold + HTTPS + Theming

### Task 1: Scaffold Vite + React project

**Files:**
- Create: `app/package.json`
- Create: `app/vite.config.ts`
- Create: `app/tsconfig.json`
- Create: `app/tsconfig.node.json`
- Create: `app/index.html`
- Create: `app/src/main.tsx`
- Create: `app/src/App.tsx`
- Create: `app/src/vite-env.d.ts`

**Step 1: Create `app/package.json`**

```json
{
  "name": "signet-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "idb": "^8.0.0",
    "qrcode": "^1.5.4",
    "html5-qrcode": "^2.3.8",
    "signet-protocol": "file:.."
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/qrcode": "^1.5.5",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

**Step 2: Create `app/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const certDir = path.resolve(__dirname, 'cert');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    https: fs.existsSync(path.join(certDir, 'signet.pem'))
      ? {
          cert: fs.readFileSync(path.join(certDir, 'signet.pem')),
          key: fs.readFileSync(path.join(certDir, 'signet-key.pem')),
        }
      : undefined,
  },
  resolve: {
    alias: {
      'signet-protocol': path.resolve(__dirname, '../src'),
    },
  },
});
```

**Step 3: Create `app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "paths": {
      "signet-protocol": ["../src/index.ts"],
      "signet-protocol/*": ["../src/*"]
    }
  },
  "include": ["src", "vite-env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 4: Create `app/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 5: Create `app/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <title>Signet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Create `app/src/vite-env.d.ts`**

```typescript
/// <reference types="vite/client" />
```

**Step 7: Create `app/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 8: Create `app/src/App.tsx`**

Placeholder — just renders "Signet" text to prove the scaffold works.

```tsx
export function App() {
  return <div className="app"><h1>Signet</h1></div>;
}
```

**Step 9: Install dependencies and verify**

```bash
cd app && npm install && npm run typecheck && npm run build
```

**Step 10: Commit**

```bash
git add app/
git commit -m "feat(app): scaffold Vite + React project"
```

---

### Task 2: Generate self-signed HTTPS cert

**Files:**
- Create: `app/cert/generate-cert.sh`
- Create: `app/cert/signet.pem` (generated)
- Create: `app/cert/signet-key.pem` (generated)
- Create: `app/public/signet.pem` (copy for download)
- Modify: `app/.gitignore`

**Step 1: Create `app/.gitignore`**

```
node_modules
dist
cert/signet.pem
cert/signet-key.pem
```

**Step 2: Create `app/cert/generate-cert.sh`**

```bash
#!/bin/bash
# Generate a self-signed certificate for local HTTPS development
# The cert covers localhost and common LAN addresses

CERT_DIR="$(cd "$(dirname "$0")" && pwd)"

openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -days 365 -nodes \
  -keyout "$CERT_DIR/signet-key.pem" \
  -out "$CERT_DIR/signet.pem" \
  -subj "/CN=Signet Local Dev" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:10.0.0.0/8,IP:172.16.0.0/12,IP:192.168.0.0/16"

# Copy to public/ so it can be downloaded from the settings page
cp "$CERT_DIR/signet.pem" "$CERT_DIR/../public/signet.pem"

echo "Certificate generated:"
echo "  Cert: $CERT_DIR/signet.pem"
echo "  Key:  $CERT_DIR/signet-key.pem"
echo "  Download copy: $CERT_DIR/../public/signet.pem"
```

**Step 3: Generate the cert**

```bash
cd app && mkdir -p cert public && chmod +x cert/generate-cert.sh && bash cert/generate-cert.sh
```

**Step 4: Verify dev server starts with HTTPS**

```bash
cd app && npx vite --host --port 5174 &
# Check it responds
curl -k https://localhost:5174/ | head -5
# Kill the server
kill %1
```

**Step 5: Commit**

```bash
git add app/cert/generate-cert.sh app/.gitignore app/public/signet.pem
git commit -m "feat(app): self-signed HTTPS cert generation"
```

Note: cert/signet.pem and cert/signet-key.pem are gitignored. The generate script is committed. public/signet.pem is committed for downloadability.

---

### Task 3: Global CSS + adaptive dark/light theming

**Files:**
- Create: `app/src/index.css`

**Step 1: Create the global stylesheet with CSS custom properties**

```css
/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-card: #ffffff;
  --bg-input: #f0f0f2;
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --text-muted: #888888;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-text: #ffffff;
  --border: #e0e0e0;
  --border-subtle: #f0f0f0;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --signet-word: #2563eb;
  --shadow: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.1);
  --radius: 12px;
  --radius-sm: 8px;
  --nav-height: 64px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
}

/* Dark theme */
[data-theme="dark"],
:root:not([data-theme="light"]):is(@media (prefers-color-scheme: dark) *) {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-card: #1a1a1a;
  --bg-input: #222222;
  --text-primary: #f0f0f0;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --accent-text: #ffffff;
  --border: #2a2a2a;
  --border-subtle: #1f1f1f;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --signet-word: #60a5fa;
  --shadow: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.4);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #0a0a0a;
    --bg-secondary: #141414;
    --bg-card: #1a1a1a;
    --bg-input: #222222;
    --text-primary: #f0f0f0;
    --text-secondary: #aaaaaa;
    --text-muted: #666666;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
    --accent-text: #ffffff;
    --border: #2a2a2a;
    --border-subtle: #1f1f1f;
    --success: #22c55e;
    --warning: #f59e0b;
    --danger: #ef4444;
    --signet-word: #60a5fa;
    --shadow: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-lg: 0 4px 12px rgba(0,0,0,0.4);
  }
}

body {
  background: var(--bg-primary);
  min-height: 100dvh;
  overflow-x: hidden;
}

#root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* Utility classes */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.page {
  flex: 1;
  padding: 16px;
  padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + 16px);
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  width: 100%;
}

.btn:active { transform: scale(0.98); }

.btn-primary {
  background: var(--accent);
  color: var(--accent-text);
}
.btn-primary:hover { background: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: var(--accent); }

.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-center { text-align: center; }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-8 { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.gap-8 { gap: 8px; }
.gap-16 { gap: 16px; }
.flex-col { display: flex; flex-direction: column; }
```

**Step 2: Commit**

```bash
git add app/src/index.css
git commit -m "feat(app): global CSS with adaptive dark/light theming"
```

---

## Phase 2: IndexedDB + Identity Management

### Task 4: IndexedDB wrapper

**Files:**
- Create: `app/src/lib/db.ts`

Thin wrapper around `idb` library. Three stores: identity, connections, preferences.

**Step 1: Create `app/src/lib/db.ts`**

```typescript
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'signet';
const DB_VERSION = 1;

export interface StoredIdentity {
  id: 'current';
  mnemonic: string;       // encrypted
  publicKey: string;
  role: 'adult' | 'child' | 'verifier';
  displayName: string;
  createdAt: number;
}

export interface StoredConnection {
  pubkey: string;         // primary key
  sharedSecret: string;
  theirInfo: Record<string, unknown>;
  ourInfo: Record<string, unknown>;
  connectedAt: number;
  method: string;
}

export interface StoredPreferences {
  id: 'current';
  theme: 'system' | 'light' | 'dark';
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('connections')) {
          db.createObjectStore('connections', { keyPath: 'pubkey' });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Identity
export async function getIdentity(): Promise<StoredIdentity | undefined> {
  const db = await getDB();
  return db.get('identity', 'current');
}

export async function saveIdentity(identity: StoredIdentity): Promise<void> {
  const db = await getDB();
  await db.put('identity', identity);
}

export async function deleteIdentity(): Promise<void> {
  const db = await getDB();
  await db.delete('identity', 'current');
}

// Connections
export async function getConnections(): Promise<StoredConnection[]> {
  const db = await getDB();
  return db.getAll('connections');
}

export async function getConnection(pubkey: string): Promise<StoredConnection | undefined> {
  const db = await getDB();
  return db.get('connections', pubkey);
}

export async function saveConnection(connection: StoredConnection): Promise<void> {
  const db = await getDB();
  await db.put('connections', connection);
}

export async function deleteConnection(pubkey: string): Promise<void> {
  const db = await getDB();
  await db.delete('connections', pubkey);
}

export async function clearConnections(): Promise<void> {
  const db = await getDB();
  await db.clear('connections');
}

// Preferences
export async function getPreferences(): Promise<StoredPreferences> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'current');
  return prefs ?? { id: 'current', theme: 'system' };
}

export async function savePreferences(prefs: StoredPreferences): Promise<void> {
  const db = await getDB();
  await db.put('preferences', prefs);
}
```

**Step 2: Verify typecheck**

```bash
cd app && npm run typecheck
```

**Step 3: Commit**

```bash
git add app/src/lib/db.ts
git commit -m "feat(app): IndexedDB wrapper for identity, connections, preferences"
```

---

### Task 5: React hooks for state management

**Files:**
- Create: `app/src/hooks/useIdentity.ts`
- Create: `app/src/hooks/useConnections.ts`
- Create: `app/src/hooks/usePreferences.ts`
- Create: `app/src/hooks/useSignetWords.ts`

**Step 1: Create each hook**

`useIdentity` — loads/saves identity from IndexedDB, provides `create`, `import`, `delete` actions. Returns `{ identity, loading, create, importMnemonic, deleteIdentity }`.

`useConnections` — loads/saves connections. Returns `{ connections, loading, addConnection, removeConnection, getConnection }`.

`usePreferences` — loads/saves preferences. Returns `{ preferences, loading, setTheme }`. Also applies `data-theme` attribute to `<html>`.

`useSignetWords` — takes a `sharedSecret`, returns live-updating `{ words, formatted, expiresIn }` using `setInterval` to refresh every second. Calls `getSignetDisplay()` from the protocol library.

**Step 2: Verify typecheck**

```bash
cd app && npm run typecheck
```

**Step 3: Commit**

```bash
git add app/src/hooks/
git commit -m "feat(app): React hooks for identity, connections, preferences, signet words"
```

---

### Task 6: Signet protocol bridge

**Files:**
- Create: `app/src/lib/signet.ts`

Re-exports the subset of `signet-protocol` the app uses, plus a convenience function `createNewIdentity(role, displayName)` that generates a mnemonic, derives the keypair, and returns a `StoredIdentity`.

**Step 1: Create the bridge module**

**Step 2: Verify typecheck and commit**

---

## Phase 3: Core UI Components

### Task 7: Layout + Navigation

**Files:**
- Create: `app/src/components/Layout.tsx`
- Modify: `app/src/App.tsx`

Bottom navigation bar with 4 tabs: Home, Connections, Scan, Settings. Uses simple state-based routing (no react-router — keep dependencies minimal). The nav highlights the active tab. Scan button is centred and prominent.

For the verifier role, a 5th tab "Verify" appears.

**Step 1: Build Layout component with bottom nav**

**Step 2: Update App.tsx to use Layout and manage page state**

**Step 3: Verify it renders, commit**

---

### Task 8: Onboarding flow

**Files:**
- Create: `app/src/pages/Onboarding.tsx`
- Create: `app/src/components/WordGrid.tsx`

Multi-step onboarding:
1. Welcome screen with app name + "Create Identity" / "Import Identity"
2. Account type selector (Adult / Child / Verifier)
3. For create: generate 12 words, display in a grid, "I've written these down" checkbox
4. Confirm: pick 3 random word positions, user must select the correct words
5. Set display name
6. Save identity to IndexedDB → navigate to Home

For import: text area for 12 words, real-time validation, derive key, set display name, save.

`WordGrid` component: displays 12 words in a 3×4 grid, numbered. Also has an interactive mode for the confirmation step where words are tappable.

**Step 1: Build WordGrid component**
**Step 2: Build Onboarding page with all steps**
**Step 3: Wire into App.tsx (show Onboarding when no identity exists)**
**Step 4: Test manually, commit**

---

### Task 9: Home screen

**Files:**
- Create: `app/src/pages/Home.tsx`
- Create: `app/src/components/QRCode.tsx`
- Create: `app/src/components/TierBadge.tsx`
- Create: `app/src/components/TrustScore.tsx`

Displays:
- Display name + role badge
- Public key (truncated, tap to copy to clipboard)
- QR code of pubkey (using `qrcode` library to render to canvas)
- Tier badge
- Trust score bar (expandable breakdown)

`QRCode` component: takes a `data` string prop, renders a QR code to a canvas element using the `qrcode` library.

`TierBadge` component: takes a `tier` (1-4), renders the checkmark display (none / ✓ / ✓✓ / ✓✓✓).

`TrustScore` component: takes a score (0-100), renders a horizontal bar with percentage.

**Step 1: Build QRCode, TierBadge, TrustScore components**
**Step 2: Build Home page**
**Step 3: Test manually, commit**

---

### Task 10: QR Scanner + Connection flow

**Files:**
- Create: `app/src/pages/Scan.tsx`
- Create: `app/src/components/QRScanner.tsx`
- Create: `app/src/hooks/useCamera.ts`

`useCamera` hook: requests camera permission, returns stream + permission state.

`QRScanner` component: uses `html5-qrcode` library to scan QR codes from the camera feed. Fires `onScan(data: string)` callback when a QR is decoded.

`Scan` page:
1. Full-screen camera viewfinder with QR scanner
2. On successful scan → parse QR payload → show preview of their info
3. "Select what to share" — toggleable checkboxes for name, mobile, email, address, child keys
4. "Connect" button → compute ECDH shared secret, save connection to IndexedDB
5. Success screen showing their name + the first signet words

**Step 1: Build useCamera hook**
**Step 2: Build QRScanner component**
**Step 3: Build Scan page with full connection flow**
**Step 4: Test with real camera, commit**

---

### Task 11: Connections list + Contact detail + Signet words

**Files:**
- Create: `app/src/pages/Connections.tsx`
- Create: `app/src/pages/ContactDetail.tsx`
- Create: `app/src/components/SignetWords.tsx`
- Create: `app/src/components/ProgressBar.tsx`

`SignetWords` component: THE HERO UI. Takes a `sharedSecret`, uses `useSignetWords` hook, displays:
- 3 large words with middle-dot separator
- Countdown progress bar (30s epoch)
- Words animate/fade when they rotate
- "Verify" button that opens an input mode where you type 3 words someone read to you

`ProgressBar` component: horizontal bar that depletes over time. Takes `expiresIn` (seconds) and `total` (30).

`Connections` page: list of all contacts, each showing name + tier badge + "last seen" time. Tap → ContactDetail.

`ContactDetail` page:
- Their shared info (name, mobile, etc.)
- SignetWords component (the main attraction)
- "Vouch" button
- "Remove connection" (with confirmation)

**Step 1: Build ProgressBar component**
**Step 2: Build SignetWords component**
**Step 3: Build Connections list page**
**Step 4: Build ContactDetail page**
**Step 5: Test flow end-to-end, commit**

---

## Phase 4: Backup, Verifier, Settings

### Task 12: Backup screen (Shamir)

**Files:**
- Create: `app/src/pages/Backup.tsx`

Two sections:
1. **Create backup shares** — Choose 2-of-3 or 3-of-5 → generate shares → display each as word grid → QR code for each share
2. **Restore from shares** — Enter M shares as word grids → reconstruct → verify → offer to replace current identity

**Step 1: Build Backup page**
**Step 2: Test share generation and reconstruction, commit**

---

### Task 13: Verifier screen

**Files:**
- Create: `app/src/pages/Verifier.tsx`

Only visible for verifier role:
1. **Register as verifier** — form: profession, jurisdiction (dropdown from protocol's jurisdiction list), licence number, professional body. Creates and displays the verifier credential event.
2. **Issue credential** — scan/paste subject's pubkey, select tier (3 or 4), if tier 4 enter age range. Creates signed credential event and displays it.
3. **Issuance history** — list of credentials issued (stored locally).

**Step 1: Build Verifier page with all three sections**
**Step 2: Test credential creation, commit**

---

### Task 14: Settings screen

**Files:**
- Create: `app/src/pages/Settings.tsx`
- Create: `app/src/components/ThemeToggle.tsx`

Settings page with sections:
1. **Theme** — System / Light / Dark toggle (ThemeToggle component)
2. **Account type** — Current role, button to change
3. **Certificate** — Download link for `signet.pem` + install instructions accordion:
   - **iOS Safari**: Settings → General → About → Certificate Trust Settings → enable
   - **Android Chrome**: Settings → Security → Install from storage
   - **macOS Safari**: Double-click .pem → Keychain → trust
   - **Firefox**: Settings → Privacy → View Certificates → Import
4. **Export data** — Download all data as JSON file
5. **Import data** — Upload JSON file to restore
6. **Danger zone** — Delete identity (red button, confirmation dialog)

**Step 1: Build ThemeToggle component**
**Step 2: Build Settings page with all sections**
**Step 3: Test theme switching, cert download, export/import, commit**

---

## Phase 5: Polish + Integration Test

### Task 15: Wire everything together + polish

**Files:**
- Modify: `app/src/App.tsx` — final routing, loading states, transitions
- Modify: various components for edge cases

1. Loading states — show skeleton/spinner while IndexedDB loads
2. Empty states — "No connections yet" with prompt to scan
3. Error handling — camera permission denied, invalid QR, etc.
4. Page transitions — subtle fade between pages
5. Touch feedback — button press states, haptic-style visual feedback
6. Responsive — ensure it looks good on both mobile and desktop widths
7. The QR code on Home should encode a full `QRPayload` (pubkey + nonce + selected contact info)

**Step 1: Polish all pages**
**Step 2: Full manual test on mobile browser**
**Step 3: Final commit**

---

### Task 16: Final verification + push

**Step 1: Run typecheck**

```bash
cd app && npm run typecheck
```

**Step 2: Run build**

```bash
cd app && npm run build
```

**Step 3: Start dev server and verify on mobile**

```bash
cd app && npm run dev
```

Open `https://<machine-ip>:5174` on mobile browser. Walk through:
- Create identity
- View home screen + QR
- Open in second browser tab, create second identity
- Scan QR codes between tabs (or use a second device)
- Verify signet words match
- Test Shamir backup
- Test settings (theme, cert download, export/import)

**Step 4: Run protocol tests to confirm nothing broke**

```bash
cd /media/sf_MintAI/Signet && node node_modules/vitest/vitest.mjs run
```

**Step 5: Commit and push**

```bash
git add -A
git commit -m "feat(app): Signet reference app — complete"
git push
```
