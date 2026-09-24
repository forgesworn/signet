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
the vault key are ignored (by the relay reader and again by recovery) before
any limit applies and are never decrypted. The
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

Rotation is a revocation boundary. Recovery reads only the newest rotation:
the first rotation n whose successor n + 1 holds no authentic checkpoint-shaped
event. Before reading rotation n it always probes rotation n + 1 (one extra
resolve and query). Once n + 1 exists, rotation n is never queried, opened,
counted or merged, so a holder of a retired key can neither inject or tombstone
data (backdated or not, under any publisher tag) nor block recovery with
malformed, over-cap or junk-tag events, nor hide the successor by overwriting
the pointer head. The newest rotation is read strictly; a pointer there to a
rotation with no authentic checkpoint is damage (`unusable`). The rotating
writer must carry every head's state into the new rotation before publishing
there; nothing written under an older rotation is recovered. Sequence floors
apply to the rotation that is read.

A rotation revokes only a holder of THAT rotation's key, not the tree root: a
holder of the root key can derive every rotation regardless. A caller that
walks forward and finds every relay withholding the true newest rotation's
successor cannot tell that from a vault that never rotated further, so any
caller tracking the highest rotation it has already reached must treat a walk
that lands below it as a rollback, not as ready.

Rotation write order matters. The rotating writer first publishes the merged
state under rotation n + 1 (every chunk, then the checkpoint) and only then
declares `nextRotation` in rotation n. A pointer published first makes reads
`unusable` until rotation n + 1 is complete, because a pointer to a rotation
with no authentic checkpoint is damage. Once any authentic checkpoint-shaped
event exists under rotation n + 1, rotation n is never read: if that event (or
its chunks) is broken, the read is fail-closed `unusable` with no fallback to
rotation n. Recovery walks at most 32 rotations (`MAX_ROTATION_HOPS`); a vault
rotated more often reads `unusable`.

Restore results distinguish absent, unavailable, unusable and ready. Legacy may
be the canonical source only when the vault is absent, never merely because a
relay is offline or a new checkpoint fails to decrypt. A previously observed
sequence is a rollback floor. A fresh device cannot detect a relay withholding
all newer state without another trusted source; do not claim otherwise.

`createVaultRelayReader` queries at most eight `wss://` relays (plain `ws://`
only for `localhost` and `127.0.0.1`, matching `RelayClient`). A checkpoint
query, empty or not, completes only when every queried relay returned EOSE and
none failed: one relay's "nothing" is not evidence of absence, and one relay's
heads may omit a device head that another relay holds. Otherwise the query
throws a `VaultRelayError` whose `failedRelays` names the relays that failed,
and recovery returns `{ state: 'unavailable', failedRelays }`. A permanently
dead configured relay therefore keeps reads `unavailable` until it is removed
from the relay set; that is deliberate, since `unavailable` is safe and a false
`absent` is not. A chunk fetch by exact ID succeeds once any relay returns it
(its hash is pinned by the checkpoint); "not found" again needs every relay.
Each relay's events are re-checked against the requested author, kind, ID and
d-tag, checkpoint queries also drop events without a checkpoint-shaped d-tag,
and duplicates are removed, all before a per-relay cap of 128; a relay over the
cap counts as failed.

The SDK provides stateless read/validation and forward rotation traversal.
Writer scheduling, dataset import and durable canonical markers belong to
consumers. The candidate Signet app implements scheduling and confirmed-copy
state; this does not establish equivalent Sapwood behaviour.
