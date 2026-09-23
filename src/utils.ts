/** Zero out a Uint8Array buffer (best-effort secure wipe). */
export function zeroBytes(buf: Uint8Array): void {
  buf.fill(0);
}

/**
 * Constant-time comparison of two equal-length Uint8Arrays.
 * Always compares all bytes; does not short-circuit on content.
 *
 * NOTE: The length check IS an early return (not constant-time w.r.t. length),
 * but all callers compare fixed-size buffers (32-byte scalars), so this is safe.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * One character class for text that is shown to people: C0 controls, DEL, C1
 * controls, Arabic letter mark (U+061C), zero-width and LRM/RLM (U+200B-U+200F),
 * line/paragraph separators and bidi embeddings/overrides (U+2028-U+202E), and
 * bidi isolates (U+2066-U+2069). Not global: build a `g` copy to strip.
 */
export const UNSAFE_TEXT_CHARS = /[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028-\u202e\u2066-\u2069]/u;

/**
 * `UNSAFE_TEXT_CHARS` minus U+200D (zero-width joiner), which is not a bidi
 * control and is needed for emoji sequences, plus other invisible/deprecated-
 * format characters a label has no legitimate use for: soft hyphen (U+00AD),
 * Mongolian vowel separator (U+180E), word joiner and the deprecated invisible
 * math operators (U+2060-U+2064), and the BOM / zero width no-break space
 * (U+FEFF). Used to validate labels.
 */
export const UNSAFE_LABEL_CHARS = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u180e\u200b\u200c\u200e\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/u;
