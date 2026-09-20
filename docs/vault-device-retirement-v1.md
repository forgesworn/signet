# Vault device retirement v1

This additive contract lets the vault authority publish a signed retirement
event for one device from a given sequence onward. Readers that support the
contract reject that device's checkpoint heads at or above the effective
sequence; older readers continue their legacy behaviour and must not be called
retirement-enforcing readers.

The event carries only the vault identifier, device key, effective sequence and
issued timestamp. It does not erase old encrypted history. A recovery reader
must obtain the revocation floor before accepting heads and must report an
unavailable revocation query as unavailable recovery data, never as an empty
vault. A device holding recovery words remains able to derive keys, so this
contract is authority over accepted published heads, not physical key erasure.

Each event uses `d = signet:vault-device-revocation:v1:<vault>:<device>` so
retiring one device cannot replace another device's revocation, including across
vaults controlled by the same authority. The earlier unpublished constant-tag
draft is rejected by the reader: it could retain only one retirement per
authority. This draft wire correction requires compatibility review before any
release. Readers still need durable replay floors and independent authority
validation; this address change does not implement recovery discovery or UI.

## Enforcement API (PR 330 correction, unpublished)

`isVaultDeviceRetired(events, { vault, authority, device, sequence, now })`
requires original signed events and explicit trusted scope. `readVaultHeads`
accepts `retirement: { authority, now, events }`; the vault is its required
checkpoint `author`. Learn the authority from trusted recovery configuration,
not from a relay's event. A parsed `VaultDeviceRevocation` is display data, not
proof of authority. TypeScript branding alone would not protect JavaScript or
deserialised input, so the enforcement boundary verifies signatures at runtime.

Valid events for another vault or authority do not retire the queried device.
Malformed, unsigned, future-dated or oversized evidence fails closed. The helper
throws; the recovery API returns `unusable` with reason `retirement`, before any
checkpoint query or decryption. Evidence is bounded to 1,024 events per read.
The earliest authenticated cutoff wins: a subsequent larger cutoff cannot
restore a previously retired sequence. Callers must retain that history.

A head is excluded at or above a listed device's cutoff. If any device in a
legacy multi-device head is retired, reject the entire head, even when a live
device signed its chunks: the manifest does not identify a safe data subset.
The same conservative rule covers retired chunk authors in publisher heads.
Independent live heads can still be returned. Existing rollback floors remain
effective; retirement never silently clears them. All excluded heads produce
`unusable`, not `absent`, so legacy fallback is not enabled.

`readVaultHeadRotations` pins the supplied authority across hops and scopes each
read to that hop's vault author. Once requested, enforcement cannot disappear
on a later hop. Resolver failures remain `unavailable`. Consumers must supply
complete retained and discovered evidence for each rotation before reading.

This intentionally replaces the unpublished unscoped helper signature and
`revokedDevices` option. An old JavaScript `revokedDevices` call fails closed
instead of silently disabling enforcement. These APIs did not exist in published
1.10.1. Omitting `retirement` retains the previous non-enforcing behaviour;
`readVaultSnapshot` and `readVaultRotations` remain non-enforcing APIs. They must
not be used for a consumer that claims retirement support.

An empty evidence list is not proof that the relay withheld nothing. These are
stateless enforcement helpers, not discovery, durable storage, authority bootstrap
or a complete device-retirement product. Those gates remain open.
