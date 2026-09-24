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
 * (U+FEFF). This is a fixed denylist only; it does not cover every Unicode
 * "format" (Cf) or Default_Ignorable code point (variation selectors, emoji
 * tag characters, Hangul fillers, Arabic number-sign marks, deprecated music
 * format controls, ...). Use `isSafeLabel` to validate labels \u2014 it checks
 * this denylist plus those two Unicode categories, carving out only the
 * narrow, positionally-constrained exceptions emoji sequences require.
 */
export const UNSAFE_LABEL_CHARS = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u180e\u200b\u200c\u200e\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/u;

const CF_OR_DEFAULT_IGNORABLE = /[\p{Cf}\p{Default_Ignorable_Code_Point}]/u;
const EXTENDED_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const KEYCAP_BASE = /[#*0-9]/;
const ZWJ = 0x200d;
const VS15 = 0xfe0e, VS16 = 0xfe0f;
const SKIN_TONE_MIN = 0x1f3fb, SKIN_TONE_MAX = 0x1f3ff;
const TAG_CHAR_MIN = 0xe0020, TAG_CHAR_MAX = 0xe007e, TAG_CANCEL = 0xe007f, FLAG_BASE = 0x1f3f4;

/**
 * Whether `codePoints[index]` is "an emoji element" for the zero-width-joiner
 * rule below: an Extended_Pictographic code point itself, or U+FE0F / an
 * emoji skin-tone modifier (U+1F3FB-1F3FF) that directly follows one.
 */
function endsInEmojiElement(codePoints: string[], index: number): boolean {
  if (index < 0) return false;
  const ch = codePoints[index];
  if (EXTENDED_PICTOGRAPHIC.test(ch)) return true;
  const cp = ch.codePointAt(0) as number;
  if (cp !== VS16 && !(cp >= SKIN_TONE_MIN && cp <= SKIN_TONE_MAX)) return false;
  const prev = codePoints[index - 1];
  return prev !== undefined && EXTENDED_PICTOGRAPHIC.test(prev);
}

/**
 * A label is unsafe if it contains any `UNSAFE_LABEL_CHARS` character, or any
 * Unicode format (Cf) or Default_Ignorable_Code_Point code point, EXCEPT the
 * narrow in-context uses emoji sequences need:
 *
 *  1. U+200D (ZWJ) only between two emoji elements: the code point before it
 *     ends in an emoji element (see `endsInEmojiElement`) and the code point
 *     after it is Extended_Pictographic. A leading, trailing or doubled ZWJ,
 *     or one between ordinary letters, is rejected.
 *  2. U+FE0E / U+FE0F (text/emoji variation selectors) only directly after
 *     an Extended_Pictographic code point or a keycap base ([#*0-9]). Every
 *     other variation selector (U+FE00-FE0D, U+E0100-E01EF) is rejected
 *     everywhere.
 *  3. Tag characters U+E0020-E007E only inside a well-formed emoji tag
 *     sequence: U+1F3F4 (waving black flag), one or more U+E0020-E007E, then
 *     the cancel tag U+E007F. U+E0001 and any tag character outside such a
 *     sequence (unterminated, or with no U+1F3F4 base) is rejected.
 *
 * Iterates by code point, not UTF-16 code unit.
 */
export function isSafeLabel(label: string): boolean {
  if (UNSAFE_LABEL_CHARS.test(label)) return false;
  const codePoints = Array.from(label);
  // Indices that are part of a well-formed emoji flag tag sequence: the run
  // of tag characters plus the cancel tag immediately following a U+1F3F4.
  const reservedTagIndex = new Set<number>();
  for (let i = 0; i < codePoints.length; i++) {
    if (codePoints[i].codePointAt(0) !== FLAG_BASE) continue;
    let j = i + 1;
    while (j < codePoints.length) {
      const cp = codePoints[j].codePointAt(0) as number;
      if (cp < TAG_CHAR_MIN || cp > TAG_CHAR_MAX) break;
      j++;
    }
    if (j > i + 1 && j < codePoints.length && codePoints[j].codePointAt(0) === TAG_CANCEL) {
      for (let k = i + 1; k <= j; k++) reservedTagIndex.add(k);
    }
  }
  for (let i = 0; i < codePoints.length; i++) {
    const ch = codePoints[i];
    if (!CF_OR_DEFAULT_IGNORABLE.test(ch)) continue;
    const cp = ch.codePointAt(0) as number;
    if (cp === ZWJ) {
      const next = codePoints[i + 1];
      if (endsInEmojiElement(codePoints, i - 1) && next !== undefined && EXTENDED_PICTOGRAPHIC.test(next)) continue;
      return false;
    }
    if (cp === VS15 || cp === VS16) {
      const prev = codePoints[i - 1];
      if (prev !== undefined && (EXTENDED_PICTOGRAPHIC.test(prev) || KEYCAP_BASE.test(prev))) continue;
      return false;
    }
    if ((cp >= TAG_CHAR_MIN && cp <= TAG_CHAR_MAX) || cp === TAG_CANCEL) {
      if (reservedTagIndex.has(i)) continue;
      return false;
    }
    return false;
  }
  return true;
}
