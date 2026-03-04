# Entity Type Classification Design

**Date:** 2026-03-04
**Status:** Approved

## Problem

The Signet protocol currently models identity along a single axis: verification depth (Tiers 1-4). It does not distinguish *what kind of entity* an account represents — human, bot, organisation, or anonymous alias. As AI agents, organisational accounts, and remote-operated hardware (humanoid robots, telepresence) become common on Nostr, the protocol needs a way to classify entity types.

## Design Decisions

1. **Entity type is orthogonal to verification tiers.** Type says WHAT you are; tier says HOW DEEPLY you're verified. Both axes coexist independently.
2. **Entity type is a credential claim** (Approach 1) — added as a field within existing credential events (kind 30470), not a standalone event kind.
3. **Mechanism-based distinction** — the type of cryptographic linkage defines the entity type. Identity bridge = persona. Delegation event = agent. Professional credential = natural/juridical person.
4. **Dual naming** — the protocol uses formal legal terminology (Natural Person, Juridical Person, Persona); apps use friendly labels (Person, Organisation, Alias).

## Entity Type Taxonomy

Nine entity types organised into three root categories with alias and agent subtypes:

### Root Categories

| Protocol Term | Code | App Label | What It Is |
|---|---|---|---|
| **Natural Person** | `natural_person` | Person | A living human, professionally verified (Tier 3/4) |
| **Juridical Person** | `juridical_person` | Organisation | A legal entity, verified by professional + multi-sig from verified Natural Persons |
| **Free Agent** | `free_agent` | Free Agent | An unverified account with no chain of trust (the default) |

### Alias Subtypes (Anonymous Identities)

| Protocol Term | Code | App Label | What It Is |
|---|---|---|---|
| **Persona** | `persona` | Alias | Anonymous alias of a Natural Person, linked via identity bridge (ring signature) |
| **Juridical Persona** | `juridical_persona` | Org Alias | Anonymous alias of a Juridical Person, linked via identity bridge |

### Agent Subtypes (Delegated Bots)

| Protocol Term | Code | App Label | What It Is |
|---|---|---|---|
| **Personal Agent** | `personal_agent` | Personal Agent | Bot delegated by a Natural Person |
| **Free Personal Agent** | `free_personal_agent` | Free Personal Agent | Bot delegated by a Persona |
| **Organised Agent** | `organised_agent` | Organised Agent | Bot delegated by a Juridical Person |
| **Free Organised Agent** | `free_organised_agent` | Free Org Agent | Bot delegated by a Juridical Persona |

### Ownership and Delegation Tree

```
Natural Person ──► Personal Agent
  │
  └──► Persona ──► Free Personal Agent

Juridical Person ──► Organised Agent
  │
  └──► Juridical Persona ──► Free Organised Agent

Free Agent (standalone, no chain of trust)
```

**Key rule:** Every account starts as a Free Agent. Entity type is earned through the appropriate verification mechanism.

## Linkage Mechanisms

Each entity type is defined by how it connects to the chain of trust:

| Entity Type | Linkage Mechanism | Signed By |
|---|---|---|
| Natural Person | Professional credential (kind 30470, Tier 3/4) | Professional verifier |
| Persona | Identity bridge (kind 30476, ring signature) | The Natural Person's anonymous key |
| Personal Agent | Delegation event (kind 30477) | The Natural Person owner |
| Free Personal Agent | Delegation event (kind 30477) | The Persona owner |
| Juridical Person | Professional credential + multi-sig attestation | Professional + board of Natural Persons |
| Juridical Persona | Identity bridge (kind 30476, ring signature) | The Juridical Person's anonymous key |
| Organised Agent | Delegation event (kind 30477) | The Juridical Person owner |
| Free Organised Agent | Delegation event (kind 30477) | The Juridical Persona owner |
| Free Agent | None | Self (no linkage) |

## Delegation Event (Kind 30477)

A new Nostr event kind for agent delegation:

```
Kind 30477: Agent Delegation

Tags:
  ["d", "<unique delegation ID>"]
  ["p", "<agent's pubkey>"]
  ["entity_type", "<agent type>"]
  ["expiry", "<unix timestamp>"]      // optional

Signed by: the owner's key
```

- Delegation owner must be a Natural Person, Persona, Juridical Person, or Juridical Persona
- Delegation is revocable via existing revocation event (kind 30475)
- The entity type of the agent is constrained by the owner's type (see delegation tree above)

## Organisation Verification

Juridical Person (Organisation) verification requires dual proof:

1. **Professional verification** — a Tier 3+ professional verifies the organisation's legal registration documents (articles of incorporation, registration certificate, etc.)
2. **Multi-sig attestation** — N-of-M verified Natural Persons co-sign a credential attesting they represent the organisation (e.g., 3 of 5 board members)

Both must be present for an account to achieve Juridical Person status.

## Credential Event Changes

The existing credential event (kind 30470) gains a new tag:

```
["entity_type", "<type code>"]
```

Where `<type code>` is one of: `natural_person`, `persona`, `personal_agent`, `free_personal_agent`, `juridical_person`, `juridical_persona`, `organised_agent`, `free_organised_agent`, `free_agent`.

This tag is derived from the verification mechanism used but is included explicitly for easy querying by relays and clients.

## Examples

### Example 1: Individual Verification Flow

Maria gets professionally verified as a Natural Person:
1. Maria meets a lawyer in person, presents government ID
2. Lawyer issues a kind 30470 credential with `["entity_type", "natural_person"]`
3. Maria's account is now a **Natural Person** (App: "Person")

