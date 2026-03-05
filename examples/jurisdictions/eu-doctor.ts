// Signet Protocol — German Doctor (EU) Example
// Demonstrates identity verification under GDPR with cross-border EU transfers
// Jurisdiction: Germany (DE)
// Profession: Doctor (Arzt) regulated by the Bundesaerztekammer
// Features: GDPR compliance, eIDAS recognition, cross-border to France

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
  getConsentRequirements,
  getRetentionGuidance,
  setLanguage,
  t,
  getTierDescription,
  formatLocalizedTrustScore,
  computeTrustScore,
} from '../../src/index.js';

async function main() {
  console.log('=== Signet-Protokoll — Deutsche Arztverifizierung ===\n');

  // Set language to German
  setLanguage('de');

  // --- 1. Jurisdiction and professional body lookup ---
  const de = getJurisdiction('DE');
  if (!de) throw new Error('DE jurisdiction not found');

  console.log(`Gerichtsbarkeit: ${de.name} (${de.nameLocal})`);
  console.log(`Rechtssystem: ${de.legalSystem}`);
  console.log(`Datenschutz: ${de.dataProtection.name}`);
  console.log(`Aufsichtsbehoerde: ${de.dataProtection.supervisoryAuthority}`);
  console.log(`Hinweis: ${de.dataProtection.notes}`);
  console.log();

  // Look up the Bundesaerztekammer (German Medical Association)
  const medicalBodies = getProfessionalBodies('DE', 'medical');
  console.log('Medizinische Berufskoerperschaften in DE:');
  for (const body of medicalBodies) {
    console.log(`  - ${body.name}`);
    if (body.nameEn) console.log(`    (${body.nameEn})`);
    console.log(`    Oeffentliches Register: ${body.hasPublicRegister}`);
    console.log(`    Digitale Nachweise: ${body.issuesDigitalCredentials}`);
  }
  console.log();

  // --- 2. Generate identities ---
  const arzt = generateKeyPair();      // The verifying doctor (Arzt)
  const patient = generateKeyPair();   // Person being verified

  // --- 3. Create Tier 3 credential (German output) ---
  console.log(`--- ${t('tier_3')}: ${t('credential_professional')} ---`);
  console.log(getTierDescription(3));
  console.log();

  const credential = await createProfessionalCredential(
    arzt.privateKey,
    patient.publicKey,
    {
      profession: 'doctor',
      jurisdiction: 'DE',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log(`  ${t('tier_3')}: ${parsed.profession}, ${parsed.jurisdiction}`);
  console.log();

  // --- 4. GDPR compliance check ---
  // Germany has the strictest GDPR enforcement in the EU, with both federal
  // and 16 state-level DPAs (Datenschutzbehoerden).
  console.log(`--- DSGVO-Konformitaetspruefung ---`);
  const compliance = checkCredentialCompliance(credential, 'DE');
  console.log(`Konform: ${compliance.compliant}`);

  for (const issue of compliance.issues) {
    const prefix = issue.severity === 'error' ? '[FEHLER]'
      : issue.severity === 'warning' ? '[WARNUNG]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
    console.log(`    Verordnung: ${issue.regulation}`);
    if (issue.remediation) {
      console.log(`    Massnahme: ${issue.remediation}`);
    }
  }
  console.log();

  // --- 5. Cross-border transfer to France (EU internal) ---
  // Under GDPR, intra-EU transfers are generally permitted as all member states
  // are subject to the same regulation. However, national implementations may differ.
  console.log('--- Grenzueberschreitende Uebermittlung: DE -> FR ---');
  const crossBorder = checkCrossBorderCompliance('DE', 'FR');
  console.log(`Erlaubt: ${crossBorder.allowed}`);
  if (crossBorder.mechanism) {
    console.log(`Mechanismus: ${crossBorder.mechanism}`);
  }

  for (const issue of crossBorder.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
  }
  console.log();

  // --- 6. eIDAS electronic signature recognition ---
  // The eIDAS regulation (EU 910/2014) provides mutual recognition of electronic
  // signatures across EU member states. German beA (besonderes elektronisches
  // Anwaltspostfach) is an example of qualified electronic signature infrastructure.
  console.log('--- eIDAS Anerkennung ---');
  const fr = getJurisdiction('FR');
  console.log(`DE e-Signatur anerkannt: ${de.eSignatureRecognised}`);
  console.log(`FR e-Signatur anerkannt: ${fr?.eSignatureRecognised}`);
  console.log('eIDAS ermoeglicht die gegenseitige Anerkennung qualifizierter');
  console.log('elektronischer Signaturen zwischen EU-Mitgliedstaaten.');
  console.log();

  // --- 7. Mutual recognition partners ---
  const partners = getMutualRecognitionPartners('DE');
  console.log(`Gegenseitige Anerkennung: ${partners.join(', ')}`);
  console.log();

  // --- 8. Consent and retention requirements ---
  console.log('--- Einwilligungsanforderungen ---');
  const consent = getConsentRequirements('DE');
  console.log(`${t('legal_consent')} erforderlich: ${consent.requiresExplicitConsent}`);
  console.log(`Digitales Einwilligungsalter: ${consent.consentAge}`);
  if (consent.notes) {
    console.log(`Hinweis: ${consent.notes}`);
  }
  console.log();

  console.log('--- Aufbewahrungsrichtlinien ---');
  const retention = getRetentionGuidance('DE');
  console.log(`Richtlinie: ${retention.guidance}`);
  console.log(`Verordnung: ${retention.regulation}`);
  console.log();

  // --- 9. Signet IQ (German output) ---
  console.log(`--- ${t('msg_signet_iq')} ---`);
  const trustScore = computeTrustScore(
    patient.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 3 * 365 * 24 * 60 * 60
  );
  console.log(formatLocalizedTrustScore(trustScore.score));

  console.log('\n=== Deutsche Arztverifizierung abgeschlossen ===');
}

main().catch(console.error);
