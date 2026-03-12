/** Base error for all Signet protocol errors */
export class SignetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignetError';
  }
}

/** Validation errors (malformed events, missing fields, bounds exceeded) */
export class SignetValidationError extends SignetError {
  constructor(message: string) {
    super(message);
    this.name = 'SignetValidationError';
  }
}

/** Cryptographic errors (invalid keys, failed verification, bad proofs) */
export class SignetCryptoError extends SignetError {
  constructor(message: string) {
    super(message);
    this.name = 'SignetCryptoError';
  }
}

/** Election/voting errors (election not open, voter not eligible, etc.) */
export class SignetVotingError extends SignetError {
  constructor(message: string) {
    super(message);
    this.name = 'SignetVotingError';
  }
}
