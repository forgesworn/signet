# CLAUDE.md — Signet Protocol

## What This Is

Signet is an open-source identity verification protocol for Nostr. It uses zero-knowledge proofs to let users prove claims about their identity without revealing personal data.

This repo contains:
- `spec/protocol.md` — the full protocol specification
- `src/` — TypeScript protocol library (npm publishable)
- `app/` — Reference web app (React + Vite, imports the protocol library)
- `examples/` — example event payloads and flows
- `legal/` — legal documents in multiple languages
- `docs/plans/` — design and implementation plans

## Key Concepts

- **4 verification tiers**: Tier 1 (self-declared) → Tier 2 (web-of-trust) → Tier 3 (professional adult) → Tier 4 (professional adult+child)
- **6 event kinds**: 30470 (credential), 30471 (vouch), 30472 (policy), 30473 (verifier), 30474 (challenge), 30475 (revocation)
- **Crypto stack**: Schnorr (secp256k1 base) + Bulletproofs (age range proofs) + future ZK layer
- **No central authority**: professional bodies (Law Society, medical boards, notary commissions) are the trust anchors
- **"Signet me"**: Time-based 3-word verification for peer-to-peer identity proof over untrusted channels
- **BIP-39 / NIP-06**: Identity derived from 12-word mnemonic, Shamir backup supported

## Relationship to Fathom

Fathom (https://github.com/decented/decented) is the first reference implementation. Signet is protocol-level — it doesn't depend on Fathom or any specific client.

## Development Workflow

### After ANY code change, you MUST:

1. **Run the full test suite** — `node node_modules/vitest/vitest.mjs run` (protocol) and app tests if applicable
2. **Run typecheck** — `node node_modules/typescript/bin/tsc --noEmit`
3. **If a bug is found and fixed**, update `spec/protocol.md` with any clarifications needed so the spec is sufficient to rebuild from scratch without hitting the same bug
4. **Commit** the code changes, test fixes, and any spec updates together
5. **Push** to remote

Never claim work is complete without fresh test output confirming it passes. Evidence before assertions.

### Spec-First Development

The spec (`spec/protocol.md`) is the source of truth. If implementation reveals ambiguity, underspecification, or an error in the spec, **update the spec first**, then fix the code. The spec must always be complete enough that a new implementer could rebuild the system from the spec alone.

## Project Structure

```
Signet/
├── src/          — Protocol library (TypeScript, no framework dependencies)
├── tests/        — Protocol tests (vitest)
├── app/          — Reference web app (React + Vite + TypeScript)
├── spec/         — Protocol specification
├── examples/     — Example flows
├── legal/        — Legal documents (multi-language)
├── docs/plans/   — Design and implementation plans
├── dist/         — Compiled protocol library output
└── .github/      — CI workflows
```

## Commands

```bash
# Protocol
node node_modules/vitest/vitest.mjs run       # run protocol tests
node node_modules/typescript/bin/tsc --noEmit  # typecheck protocol

# App (from app/ directory)
npm run dev                                     # start dev server
npm run build                                   # production build
npm run typecheck                               # typecheck app
```

## Port Allocation

- **5174** — Signet reference app (HTTPS, self-signed cert)
- Avoid: 3000, 5173, 7777, 7778, 8787 (in use by other services)

## Subagent Model Selection

When dispatching subagents via the Agent tool, choose the model based on task complexity:

- **Haiku** — file searches, codebase exploration, simple lookups, summarising content, simple questions
- **Sonnet** — well-defined implementation tasks with clear instructions, straightforward code changes, find-and-replace edits, running tests, code reviews
- **Opus** — complex multi-step reasoning, architectural decisions, ambiguous requirements, large refactors with many interdependent changes, brainstorming and design work

Default to **Sonnet** unless the task genuinely needs Opus-level reasoning. Prefer the cheapest model that can reliably complete the task.

### Guidance by agent type

| Agent type | Default model | Rationale |
|------------|---------------|-----------|
| `Explore` | Haiku | Read-only, no Edit/Write tools — fast search is all that's needed |
| `general-purpose` | Sonnet | Most implementation work is well-scoped by the time it's dispatched |
| `Plan` | Opus | Planning benefits from deeper reasoning about trade-offs |
| `superpowers:code-reviewer` | Sonnet | Review against known criteria is systematic, not creative |

### Guidance by skill

| Skill | Recommended model | Rationale |
|-------|-------------------|-----------|
| `brainstorming` | Opus | Exploring intent, requirements, and design needs strong reasoning |
| `writing-plans` | Opus | Multi-step planning with architectural trade-offs |
| `executing-plans` | Sonnet | Following an already-written plan with clear steps |
| `subagent-driven-development` | Sonnet (per subagent) | Each subagent gets a well-scoped task from the plan |
| `test-driven-development` | Sonnet | Writing tests and implementation from clear requirements |
| `systematic-debugging` | Sonnet | Structured process; escalate to Opus if root cause is elusive |
| `requesting-code-review` | Sonnet | Checking work against known requirements |
| `verification-before-completion` | Haiku | Running commands and confirming output — minimal reasoning needed |
| `finishing-a-development-branch` | Sonnet | Straightforward merge/PR workflow |
