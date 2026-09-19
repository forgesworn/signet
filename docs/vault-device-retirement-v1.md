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
