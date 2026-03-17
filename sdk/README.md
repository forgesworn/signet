# Signet Verify — Age Verification SDK

Add privacy-preserving age verification to any website. One script tag, one function call. No personal data collected.

## Quick Start

```html
<script src="https://cdn.signet.trotters.cc/verify.js"></script>
<script>
  document.getElementById('verify-btn').addEventListener('click', async () => {
    const result = await Signet.verifyAge('18+');
    if (result.verified) {
      // User is verified as 18+
      console.log('Verified! Tier:', result.tier);
    } else {
      console.log('Not verified:', result.error);
    }
  });
</script>
<button id="verify-btn">Verify your age</button>
```

## How It Works

1. Website calls `Signet.verifyAge('18+')`
2. A modal appears with a QR code
3. User scans with their Signet app and approves
4. The app sends a cryptographic proof (no PII)
5. The SDK verifies the proof in-browser and returns the result
6. The user's app can be closed — the website has the proof

## API

### `Signet.verifyAge(requiredAgeRange, options?)`

Returns `Promise<SignetVerifyResult>`

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `relayUrl` | `string` | `wss://relay.damus.io` | Relay URL for cross-device communication |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Modal colour scheme |
| `timeout` | `number` | `120000` | Timeout in milliseconds |

**Result:**

| Field | Type | Description |
|-------|------|-------------|
| `verified` | `boolean` | `true` if the credential is valid and the age range is met |
| `ageRange` | `string \| null` | Age range from the credential (e.g. `'18+'`) |
| `tier` | `number \| null` | Verification tier (1–4) |
| `entityType` | `string \| null` | `'natural-person'`, `'minor'`, etc. |
| `credentialId` | `string \| null` | Nostr event ID of the credential |
| `verifierPubkey` | `string \| null` | Pubkey of the issuing verifier |
| `issuedAt` | `number \| null` | Unix timestamp of credential issuance |
| `expiresAt` | `number \| null` | Unix timestamp of credential expiry, or `null` if no expiry |
| `error` | `string \| undefined` | `'cancelled'`, `'timeout'`, `'invalid-credential'`, `'age-range-not-met'` |

### Age Range Values

| Value | Meaning |
|-------|---------|
| `'0-3'` | Ages 0–3 |
| `'4-7'` | Ages 4–7 |
| `'8-12'` | Ages 8–12 |
| `'13-17'` | Ages 13–17 |
| `'18+'` | Adult (18 and over) |

## Privacy

- No personal data is transmitted — only a cryptographic proof of age range
- No account creation required on the website
- No cookies beyond session management
- The proof is verified entirely in the browser — no server-side API calls
- Compliant with GDPR, COPPA, UK Online Safety Act
