import { describe, it, expect } from 'vitest';
import { zeroBytes, constantTimeEqual, isSafeLabel } from '../src/utils.js';

describe('zeroBytes', () => {
  it('fills a Uint8Array with zeros', () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5]);
    zeroBytes(buf);
    expect(buf).toEqual(new Uint8Array(5));
  });

  it('handles empty array', () => {
    const buf = new Uint8Array(0);
    zeroBytes(buf);
    expect(buf.length).toBe(0);
  });
});

describe('constantTimeEqual', () => {
  it('returns true for equal arrays', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it('returns false for different arrays', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 4]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it('returns false for different lengths', () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([1, 2, 3]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it('handles empty arrays', () => {
    const a = new Uint8Array(0);
    const b = new Uint8Array(0);
    expect(constantTimeEqual(a, b)).toBe(true);
  });
});

describe('isSafeLabel', () => {
  // RGI UK subdivision emoji flag tag sequences: U+1F3F4 + the tag-character
  // spelling of the ISO 3166-2 code + the cancel tag U+E007F.
  const flagTagSequence = (code: string) =>
    `\u{1F3F4}${Array.from(code, ch => String.fromCodePoint(0xe0000 + (ch.codePointAt(0) as number))).join('')}\u{E007F}`;
  const england = flagTagSequence('gbeng');
  const scotland = flagTagSequence('gbsct');
  const wales = flagTagSequence('gbwls');

  const accept = [
    ['plain ascii', 'Home bot'],
    ['latin with diacritic', 'café'],
    ['CJK', '日本語'],
    ['ZWJ family sequence', '\u{1F468}‍\u{1F469}‍\u{1F467}'],
    ['flag + VS16 + ZWJ + rainbow', '\u{1F3F3}\u{FE0F}‍\u{1F308}'],
    ['emoji + skin tone modifier', '\u{1F44B}\u{1F3FD}'],
    ['emoji + VS16', '\u{2764}\u{FE0F}'],
    ['keycap sequence (digit)', '1\u{FE0F}\u{20E3}'],
    ['keycap sequence (hash)', '#\u{FE0F}\u{20E3}'],
    ['keycap sequence (asterisk)', '*\u{FE0F}\u{20E3}'],
    ['flag tag sequence (England)', england],
    ['flag tag sequence (Scotland)', scotland],
    ['flag tag sequence (Wales)', wales],
    ['trans flag (flag + VS16 + ZWJ + symbol + VS16)', '\u{1F3F3}\u{FE0F}‍\u{26A7}\u{FE0F}'],
    ['eye in speech bubble (EP + VS16 + ZWJ + EP + VS16)', '\u{1F441}\u{FE0F}‍\u{1F5E8}\u{FE0F}'],
    ['Arabic', 'بوت'],
    ['Hebrew', 'בוט'],
  ] as const;

  it.each(accept)('accepts %s', (_name, label) => {
    expect(isSafeLabel(label)).toBe(true);
  });

  // One representative code point per range/set named in the spec, each
  // embedded between two ordinary letters.
  const rejectedCodePoints = [
    ['U+206A (inhibit symmetric swapping)', 0x206a],
    ['U+206F (nominal digit shapes)', 0x206f],
    ['U+115F (Hangul choseong filler)', 0x115f],
    ['U+1160 (Hangul jungseong filler)', 0x1160],
    ['U+3164 (Hangul filler)', 0x3164],
    ['U+FFA0 (halfwidth Hangul filler)', 0xffa0],
    ['U+034F (combining grapheme joiner)', 0x034f],
    ['U+17B4 (Khmer inherent aq)', 0x17b4],
    ['U+17B5 (Khmer inherent aa)', 0x17b5],
    ['U+180B (Mongolian FVS1)', 0x180b],
    ['U+180F (Mongolian FVS4)', 0x180f],
    ['U+FFF9 (interlinear annotation anchor)', 0xfff9],
    ['U+FFFB (interlinear annotation terminator)', 0xfffb],
    ['U+0600 (Arabic number sign)', 0x0600],
    ['U+0605 (Arabic number mark above)', 0x0605],
    ['U+06DD (Arabic end of ayah)', 0x06dd],
    ['U+1BCA0 (shorthand format letter overlap)', 0x1bca0],
    ['U+1BCA3 (shorthand format up step)', 0x1bca3],
    ['U+1D173 (musical symbol begin beam)', 0x1d173],
    ['U+1D17A (musical symbol end phrase)', 0x1d17a],
  ] as const;

  it.each(rejectedCodePoints)('rejects %s', (_name, cp) => {
    expect(isSafeLabel(`a${String.fromCodePoint(cp)}b`)).toBe(false);
  });

  const rejectedContexts = [
    ['bare VS00 (U+FE00) after a plain letter', `a${String.fromCodePoint(0xfe00)}b`],
    ['VS16 (U+FE0F) after a plain letter', 'a\u{FE0F}b'],
    ['ZWJ between two plain letters', 'a‍b'],
    ['leading ZWJ before an emoji', '‍\u{1F916}'],
    ['trailing ZWJ after an emoji', '\u{1F916}‍'],
    ['flag tag run with no cancel tag', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}'],
    ['a lone cancel tag', 'a\u{E007F}b'],
    ['tag characters with no flag base', 'a\u{E0067}\u{E0062}\u{E007F}b'],
    ['flag base + hidden-payload tag sequence', `\u{1F3F4}${Array.from('secretpayload', ch => String.fromCodePoint(0xe0000 + (ch.codePointAt(0) as number))).join('')}\u{E007F}`],
    ['flag base + single space tag + cancel', '\u{1F3F4}\u{E0020}\u{E007F}'],
    ['flag base + cancel with no tag run at all', '\u{1F3F4}\u{E007F}'],
    ['a well-shaped but non-RGI subdivision code (usca)', `\u{1F3F4}${Array.from('usca', ch => String.fromCodePoint(0xe0000 + (ch.codePointAt(0) as number))).join('')}\u{E007F}`],
    ['a complete flag tag sequence followed by ZWJ', `${scotland}‍\u{1F308}`],
    ['a lone E0100 variation selector supplement', 'a\u{E0100}b'],
    ['a tag-plane character below the tag-char range (U+E0080)', 'a\u{E0080}b'],
    ['an unpaired high surrogate', 'a\uD800b'],
    ['a lone low surrogate', 'a\uDC00b'],
  ] as const;

  it.each(rejectedContexts)('rejects %s', (_name, label) => {
    expect(isSafeLabel(label)).toBe(false);
  });

  it('rejects the doubled and out-of-sequence ZWJ shapes on top of the reject table', () => {
    expect(isSafeLabel('a‍‍b')).toBe(false);
    expect(isSafeLabel('‍')).toBe(false);
  });
});
