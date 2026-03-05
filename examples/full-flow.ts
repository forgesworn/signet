// Signet Protocol — Full Flow Example
// Demonstrates all 4 tiers, Signet IQ, policy enforcement, and verifier lifecycle

import {
  generateKeyPair,
  // Credentials
  createSelfDeclaredCredential,
  createPeerVouchedCredential,
  createProfessionalCredential,
  createChildSafetyCredential,
  verifyCredential,
  parseCredential,
  // Vouches
  createVouch,
  hasEnoughVouches,
  // Signet IQ
  computeTrustScore,
  formatTrustDisplay,
  // Policies
  createPolicy,
  PolicyChecker,
  // Verifiers
  createVerifierCredential,
  checkCrossVerification,
  isVerifierRevoked,
  // Challenges
  createChallenge,
  createRevocation,
  // Merkle
  MerkleTree,
  verifySelectiveDisclosure,
} from '../src/index.js';

async function main() {
  console.log('=== Signet Protocol — Full Flow Demo ===\n');

  // --- 1. Generate identities ---
  const alice = generateKeyPair();    // Regular user
  const bob = generateKeyPair();      // Regular user
  const carol = generateKeyPair();    // Regular user
  const dave = generateKeyPair();     // Regular user
  const emma = generateKeyPair();     // Parent
  const lawyer = generateKeyPair();   // Professional verifier (solicitor)
  const doctor = generateKeyPair();   // Professional verifier (doctor)
  const notary = generateKeyPair();   // Professional verifier (notary)
  const operator = generateKeyPair(); // Community operator

  console.log('--- Tier 1: Self-Declared ---');
  const aliceSelfCred = await createSelfDeclaredCredential(alice.privateKey);
  const verification = await verifyCredential(aliceSelfCred);
  console.log(`Alice self-declares: sig=${verification.signatureValid}, valid=${verification.structureValid}`);
  console.log(`  Tier: ${parseCredential(aliceSelfCred)!.tier}, Type: ${parseCredential(aliceSelfCred)!.type}\n`);

  // --- 2. Web-of-Trust Vouching (Tier 2) ---
  console.log('--- Tier 2: Web-of-Trust ---');

  // Bob, Carol, Dave vouch for Alice (met at a Bitcoin meetup)
  const vouches = await Promise.all([
    createVouch(bob.privateKey, {
      subjectPubkey: alice.publicKey,
      method: 'in-person',
      context: 'bitcoin-meetup-london',
      voucherTier: 2,
      voucherScore: 60,
    }),
    createVouch(carol.privateKey, {
      subjectPubkey: alice.publicKey,
      method: 'in-person',
      context: 'bitcoin-meetup-london',
      voucherTier: 2,
      voucherScore: 55,
    }),
    createVouch(dave.privateKey, {
      subjectPubkey: alice.publicKey,
      method: 'online',
      voucherTier: 2,
      voucherScore: 45,
    }),
  ]);

  const enough = hasEnoughVouches(vouches, alice.publicKey);
  console.log(`Alice has enough vouches for Tier 2: ${enough}`); // true (3 vouches, threshold = 3)

  // Issue Tier 2 credential
  const aliceTier2 = await createPeerVouchedCredential(operator.privateKey, alice.publicKey);
  console.log(`Alice promoted to Tier 2: ${parseCredential(aliceTier2)!.tier}\n`);

  // --- 3. Professional Verifier Setup ---
  console.log('--- Verifier Registration ---');

  const lawyerCred = await createVerifierCredential(lawyer.privateKey, {
    profession: 'solicitor',
    jurisdiction: 'UK',
    licenceHash: 'sha256_of_sra_number_12345',
    professionalBody: 'Law Society of England and Wales',
    statement: 'Available for Signet identity verification in London',
  });

  const doctorCred = await createVerifierCredential(doctor.privateKey, {
    profession: 'doctor',
    jurisdiction: 'UK',
    licenceHash: 'sha256_of_gmc_number_67890',
    professionalBody: 'General Medical Council',
  });

  const notaryCred = await createVerifierCredential(notary.privateKey, {
    profession: 'notary',
    jurisdiction: 'UK',
    licenceHash: 'sha256_of_notary_commission_11111',
    professionalBody: 'Notaries Society',
  });

  // Cross-verify: doctor and notary both vouch for the lawyer (2 different professions)
  const crossVouches = await Promise.all([
    createVouch(doctor.privateKey, {
      subjectPubkey: lawyer.publicKey,
      method: 'in-person',
      voucherTier: 3,
      voucherScore: 90,
    }),
    createVouch(notary.privateKey, {
      subjectPubkey: lawyer.publicKey,
      method: 'in-person',
      voucherTier: 3,
      voucherScore: 85,
    }),
  ]);

  const lawyerActivation = checkCrossVerification(
    lawyer.publicKey,
    crossVouches,
    [lawyerCred, doctorCred, notaryCred]
  );
  console.log(`Lawyer activated: ${lawyerActivation.activated}`);
  console.log(`  Vouches: ${lawyerActivation.vouchCount}, Professions: ${lawyerActivation.professions.join(', ')}\n`);

  // --- 4. Professional Verification (Tier 3) ---
  console.log('--- Tier 3: Professional Verification ---');

  const aliceTier3 = await createProfessionalCredential(lawyer.privateKey, alice.publicKey, {
    profession: 'solicitor',
    jurisdiction: 'UK',
    proofBlob: '(ZKP proof would go here)',
  });

  const tier3Result = await verifyCredential(aliceTier3);
  console.log(`Alice Tier 3: sig=${tier3Result.signatureValid}, valid=${tier3Result.structureValid}`);
  console.log(`  Parsed: tier=${parseCredential(aliceTier3)!.tier}, profession=${parseCredential(aliceTier3)!.profession}\n`);

  // --- 5. Child Safety (Tier 4) ---
  console.log('--- Tier 4: Child Safety ---');

  const emmaTier4 = await createChildSafetyCredential(lawyer.privateKey, emma.publicKey, {
    profession: 'solicitor',
    jurisdiction: 'UK',
    ageRange: '8-12',
    proofBlob: '(Bulletproof range proof would go here)',
  });

  const tier4Result = await verifyCredential(emmaTier4);
  const parsed4 = parseCredential(emmaTier4)!;
  console.log(`Emma Tier 4: sig=${tier4Result.signatureValid}, valid=${tier4Result.structureValid}`);
  console.log(`  Scope: ${parsed4.scope}, Age range: ${parsed4.ageRange}\n`);

  // --- 6. Signet IQ ---
  console.log('--- Signet IQ ---');

  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  const aliceScore = computeTrustScore(
    alice.publicKey,
    [aliceSelfCred, aliceTier2, aliceTier3],
    vouches,
    oneYearAgo
  );

  console.log(formatTrustDisplay(aliceScore));
  console.log();

  // --- 7. Selective Disclosure (Merkle) ---
  console.log('--- Selective Disclosure ---');

  const tree = new MerkleTree({
    tier: '3',
    type: 'professional',
    scope: 'adult',
    profession: 'solicitor',
    jurisdiction: 'UK',
    method: 'in-person-id',
    subject: alice.publicKey,
  });

  // Alice only reveals tier and jurisdiction
  const disclosure = tree.disclose(['tier', 'jurisdiction']);
  console.log(`Merkle root: ${tree.getRoot().slice(0, 16)}...`);
  console.log(`Revealed: ${JSON.stringify(disclosure.revealedAttributes)}`);
  console.log(`Disclosure valid: ${verifySelectiveDisclosure(disclosure)}\n`);

  // --- 8. Community Policy ---
  console.log('--- Policy Enforcement ---');

  const policyEvent = await createPolicy(operator.privateKey, {
    communityId: 'safe-kids-learning',
    adultMinTier: 3,
    childMinTier: 4,
    enforcement: 'both',
    minScore: 50,
    modMinTier: 3,
    verifierBond: 100000,
    revocationThreshold: 5,
    description: 'Maximum safety space for children',
  });

  const checker = new PolicyChecker(policyEvent);

  console.log(`Alice (Tier 3, score ${aliceScore.score}) as adult: ${checker.checkAdult(3, aliceScore.score).allowed}`);
  console.log(`Emma (Tier 4, score 60) as child account: ${checker.checkChild(4, 60).allowed}`);
  console.log(`Bob (Tier 2, score 40) as adult: ${checker.checkAdult(2, 40).allowed}`);

  const bobResult = checker.checkAdult(2, 40);
  if (!bobResult.allowed) {
    console.log(`  Reason: ${bobResult.reason}`);
  }
  console.log();

  // --- 9. Challenge & Revocation ---
  console.log('--- Challenge & Revocation ---');

  const rogue = generateKeyPair();
  const rogueCred = await createVerifierCredential(rogue.privateKey, {
    profession: 'solicitor',
    jurisdiction: 'UK',
    licenceHash: 'fake_licence',
    professionalBody: 'Law Society',
  });

  const challenge = await createChallenge(alice.privateKey, {
    verifierPubkey: rogue.publicKey,
    reason: 'registry-mismatch',
    evidenceType: 'registry-screenshot',
    reporterTier: 3,
    evidence: 'SRA lookup: licence number not found in registry',
  });
  console.log(`Challenge filed against rogue verifier`);

  const revocation = await createRevocation(operator.privateKey, {
    verifierPubkey: rogue.publicKey,
    challengeEventId: challenge.id,
    confirmations: 7,
    bondAction: 'slashed',
    scope: 'full',
    effectiveAt: Math.floor(Date.now() / 1000),
    summary: 'Licence number confirmed fake via SRA registry check',
  });
  console.log(`Revocation issued: ${isVerifierRevoked(rogue.publicKey, [revocation])}`);
  console.log();

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
