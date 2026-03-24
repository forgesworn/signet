// Browser shim for node:crypto's randomFillSync
// Used by @forgesworn/shamir-words which imports from node:crypto

export function randomFillSync(buf: Uint8Array): Uint8Array {
  globalThis.crypto.getRandomValues(buf);
  return buf;
}
