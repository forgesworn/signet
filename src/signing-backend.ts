/**
 * Signing Backend Interface
 *
 * Defines the abstract SigningBackend interface that all signing
 * implementations must conform to. Concrete implementations live
 * in the consuming application (LocalSigningBackend, BunkerSigningBackend,
 * Nip07SigningBackend) because they depend on app-level NIP-44 encryption.
 */

import type { NostrEvent, UnsignedEvent } from './types.js';

/** Signing mode for backend type discrimination. */
export type SigningMode = 'local' | 'bunker' | 'nip07';

/**
 * Abstract signing backend interface.
 *
 * All signing operations go through this interface. The protocol library
 * defines the contract; the application provides concrete implementations.
 */
export interface SigningBackend {
  readonly type: SigningMode;
  activePublicKeyHex: string;

  signEvent(event: UnsignedEvent): Promise<NostrEvent>;
  nip44Encrypt(recipientPubkey: string, plaintext: string): Promise<string>;

  destroy(): void;
}
