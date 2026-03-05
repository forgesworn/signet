// Signet Protocol — Japanese Notary Example
// Demonstrates identity verification under APPI (Act on the Protection of Personal Information)
// Jurisdiction: Japan (JP)
// Profession: Notary regulated by the Japan National Notaries Association
// Features: APPI compliance, cross-border transfer to Korea (adequacy), Japanese output

import {
  generateKeyPair,
  getJurisdiction,
  getProfessionalBodies,
  getMutualRecognitionPartners,
  createProfessionalCredential,
  verifyCredential,
  parseCredential,
  checkCredentialCompliance,
  checkCrossBorderCompliance,
  checkChildCompliance,
  getConsentRequirements,
  setLanguage,
  t,
  getTierDescription,
  formatLocalizedTrustScore,
  computeTrustScore,
} from '../../src/index.js';

async function main() {
  console.log('=== Signet Protocol -- Japanese Notary Verification ===\n');

  // Set language to Japanese
  setLanguage('ja');

  // --- 1. Jurisdiction and professional body lookup ---
  const jp = getJurisdiction('JP');
  if (!jp) throw new Error('JP jurisdiction not found');

  console.log(`[JP] ${jp.nameLocal} (${jp.name})`);
  console.log(`Legal system: ${jp.legalSystem}`);
  console.log(`Data protection: ${jp.dataProtection.name} - ${jp.dataProtection.fullName}`);
  console.log(`Supervisory authority: ${jp.dataProtection.supervisoryAuthority}`);
  if (jp.dataProtection.notes) {
    console.log(`Note: ${jp.dataProtection.notes}`);
  }
  console.log();

  // Look up the Japan National Notaries Association
  const notaryBodies = getProfessionalBodies('JP', 'notary');
  console.log('Notary professional bodies:');
  for (const body of notaryBodies) {
    console.log(`  - ${body.name}`);
    if (body.nameEn) console.log(`    (${body.nameEn})`);
    console.log(`    Website: ${body.website}`);
    console.log(`    Public register: ${body.hasPublicRegister}`);
  }
  console.log();

  // --- 2. Generate identities ---
  const notary = generateKeyPair();    // The verifying notary
  const subject = generateKeyPair();   // Person being verified

  // --- 3. Create Tier 3 credential (Japanese output) ---
  console.log(`--- ${t('tier_3')}: ${t('credential_professional')} ---`);
  console.log(getTierDescription(3));
  console.log();

  const credential = await createProfessionalCredential(
    notary.privateKey,
    subject.publicKey,
    {
      profession: 'notary',
      jurisdiction: 'JP',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log(`  Tier: ${parsed.tier}, Profession: ${parsed.profession}`);
  console.log(`  Jurisdiction: ${parsed.jurisdiction}`);
  console.log();

  // --- 4. APPI compliance check ---
  // Japan's APPI was significantly amended in 2022 with stricter cross-border
  // transfer rules and mandatory breach notification within 72 hours.
  console.log('--- APPI Compliance Check ---');
  const compliance = checkCredentialCompliance(credential, 'JP');
  console.log(`Compliant: ${compliance.compliant}`);

  for (const issue of compliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERROR]'
      : issue.severity === 'warning' ? '[WARN]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
    console.log(`    Regulation: ${issue.regulation}`);
    if (issue.remediation) {
      console.log(`    Action: ${issue.remediation}`);
    }
  }
  console.log();

  // --- 5. Cross-border transfer to South Korea ---
  // Japan and South Korea both have EU adequacy decisions, and maintain mutual
  // recognition for professional credentials and data transfers.
  console.log('--- Cross-border transfer: JP -> KR ---');
  const jpToKr = checkCrossBorderCompliance('JP', 'KR');
  console.log(`Allowed: ${jpToKr.allowed}`);
  if (jpToKr.mechanism) {
    console.log(`Mechanism: ${jpToKr.mechanism}`);
  }

  for (const issue of jpToKr.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // Mutual recognition partners
  const partners = getMutualRecognitionPartners('JP');
  console.log(`Mutual recognition partners: ${partners.join(', ')}`);
  console.log();

  // --- 6. Child compliance under APPI + Child Welfare Act ---
  // Japan's digital consent age is 15. Below that, parental consent is required.
  console.log('--- Child compliance (age 12, JP) ---');
  const childCompliance = checkChildCompliance(12, 'JP');
  console.log(`Compliant: ${childCompliance.compliant}`);
  console.log(`Min consent age: ${childCompliance.minConsentAge}`);
  console.log(`Age of majority: ${childCompliance.ageOfMajority}`);
  console.log(`Parental consent required: ${childCompliance.requiresParentalConsent}`);

  for (const issue of childCompliance.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // --- 7. Consent requirements ---
  console.log('--- Consent requirements ---');
  const consent = getConsentRequirements('JP');
  console.log(`Explicit consent required: ${consent.requiresExplicitConsent}`);
  console.log(`Digital consent age: ${consent.consentAge}`);
  console.log(`Data categories: ${consent.dataCategories.join(', ')}`);
  console.log();

  // --- 8. Signet IQ (Japanese output) ---
  console.log(`--- ${t('msg_signet_iq')} ---`);
  const trustScore = computeTrustScore(
    subject.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
  );
  console.log(formatLocalizedTrustScore(trustScore.score));

  console.log('\n=== Japanese Notary Example Complete ===');
}

main().catch(console.error);
