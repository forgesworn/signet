# Draft bot ownership profile

Unstable. Import from `signet-protocol/experimental`; nothing here is exported
from the package root, and any of it may change without a deprecation period.

This unreleased profile uses nostr-attestations kind 31000 with type
`bot-ownership`. Its replaceable d-tag is `bot-ownership:<bot pubkey>`, p-tag is
the bot, and the event author is the selected owner persona. It cannot replace
a credential or vouch. Ownership never grants the bot the owner's trust.

A live claim has `valid_from` equal to `created_at`, matching `valid_to` and
`expiration`, and content `{ "v": 1, "label": "…" }` (100 characters maximum).
Labels refuse C0/C1 controls, DEL, zero-width and bidi marks (LRM, RLM, ALM),
line/paragraph separators and bidi embeddings, overrides and isolates, lone
surrogates, and every other Unicode format or default-ignorable code point,
except the narrow in-context forms emoji sequences need: the zero-width
joiner between emoji elements, the VS15/VS16 variation selectors right after
an emoji or a keycap base, and the England/Scotland/Wales RGI subdivision
flag tag sequences (no other tag sequence, and no hidden tag payload).
The event supplies principal, agent, issue date and expiry without requiring a
raw-hash signature: ordinary NIP-46 sign_event works on hardware. Revocation is
the existing same-address attestation with `status=revoked` and empty content.

Builders return unsigned events and never publish. Product integration must ask
for creation consent every time, sign with the chosen persona, and keep the
signed claim private until publication is explicitly chosen. Hardware-derived
bots must be registered on the device; this module does not register them.

Default expiry is 30 days, permitted creation range 1–90 days. Readers apply the
earliest of signed expiry, 90 days and an optional stricter per-bot ceiling,
with five minutes of clock tolerance. Lapsed is different from revoked.
Renewal becomes due with ten days left; retry at most daily. The scheduling
helper never signs: local policy and hardware approvals remain in force.

Consumers pin the expected owner and bot, verify signatures, and select the
newest same-address event while retaining their previously seen high-water mark.
A stale ownership claim must not resurrect a newer revocation. This module
validates one event; it does not implement relay freshness or fetch ordering.
`readBotOwnershipSync` applies identical validation for synchronous storage and
transport codecs; `readBotOwnership` is the asynchronous form of the same check.

Protocol review, app lifecycle/UI, isolated bots contacts, downstream adoption,
and hardware acceptance are still required before release.
