# Private vault checkpoint v1 (staged, not released)

Unstable. Import from `signet-protocol/experimental`; nothing here is exported
from the package root, and any of it may change without a deprecation period.

Keys derive flat from the tree root using `vaultPurpose`; index means rotation.
Legacy Natural Person rails remain permanently readable. No writer is switched
until both the app and Sapwood can restore the new dataset.

The existing v2 AES-GCM/NIP-44 envelope is retained. Vault keys wrap content keys
and sign only control events below 12 KiB of UTF-8 content. Every chunk is sealed
to the vault key but signed by an installation device key. A checkpoint authorises
that device and lists exact chunk event IDs, encrypted-content SHA-256 hashes,
byte lengths and order. The complete plaintext SHA-256 is the revision. Recovery discovers and merges all
device heads rather than selecting one global latest snapshot, so concurrent
offline writers cannot replace each other. The reader fails closed beyond 16
heads instead of dropping devices; head compaction is future work. Readers
verify signatures, scope, bounds, sequence, every chunk and the revision before
returning any data. Missing chunks never mean an empty dataset.

All events use existing kind 30078. Each installation retains its own checkpoint under
`vaultCheckpointTag(author, publisherDevicePubkey)`;
chunks use a content-derived tag and are fetched by exact event ID. This reuses
the existing event kind rather than allocating a new kind. Content-addressed
chunk replacement cannot alter an already signed checkpoint reference. No public
tags name the dataset or connect device chunks to the vault author. Routing tags
are opaque, not secret: knowing a vault pubkey lets an observer compute its tag.

Head discovery reads only kind-30078 events by the vault author whose single
d-tag has the checkpoint shape (32 lowercase hex characters); other events by
the vault key are ignored before the 16-head limit and never decrypted. The
shape is necessary, not sufficient, because the publisher is encrypted: the
vault key must sign no other kind-30078 event with a 32-hex d-tag, or that
event is read as a malformed head and the read is unusable.

Checkpoints dated more than `VAULT_CLOCK_TOLERANCE_SECONDS` (300) after the
reader's clock are rejected; every reader takes `now` as a parameter. A device
whose clock ran ahead therefore cannot outrank its own later honest heads, but
its future-dated head is ignored until the clock catches up. Of two events with
the same created_at under one tag, the lower event ID is the newer (NIP-01).

Checkpoint plaintext shape is exported as `VaultCheckpoint`. It contains purpose,
rotation, sequence, revision, authorised device pubkeys and ordered chunk refs.
`nextRotation` is optional and, when present, exactly `rotation + 1`; any other
value makes the checkpoint invalid. Recovery begins at zero. A rotation
must not become canonical before the new copy is fetched, decrypted and verified.

Rotation is a revocation boundary. When reading heads across rotations, the
pointer is the EARLIEST authenticated head declaring the next rotation. Heads
of the old rotation dated after the pointer (ties by event ID) are set aside,
whether or not they decrypt, and their publishers' sequence floors are not
treated as rollback; only heads at or before the pointer are merged, and the
next rotation must then read ready or the whole read fails. A holder of a
retired key therefore cannot add merged heads or redirect traversal after the
rotation. It can still backdate a head before the pointer, which is
indistinguishable from an honest one. The rotating writer must carry every
head's state into the new rotation; writes made under the old rotation after
the pointer are not recovered.

Restore results distinguish absent, unavailable, unusable and ready. Legacy may
be the canonical source only when the vault is absent, never merely because a
relay is offline or a new checkpoint fails to decrypt. A previously observed
sequence is a rollback floor. A fresh device cannot detect a relay withholding
all newer state without another trusted source; do not claim otherwise.

`createVaultRelayReader` queries at most eight `wss://` relays (plain `ws://`
only for `localhost` and `127.0.0.1`, matching `RelayClient`). An empty answer
counts as absence only when every queried relay returned EOSE and none failed;
one relay answering empty while another times out or errors is `unavailable`,
never `absent`. A non-empty answer needs one relay to have answered. Each relay's
events are re-checked against the requested author, kind, ID and d-tag and
de-duplicated before a per-relay cap of 128, so unrelated events cannot crowd
out requested ones; a relay over the cap counts as failed.

The SDK provides stateless read/validation and forward rotation traversal.
Writer scheduling, dataset import and durable canonical markers belong to
consumers. The candidate Signet app implements scheduling and confirmed-copy
state; this does not establish equivalent Sapwood behaviour.
