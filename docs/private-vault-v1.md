# Private vault checkpoint v1 (staged, not released)

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
heads instead of dropping devices; device retirement/compaction is future work. Readers
verify signatures, scope, bounds, sequence, every chunk and the revision before
returning any data. Missing chunks never mean an empty dataset.

All events use existing kind 30078. Each installation retains its own checkpoint under
`vaultCheckpointTag(author, publisherDevicePubkey)`;
chunks use a content-derived tag and are fetched by exact event ID. This reuses
the existing event kind rather than allocating a new kind. Content-addressed
chunk replacement cannot alter an already signed checkpoint reference. No public
tags name the dataset or connect device chunks to the vault author. Routing tags
are opaque, not secret: knowing a vault pubkey lets an observer compute its tag.

Checkpoint plaintext shape is exported as `VaultCheckpoint`. It contains purpose,
rotation, sequence, revision, authorised device pubkeys and ordered chunk refs.
`nextRotation` is optional and forward-only; recovery begins at zero. A rotation
must not become canonical before the new copy is fetched, decrypted and verified.

Restore results distinguish absent, unavailable, unusable and ready. Legacy may
be the canonical source only when the vault is absent, never merely because a
relay is offline or a new checkpoint fails to decrypt. A previously observed
sequence is a rollback floor. A fresh device cannot detect a relay withholding
all newer state without another trusted source; do not claim otherwise.

Current helpers are read/validation foundations. Writer scheduling, rotation
traversal, dataset import and durable canonical markers are subsequent stages.