Maria creates an anonymous alias for activism:
1. Maria generates a new keypair
2. She creates an identity bridge (kind 30476) using ring signatures over a set of verified Natural Person pubkeys
3. The anonymous account is now a **Persona** (App: "Alias")
4. Anyone can verify "a real verified person controls this account" without knowing it's Maria

Maria sets up a bot to auto-post her blog:
1. Maria creates a delegation event (kind 30477) from her Natural Person account to the bot's pubkey
2. The bot is now a **Personal Agent** (App: "Personal Agent")
3. Anyone can verify the bot is authorised by a verified person

### Example 2: Organisation Flow

A legal aid non-profit gets verified:
1. A notary verifies the organisation's registration documents
2. Three board members (all verified Natural Persons) co-sign a credential
3. The organisation's account is now a **Juridical Person** (App: "Organisation")

The non-profit deploys a helpdesk bot:
1. The organisation creates a delegation event to the bot's pubkey
2. The bot is now an **Organised Agent** (App: "Organised Agent")

### Example 3: Humanoid Robot / Telepresence

Alex is a paraplegic Natural Person who controls a humanoid robot via a brain-computer interface (e.g., Neuralink). The robot can operate in multiple modes:

**Teleoperated mode (Persona):**
Alex is directly controlling the robot in real-time — walking, talking, interacting. The robot is Alex's physical avatar. The robot's account operates as a **Persona** of Alex, linked via identity bridge. The robot signals its current mode: `["mode", "teleoperated"]`. People interacting with the robot know they are talking to a real verified person, in real-time.

**Autonomous mode (Personal Agent):**
Alex steps away and the robot's onboard AI takes over for routine tasks (navigating home, answering simple questions). The robot's account switches to operating as a **Personal Agent**, with delegation from Alex. The robot signals: `["mode", "autonomous"]`. People interacting know they are talking to a bot authorised by Alex, not Alex directly.

**Dynamic mode signaling:**
A single physical robot can switch between entity types depending on who/what is in control. The mode signal is a tag on events published by the robot, allowing others to know in real-time whether they're interacting with the person or their AI:

```
["mode", "teleoperated"]   // Person is in direct control (Persona)
["mode", "autonomous"]     // AI is acting on behalf (Personal Agent)
["mode", "assisted"]       // Person is in control with AI assistance (Persona, AI-augmented)
```

This pattern applies broadly to any remote-operated system: telepresence robots, drone operators, remote surgery rigs, VR avatars — any case where a verified person may or may not be in direct control at a given moment.

### Example 4: Whistleblower Organisation

An investigative journalism collective wants to operate anonymously:
1. The collective first establishes itself as a **Juridical Person** (verified by professional + board members)
2. It creates an anonymous account linked via identity bridge
3. The anonymous account is a **Juridical Persona** (App: "Org Alias")
4. The collective deploys a tip-submission bot under the anonymous identity
5. The bot is a **Free Organised Agent** (App: "Free Org Agent")

Anyone can verify: "this bot is operated by a real, verified organisation" — without knowing which one.

## Future Extension: Synthetic Person

The current taxonomy covers entities that are either human, human-controlled, human-organised, or unverified. It does not cover fully autonomous beings (e.g., a sentient AI or truly independent robot) that act on their own behalf rather than on behalf of a human or organisation.

If/when such entities require their own legal or social standing, a new root category — **Synthetic Person** — could be added alongside Natural Person and Juridical Person, with its own alias and agent subtypes. The taxonomy is designed to accommodate this without breaking changes:

```
Future:
Synthetic Person ──► Synthetic Agent
  │
  └──► Synthetic Persona ──► Free Synthetic Agent
```

This is deliberately left as a future extension (YAGNI). The current 9 types cover all practical scenarios for the foreseeable future.

## Relationship to Existing Protocol

| Existing Concept | How Entity Types Interact |
|---|---|
| Verification Tiers (1-4) | Orthogonal. Entity type and tier are independent axes. A Natural Person could be Tier 3 or 4. A Persona inherits trust via identity bridge. |
| Trust Score (0-100) | Entity type may influence score weights (e.g., vouches from Natural Persons vs Free Agents carry different weight). Details TBD in implementation. |
| Identity Bridge (kind 30476) | Already exists. Now formally defines the Persona and Juridical Persona entity types. |
| Revocation (kind 30475) | Already exists. Used to revoke agent delegations as well as credentials. |
| Vouch (kind 30471) | Unchanged. Vouches can flow between any entity types, with weight influenced by the voucher's type and tier. |
| Relay Policies (kind 30472) | Can now filter by entity type (e.g., "this relay only accepts Natural Persons and Personas"). |

## Protocol Type Additions

```typescript
export type EntityType =
  | 'natural_person'
  | 'persona'
  | 'personal_agent'
  | 'free_personal_agent'
  | 'juridical_person'
  | 'juridical_persona'
  | 'organised_agent'
  | 'free_organised_agent'
  | 'free_agent';

export type EntityMode =
  | 'teleoperated'   // Person in direct control
  | 'autonomous'     // AI/bot acting on behalf
  | 'assisted';      // Person in control with AI assistance
```

## App Label Mapping

```typescript
const ENTITY_LABELS: Record<EntityType, string> = {
  natural_person: 'Person',
  persona: 'Alias',
  personal_agent: 'Personal Agent',
  free_personal_agent: 'Free Personal Agent',
  juridical_person: 'Organisation',
  juridical_persona: 'Org Alias',
  organised_agent: 'Organised Agent',
  free_organised_agent: 'Free Org Agent',
  free_agent: 'Free Agent',
};
```
