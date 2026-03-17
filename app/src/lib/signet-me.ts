// Signet Me — Directional verification using spoken-token
// Each person gets a DIFFERENT word. Prevents the echo attack.
// Uses spoken-token directly (not the audited signet-protocol).

import { deriveDirectionalPair } from 'spoken-token';
import type { TokenEncoding } from 'spoken-token/encoding';
import { WORDLIST } from 'spoken-token/wordlist';

const SIGNET_ME_NAMESPACE = 'signet:me';
const DEFAULT_ROTATION_SECONDS = 30;
const DEFAULT_TOLERANCE = 1;

export interface SignetMeDisplay {
  /** Words I say to prove it's me */
  myWords: string[];
  /** Words I expect to hear from them */
  theirWords: string[];
  /** Seconds until words refresh */
  expiresIn: number;
}

function getCounter(nowMs: number, rotationSeconds: number): number {
  return Math.floor(nowMs / 1000 / rotationSeconds);
}

function makeEncoding(wordCount: number): TokenEncoding {
  return { format: 'words', count: wordCount, wordlist: WORDLIST };
}

/** Get directional words for a Signet Me verification.
 *  Each side sees different words — I say mine, they say theirs. */
export function getSignetMeDisplay(
  sharedSecret: string,
  myPubkey: string,
  theirPubkey: string,
  wordCount: number = 1,
  nowMs?: number,
): SignetMeDisplay {
  const now = nowMs ?? Date.now();
  const counter = getCounter(now, DEFAULT_ROTATION_SECONDS);
  const encoding = makeEncoding(wordCount);

  const pair = deriveDirectionalPair(
    sharedSecret,
    SIGNET_ME_NAMESPACE,
    [myPubkey, theirPubkey],
    counter,
    encoding,
  );

  const myWords = pair[myPubkey].split(' ');
  const theirWords = pair[theirPubkey].split(' ');

  const epochMs = DEFAULT_ROTATION_SECONDS * 1000;
  const msIntoEpoch = now % epochMs;
  const expiresIn = Math.ceil((epochMs - msIntoEpoch) / 1000);

  return { myWords, theirWords, expiresIn };
}

/** Verify that the spoken words match what the other person should say.
 *  Checks current counter +/- tolerance for clock skew. */
export function verifySignetMe(
  sharedSecret: string,
  myPubkey: string,
  theirPubkey: string,
  spokenWords: string[],
  wordCount: number = 1,
  nowMs?: number,
): boolean {
  const now = nowMs ?? Date.now();
  const currentCounter = getCounter(now, DEFAULT_ROTATION_SECONDS);
  const encoding = makeEncoding(wordCount);
  const spokenJoined = spokenWords.map(w => w.toLowerCase().trim()).join(' ');

  for (let offset = -DEFAULT_TOLERANCE; offset <= DEFAULT_TOLERANCE; offset++) {
    const pair = deriveDirectionalPair(
      sharedSecret,
      SIGNET_ME_NAMESPACE,
      [myPubkey, theirPubkey],
      currentCounter + offset,
      encoding,
    );

    // I'm verifying THEIR word — what they should say to me
    if (pair[theirPubkey] === spokenJoined) {
      return true;
    }
  }

  return false;
}
