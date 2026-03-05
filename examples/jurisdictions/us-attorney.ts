// Signet Protocol — US Attorney Example
// Demonstrates identity verification under CCPA/COPPA
// Jurisdiction: United States (US)
// Profession: Attorney — licensing is state-level via bar associations

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
  console.log('=== Signet Protocol — US Attorney Verification ===\n');

  // --- 1. Jurisdiction lookup ---
  const us = getJurisdiction('US');
  if (!us) throw new Error('US jurisdiction not found');

  console.log(`Jurisdiction: ${us.name} (${us.code})`);
  console.log(`Legal system: ${us.legalSystem}`);
  console.log(`Data protection: ${us.dataProtection.name}`);
  console.log(`Note: ${us.dataProtection.notes}`);
  console.log(`Supervisory authority: ${us.dataProtection.supervisoryAuthority}`);
  console.log();

  // State-level bar association lookup
  // In the US, attorney licensing is handled by individual state bars.
  // The ABA accredits law schools but does not license attorneys.
  const legalBodies = getProfessionalBodies('US', 'legal');
  console.log('Legal professional bodies in US:');
  for (const body of legalBodies) {
    console.log(`  - ${body.name}`);
    if (body.notes) console.log(`    Note: ${body.notes}`);
  }
  console.log();

  // --- 2. Generate identities ---
  const attorney = generateKeyPair();   // The verifying attorney
  const subject = generateKeyPair();    // Person being verified
  const child = generateKeyPair();      // Child subject (for COPPA check)

  // --- 3. English output: Create Tier 3 credential ---
  setLanguage('en');
  console.log('--- [English] Tier 3: Professional Verification ---');
  console.log(getTierDescription(3));
  console.log();

  const credential = await createProfessionalCredential(
    attorney.privateKey,
    subject.publicKey,
    {
      profession: 'attorney',
      jurisdiction: 'US',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  Signature valid: ${verification.signatureValid}`);
  console.log(`  Tier: ${parsed.tier}, Profession: ${parsed.profession}`);
  console.log(`  Jurisdiction: ${parsed.jurisdiction}`);
  console.log();

  // --- 4. Spanish output (bilingual) ---
  // The US has a significant Spanish-speaking population. Signet supports
  // bilingual output for accessibility and regulatory compliance.
  setLanguage('es');
  console.log('--- [Espanol] Nivel 3: Verificacion Profesional ---');
  console.log(getTierDescription(3));
  console.log();

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  Firma valida: ${verification.signatureValid}`);
  console.log(`  Nivel: ${parsed.tier}, Profesion: ${parsed.profession}`);
  console.log();

  // Switch back to English for the rest
  setLanguage('en');

  // --- 5. CCPA/CPRA compliance check ---
  console.log('--- CCPA/CPRA Compliance Check ---');
  const compliance = checkCredentialCompliance(credential, 'US');
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

  // --- 6. COPPA child compliance check ---
  // COPPA requires verifiable parental consent before collecting data from
  // children under 13. The FTC strictly enforces this.
  console.log('--- COPPA Child Compliance (age 11) ---');
  const childCompliance = checkChildCompliance(11, 'US');
  console.log(`Compliant: ${childCompliance.compliant}`);
  console.log(`Min consent age: ${childCompliance.minConsentAge}`);
  console.log(`Parental consent required: ${childCompliance.requiresParentalConsent}`);

  for (const issue of childCompliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERROR]'
      : issue.severity === 'warning' ? '[WARN]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
    if (issue.remediation) {
      console.log(`    Remediation: ${issue.remediation}`);
    }
  }
  console.log();

  // Also check a 14-year-old (above COPPA threshold but still a minor)
  console.log('--- COPPA Child Compliance (age 14) ---');
  const teenCompliance = checkChildCompliance(14, 'US');
  console.log(`Compliant: ${teenCompliance.compliant}`);
  console.log(`Parental consent required: ${teenCompliance.requiresParentalConsent}`);
  console.log();

  // --- 7. Consent requirements ---
  console.log('--- US Consent Requirements ---');
  const consent = getConsentRequirements('US');
  // Note: US does not require explicit consent at the federal level (unlike GDPR).
  // CCPA provides opt-out rights rather than opt-in consent.
  console.log(`Explicit consent required: ${consent.requiresExplicitConsent}`);
  console.log(`Digital consent age: ${consent.consentAge}`);
  console.log(`Data categories: ${consent.dataCategories.join(', ')}`);
  console.log();

  // --- 8. Signet IQ ---
  console.log('--- Signet IQ ---');
  const trustScore = computeTrustScore(
    subject.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 2 * 365 * 24 * 60 * 60
  );
  console.log(formatLocalizedTrustScore(trustScore.score));

  console.log('\n=== US Attorney Example Complete ===');
}

main().catch(console.error);
