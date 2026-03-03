// Signet Protocol — UK Solicitor Example
// Demonstrates identity verification under UK GDPR + Age Appropriate Design Code
// Jurisdiction: United Kingdom (GB)
// Profession: Solicitor regulated by the Law Society of England and Wales

import {
  generateKeyPair,
  getJurisdiction,
  getProfessionalBodies,
  createProfessionalCredential,
  createChildSafetyCredential,
  verifyCredential,
  parseCredential,
  checkCredentialCompliance,
  checkChildCompliance,
  getConsentRequirements,
  setLanguage,
  t,
  getTierDescription,
  formatLocalizedTrustScore,
  computeTrustScore,
} from '../../src/index.js';

async function main() {
  console.log('=== Signet Protocol — UK Solicitor Verification ===\n');

  // Set language to English (UK primary language)
  setLanguage('en');

  // --- 1. Look up jurisdiction and professional bodies ---
  const gb = getJurisdiction('GB');
  if (!gb) throw new Error('GB jurisdiction not found');

  console.log(`Jurisdiction: ${gb.name} (${gb.code})`);
  console.log(`Legal system: ${gb.legalSystem}`);
  console.log(`Data protection: ${gb.dataProtection.name}`);
  console.log(`Supervisory authority: ${gb.dataProtection.supervisoryAuthority}`);
  console.log(`e-Signature recognised: ${gb.eSignatureRecognised}`);
  console.log();

  // Look up the Law Society of England and Wales
  const legalBodies = getProfessionalBodies('GB', 'legal');
  console.log('Legal professional bodies in GB:');
  for (const body of legalBodies) {
    console.log(`  - ${body.name}`);
    console.log(`    Public register: ${body.hasPublicRegister}`);
    if (body.registerUrl) {
      console.log(`    Register URL: ${body.registerUrl}`);
    }
  }
  console.log();

  // --- 2. Generate identities ---
  const solicitor = generateKeyPair();  // The verifying solicitor
  const subject = generateKeyPair();    // Person being verified
  const parent = generateKeyPair();     // Parent (for child safety credential)

  // --- 3. Create a Tier 3 professional credential ---
  // Under UK GDPR, explicit consent must be obtained before processing personal data.
  // The solicitor verifies identity in person and issues a Signet credential.
  console.log('--- Tier 3: Professional Verification ---');
  console.log(getTierDescription(3));
  console.log();

  const credential = await createProfessionalCredential(
    solicitor.privateKey,
    subject.publicKey,
    {
      profession: 'solicitor',
      jurisdiction: 'GB',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  Signature valid: ${verification.signatureValid}`);
  console.log(`  Structure valid: ${verification.structureValid}`);
  console.log(`  Tier: ${parsed.tier}, Profession: ${parsed.profession}`);
  console.log(`  Jurisdiction: ${parsed.jurisdiction}`);
  console.log();

  // --- 4. Check compliance with UK regulations ---
  console.log('--- UK GDPR Compliance Check ---');
  const compliance = checkCredentialCompliance(credential, 'GB');
  console.log(`Compliant: ${compliance.compliant}`);

  for (const issue of compliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERROR]'
      : issue.severity === 'warning' ? '[WARN]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
    console.log(`    Regulation: ${issue.regulation}`);
    if (issue.remediation) {
      console.log(`    Remediation: ${issue.remediation}`);
    }
  }
  console.log();

  // --- 5. Consent requirements under UK GDPR ---
  console.log('--- Consent Requirements ---');
  const consent = getConsentRequirements('GB');
  console.log(`Explicit consent required: ${consent.requiresExplicitConsent}`);
  console.log(`Digital consent age: ${consent.consentAge}`);
  console.log(`Parental consent required: ${consent.parentalConsentRequired}`);
  console.log(`Data categories: ${consent.dataCategories.join(', ')}`);
  if (consent.specialCategories.length > 0) {
    console.log(`Special categories: ${consent.specialCategories.join(', ')}`);
  }
  if (consent.notes) {
    console.log(`Note: ${consent.notes}`);
  }
  console.log();

  // --- 6. Child safety credential under UK Age Appropriate Design Code ---
  // The AADC (Children's Code) applies to services likely to be accessed by children.
  // UK digital consent age is 13; below that, verifiable parental consent is required.
  console.log('--- Tier 4: Child Safety (Age Appropriate Design Code) ---');
  console.log(getTierDescription(4));
  console.log();

  const childCredential = await createChildSafetyCredential(
    solicitor.privateKey,
    parent.publicKey,
    {
      profession: 'solicitor',
      jurisdiction: 'GB',
      ageRange: '8-12',
    }
  );

  const childVerification = await verifyCredential(childCredential);
  const childParsed = parseCredential(childCredential)!;

  console.log(`${t('credential_professional_child')}: ${t('status_valid')}`);
  console.log(`  Scope: ${childParsed.scope}, Age range: ${childParsed.ageRange}`);
  console.log(`  Signature valid: ${childVerification.signatureValid}`);
  console.log();

  // Check child compliance for a 10-year-old under UK rules
  console.log('--- Child Compliance Check (age 10, UK) ---');
  const childCompliance = checkChildCompliance(10, 'GB');
  console.log(`Compliant: ${childCompliance.compliant}`);
  console.log(`Min consent age: ${childCompliance.minConsentAge}`);
  console.log(`Age of majority: ${childCompliance.ageOfMajority}`);
  console.log(`Parental consent required: ${childCompliance.requiresParentalConsent}`);

  for (const issue of childCompliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERROR]'
      : issue.severity === 'warning' ? '[WARN]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
  }
  console.log();

  // --- 7. Trust score display ---
  console.log('--- Trust Score ---');
  const trustScore = computeTrustScore(
    subject.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
  );
  console.log(formatLocalizedTrustScore(trustScore.score));

  console.log('\n=== UK Solicitor Example Complete ===');
}

main().catch(console.error);
