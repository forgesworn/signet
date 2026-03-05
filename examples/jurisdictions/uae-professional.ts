// Signet Protocol — UAE Professional Example
// Demonstrates identity verification under PDPL (Federal Decree-Law No. 45/2021)
// Jurisdiction: United Arab Emirates (AE)
// Profession: Legal professional licensed by the Ministry of Justice
// Features: UAE data protection, Arabic output, GCC mutual recognition

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
  console.log('=== Signet Protocol — UAE Professional Verification ===\n');

  // --- 1. Jurisdiction lookup ---
  const ae = getJurisdiction('AE');
  if (!ae) throw new Error('AE jurisdiction not found');

  // Arabic output first
  setLanguage('ar');
  console.log(`[Arabic] ${t('credential_professional')}`);
  console.log(getTierDescription(3));
  console.log();

  // English output for detailed information
  setLanguage('en');
  console.log(`Jurisdiction: ${ae.name} (${ae.nameLocal})`);
  console.log(`Legal system: ${ae.legalSystem}`);
  console.log(`Data protection: ${ae.dataProtection.name} - ${ae.dataProtection.fullName}`);
  console.log(`Year enacted: ${ae.dataProtection.year}`);
  console.log(`Supervisory authority: ${ae.dataProtection.supervisoryAuthority}`);
  if (ae.dataProtection.notes) {
    console.log(`Note: ${ae.dataProtection.notes}`);
  }
  console.log();

  // --- 2. Ministry of Justice / DHA lookup ---
  // UAE has different licensing bodies: Ministry of Justice for legal,
  // DHA (Dubai) and DoH (Abu Dhabi) for medical professionals.
  const legalBodies = getProfessionalBodies('AE', 'legal');
  const medicalBodies = getProfessionalBodies('AE', 'medical');

  console.log('Legal professional bodies in UAE:');
  for (const body of legalBodies) {
    console.log(`  - ${body.name}`);
    if (body.nameEn) console.log(`    (${body.nameEn})`);
    console.log(`    Digital credentials: ${body.issuesDigitalCredentials}`);
    if (body.notes) console.log(`    Note: ${body.notes}`);
  }
  console.log();

  console.log('Medical professional bodies in UAE:');
  for (const body of medicalBodies) {
    console.log(`  - ${body.name}`);
    if (body.nameEn) console.log(`    (${body.nameEn})`);
    console.log(`    Digital credentials: ${body.issuesDigitalCredentials}`);
  }
  console.log();

  // --- 3. Generate identities ---
  const professional = generateKeyPair();  // UAE legal professional
  const subject = generateKeyPair();       // Person being verified

  // --- 4. Create Tier 3 credential ---
  console.log('--- Tier 3: Professional Verification ---');

  const credential = await createProfessionalCredential(
    professional.privateKey,
    subject.publicKey,
    {
      profession: 'lawyer',
      jurisdiction: 'AE',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  Signature valid: ${verification.signatureValid}`);
  console.log(`  Tier: ${parsed.tier}, Profession: ${parsed.profession}`);
  console.log(`  Jurisdiction: ${parsed.jurisdiction}`);
  console.log();

  // Arabic credential display
  setLanguage('ar');
  console.log(`[Arabic] ${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log();

  setLanguage('en');

  // --- 5. UAE PDPL compliance check ---
  // The UAE PDPL came into effect in 2021. DIFC and ADGM have their own
  // separate data protection regimes.
  console.log('--- UAE PDPL Compliance Check ---');
  const compliance = checkCredentialCompliance(credential, 'AE');
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

  // --- 6. GCC mutual recognition ---
  // UAE has mutual recognition agreements with GCC member states:
  // Saudi Arabia, Bahrain, Qatar, Kuwait, and Oman.
  console.log('--- GCC Mutual Recognition ---');
  const partners = getMutualRecognitionPartners('AE');
  console.log(`Mutual recognition partners: ${partners.join(', ')}`);
  console.log();

  // Cross-border to Saudi Arabia (GCC partner)
  console.log('--- Cross-border: AE -> SA ---');
  const aeToSa = checkCrossBorderCompliance('AE', 'SA');
  console.log(`Allowed: ${aeToSa.allowed}`);
  if (aeToSa.mechanism) {
    console.log(`Mechanism: ${aeToSa.mechanism}`);
  }
  for (const issue of aeToSa.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // Cross-border to UK (non-GCC)
  console.log('--- Cross-border: AE -> GB ---');
  const aeToGb = checkCrossBorderCompliance('AE', 'GB');
  console.log(`Allowed: ${aeToGb.allowed}`);
  if (aeToGb.mechanism) {
    console.log(`Mechanism: ${aeToGb.mechanism}`);
  }
  for (const issue of aeToGb.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // --- 7. Child protection under Wadeema's Law ---
  // UAE digital consent age is 18 and age of majority is 21.
  // Wadeema's Law provides additional child protection requirements.
  console.log("--- Child Compliance (age 15, AE) — Wadeema's Law ---");
  const childCompliance = checkChildCompliance(15, 'AE');
  console.log(`Compliant: ${childCompliance.compliant}`);
  console.log(`Min consent age: ${childCompliance.minConsentAge}`);
  console.log(`Age of majority: ${childCompliance.ageOfMajority}`);
  console.log(`Parental consent required: ${childCompliance.requiresParentalConsent}`);

  for (const issue of childCompliance.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // --- 8. Signet IQ ---
  console.log('--- Signet IQ ---');
  const trustScore = computeTrustScore(
    subject.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
  );

  setLanguage('en');
  console.log(`[English] ${formatLocalizedTrustScore(trustScore.score)}`);
  setLanguage('ar');
  console.log(`[Arabic] ${formatLocalizedTrustScore(trustScore.score)}`);

  console.log('\n=== UAE Professional Example Complete ===');
}

main().catch(console.error);
