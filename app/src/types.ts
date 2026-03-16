// My Signet Family App — Types

export interface FamilyIdentity {
  /** Pubkey — primary key */
  id: string;
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  displayName: string;
  isChild: boolean;
  guardianPubkey?: string;
  ageRange?: string;
  createdAt: number;
  /** Whether privateKey and mnemonic are encrypted with encryptSecret(). Defaults to false for backwards compatibility. */
  encrypted?: boolean;
}

export interface FamilyMember {
  /** Their pubkey — primary key */
  pubkey: string;
  /** Which of our accounts owns this connection */
  ownerPubkey: string;
  displayName: string;
  /** ECDH shared secret for Signet Me words */
  sharedSecret: string;
  /** When we verified them */
  verifiedAt: number;
  /** Optional relationship label */
  relationship?: 'parent' | 'child' | 'sibling' | 'grandparent' | 'partner' | 'other';
  isChild?: boolean;
}

export interface ChildSettings {
  /** Child's pubkey — primary key */
  childPubkey: string;
  guardianPubkey: string;
  contactPolicy: 'family-only' | 'approved' | 'open';
  approvedContacts?: string[];
}

/** Verification security tier — controls word count in Signet Me */
export type SecurityTier = 'basic' | 'standard' | 'expert';

/** Maps tier names to word count per side */
export const TIER_WORD_COUNT: Record<SecurityTier, number> = {
  basic: 1,
  standard: 2,
  expert: 3,
};

export interface AppPreferences {
  id: string;
  theme: 'system' | 'light' | 'dark';
  activeAccountId?: string;
  /** Verification security tier (default: basic) */
  securityTier?: SecurityTier;
}

export type Page = 'home' | 'family' | 'add' | 'member-detail' | 'settings' | 'child-settings';
