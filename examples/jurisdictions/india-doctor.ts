// Signet Protocol — Indian Doctor Example
// Demonstrates identity verification under DPDPA 2023
// Jurisdiction: India (IN)
// Profession: Doctor regulated by the National Medical Commission (NMC)
// Features: DPDPA compliance, cross-border considerations, Hindi + English bilingual

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
  console.log('=== Signet Protocol — Indian Doctor Verification ===\n');

  // --- 1. Jurisdiction and NMC lookup ---
  const india = getJurisdiction('IN');
  if (!india) throw new Error('IN jurisdiction not found');

  // Hindi output first
  setLanguage('hi');
  console.log(`[Hindi] ${t('credential_professional')}`);
  console.log(getTierDescription(3));
  console.log();

  // Switch to English for detailed output
  setLanguage('en');
  console.log(`Jurisdiction: ${india.name} (${india.nameLocal})`);
  console.log(`Legal system: ${india.legalSystem}`);
  console.log(`Data protection: ${india.dataProtection.name} - ${india.dataProtection.fullName}`);
  console.log(`Year enacted: ${india.dataProtection.year}`);
  console.log(`Supervisory authority: ${india.dataProtection.supervisoryAuthority}`);
  if (india.dataProtection.notes) {
    console.log(`Note: ${india.dataProtection.notes}`);
  }
  if (india.notes) {
    console.log(`Additional: ${india.notes}`);
  }
  console.log();

  // Look up the National Medical Commission
  // NMC replaced the Medical Council of India in 2020
  const medicalBodies = getProfessionalBodies('IN', 'medical');
  console.log('Medical professional bodies in India:');
  for (const body of medicalBodies) {
    console.log(`  - ${body.name}`);
    console.log(`    Website: ${body.website}`);
    console.log(`    Public register: ${body.hasPublicRegister}`);
    if (body.registerUrl) {
      console.log(`    Register URL: ${body.registerUrl}`);
    }
    if (body.notes) {
      console.log(`    Note: ${body.notes}`);
    }
  }
  console.log();

  // --- 2. Generate identities ---
  const doctor = generateKeyPair();    // The verifying doctor
  const patient = generateKeyPair();   // Person being verified

  // --- 3. Create Tier 3 credential ---
  // Under DPDPA 2023, explicit consent is required before processing personal data.
  // India's Aadhaar system provides national digital identity infrastructure.
  console.log('--- Tier 3: Professional Verification ---');
  console.log(getTierDescription(3));
  console.log();

  const credential = await createProfessionalCredential(
    doctor.privateKey,
    patient.publicKey,
    {
      profession: 'doctor',
      jurisdiction: 'IN',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  // English output
  console.log(`[English] ${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  Signature valid: ${verification.signatureValid}`);
  console.log(`  Tier: ${parsed.tier}, Profession: ${parsed.profession}`);
  console.log(`  Jurisdiction: ${parsed.jurisdiction}`);
  console.log();

  // Hindi output
  setLanguage('hi');
  console.log(`[Hindi] ${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log();

  setLanguage('en');

  // --- 4. DPDPA 2023 compliance check ---
  // The DPDPA 2023 replaces the IT Act 2000 data protection provisions.
  // Full enforcement is still pending — rules are being phased in.
  console.log('--- DPDPA 2023 Compliance Check ---');
  const compliance = checkCredentialCompliance(credential, 'IN');
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

  // --- 5. Cross-border considerations ---
  // DPDPA 2023 may restrict transfers to certain jurisdictions via government
  // notification. India has mutual recognition with Singapore and the UK.
  console.log('--- Cross-border: IN -> SG ---');
  const inToSg = checkCrossBorderCompliance('IN', 'SG');
  console.log(`Allowed: ${inToSg.allowed}`);
  if (inToSg.mechanism) {
    console.log(`Mechanism: ${inToSg.mechanism}`);
  }

  for (const issue of inToSg.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
    if (issue.remediation) {
      console.log(`    Remediation: ${issue.remediation}`);
    }
  }
  console.log();

  console.log('--- Cross-border: IN -> GB ---');
  const inToGb = checkCrossBorderCompliance('IN', 'GB');
  console.log(`Allowed: ${inToGb.allowed}`);
  if (inToGb.mechanism) {
    console.log(`Mechanism: ${inToGb.mechanism}`);
  }
  for (const issue of inToGb.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // Mutual recognition partners
  const partners = getMutualRecognitionPartners('IN');
  console.log(`Mutual recognition partners: ${partners.join(', ')}`);
  console.log();

  // --- 6. Child compliance under DPDPA 2023 + POCSO ---
  // India's digital consent age is 18 — the highest among major jurisdictions.
  // This means ALL minors require parental consent for data processing.
  console.log('--- Child Compliance (age 16, IN) ---');
  const childCompliance = checkChildCompliance(16, 'IN');
  console.log(`Compliant: ${childCompliance.compliant}`);
  console.log(`Min consent age: ${childCompliance.minConsentAge} (one of the highest globally)`);
  console.log(`Age of majority: ${childCompliance.ageOfMajority}`);
  console.log(`Parental consent required: ${childCompliance.requiresParentalConsent}`);

  for (const issue of childCompliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERROR]'
      : issue.severity === 'warning' ? '[WARN]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
  }
  console.log();

  // --- 7. Consent requirements ---
  console.log('--- Consent Requirements ---');
  const consent = getConsentRequirements('IN');
  console.log(`Explicit consent required: ${consent.requiresExplicitConsent}`);
  console.log(`Digital consent age: ${consent.consentAge}`);
  console.log(`Data categories: ${consent.dataCategories.join(', ')}`);
  console.log();

  // --- 8. Signet IQ (bilingual) ---
  setLanguage('en');
  console.log(`--- [English] ${t('msg_signet_iq')} ---`);
  const trustScore = computeTrustScore(
    patient.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
  );
  console.log(formatLocalizedTrustScore(trustScore.score));
  console.log();

  setLanguage('hi');
  console.log(`--- [Hindi] ${t('msg_signet_iq')} ---`);
  console.log(formatLocalizedTrustScore(trustScore.score));

  console.log('\n=== Indian Doctor Example Complete ===');
}

main().catch(console.error);
