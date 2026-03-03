// Signet Protocol — Multi-Jurisdiction Example
// Demonstrates cross-border credential usage across multiple jurisdictions
// Scenario: A UK solicitor's credential is used in France, Germany, and Singapore
// Features: Cross-border compliance, most restrictive requirements, multi-language

import {
  generateKeyPair,
  getJurisdiction,
  getMutualRecognitionPartners,
  createProfessionalCredential,
  verifyCredential,
  parseCredential,
  checkCredentialCompliance,
  checkCrossBorderCompliance,
  checkMultiJurisdictionCompliance,
  getMostRestrictiveRequirements,
  getConsentRequirements,
  setLanguage,
  t,
  getTierDescription,
  formatLocalizedTrustScore,
  computeTrustScore,
} from '../../src/index.js';

async function main() {
  console.log('=== Signet Protocol — Multi-Jurisdiction Verification ===\n');

  // --- 1. Create a UK solicitor credential ---
  const solicitor = generateKeyPair();
  const subject = generateKeyPair();

  setLanguage('en');
  console.log('--- Step 1: Issue credential in UK ---');

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

  console.log(`Credential: ${t('credential_professional')}`);
  console.log(`  Tier: ${parsed.tier}, Profession: ${parsed.profession}`);
  console.log(`  Origin jurisdiction: ${parsed.jurisdiction}`);
  console.log(`  Signature valid: ${verification.signatureValid}`);
  console.log();

  // --- 2. Check compliance in each target jurisdiction ---
  const targetJurisdictions = ['FR', 'DE', 'SG'];
  const allJurisdictions = ['GB', ...targetJurisdictions];

  console.log('--- Step 2: Multi-jurisdiction compliance check ---');
  const complianceResults = checkMultiJurisdictionCompliance(credential, allJurisdictions);

  for (const [code, result] of complianceResults) {
    const j = getJurisdiction(code);
    console.log(`\n[${code}] ${j?.name || code}: ${result.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);

    for (const issue of result.issues) {
      const prefix = issue.severity === 'error' ? 'ERROR'
        : issue.severity === 'warning' ? 'WARN'
        : 'INFO';
      console.log(`  [${prefix}] ${issue.message}`);
    }
  }
  console.log();

  // --- 3. Cross-border compliance for each pair ---
  console.log('--- Step 3: Cross-border transfer checks ---');
  for (const target of targetJurisdictions) {
    const targetJ = getJurisdiction(target);
    const crossBorder = checkCrossBorderCompliance('GB', target);

    console.log(`\nGB -> ${target} (${targetJ?.name}):`);
    console.log(`  Allowed: ${crossBorder.allowed}`);
    if (crossBorder.mechanism) {
      console.log(`  Mechanism: ${crossBorder.mechanism}`);
    }
    for (const issue of crossBorder.issues) {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
    }
  }
  console.log();

  // --- 4. Most restrictive requirements ---
  // When a credential is used across jurisdictions, the safest approach is
  // to apply the most restrictive requirements from all jurisdictions.
  console.log('--- Step 4: Most restrictive requirements ---');
  const mostRestrictive = getMostRestrictiveRequirements(allJurisdictions);

  console.log(`Jurisdictions considered: ${mostRestrictive.jurisdictions.join(', ')}`);
  console.log(`Highest consent age: ${mostRestrictive.highestConsentAge}`);
  console.log(`Highest age of majority: ${mostRestrictive.highestAgeOfMajority}`);
  console.log(`Explicit consent required: ${mostRestrictive.requiresExplicitConsent}`);
  console.log(`Shortest breach notification: ${mostRestrictive.shortestBreachNotification}h`);
  console.log(`All require erasure: ${mostRestrictive.allRequireErasure}`);
  console.log();

  // Compare consent requirements across jurisdictions
  console.log('--- Consent requirements by jurisdiction ---');
  for (const code of allJurisdictions) {
    const consent = getConsentRequirements(code);
    const j = getJurisdiction(code);
    console.log(`  ${code} (${j?.name}): consent age=${consent.consentAge}, explicit=${consent.requiresExplicitConsent}`);
  }
  console.log();

  // --- 5. Mutual recognition networks ---
  console.log('--- Step 5: Mutual recognition partners ---');
  for (const code of allJurisdictions) {
    const partners = getMutualRecognitionPartners(code);
    const j = getJurisdiction(code);
    console.log(`  ${code} (${j?.name}): ${partners.join(', ')}`);
  }
  console.log();

  // --- 6. Multi-language output ---
  // Demonstrate the same credential information in English, French, and German
  console.log('--- Step 6: Multi-language credential display ---\n');

  const trustScore = computeTrustScore(
    subject.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 2 * 365 * 24 * 60 * 60
  );

  // English
  setLanguage('en');
  console.log(`[English]`);
  console.log(`  ${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log(`  ${getTierDescription(3)}`);
  console.log(`  ${formatLocalizedTrustScore(trustScore.score)}`);
  console.log();

  // French
  setLanguage('fr');
  console.log(`[Francais]`);
  console.log(`  ${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log(`  ${getTierDescription(3)}`);
  console.log(`  ${formatLocalizedTrustScore(trustScore.score)}`);
  console.log();

  // German
  setLanguage('de');
  console.log(`[Deutsch]`);
  console.log(`  ${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log(`  ${getTierDescription(3)}`);
  console.log(`  ${formatLocalizedTrustScore(trustScore.score)}`);
  console.log();

  // --- 7. Summary ---
  setLanguage('en');
  console.log('--- Summary ---');
  console.log('A UK solicitor credential can be used across jurisdictions with');
  console.log('varying compliance requirements. Key considerations:');
  console.log('  - GB->FR: EU adequacy (post-Brexit data bridge), GDPR alignment');
  console.log('  - GB->DE: Strictest GDPR enforcement, 16+ consent age');
  console.log('  - GB->SG: PDPA applies, different consent framework');
  console.log('  - Most restrictive consent age across all: ' + mostRestrictive.highestConsentAge);
  console.log('  - All require breach notification within ' + mostRestrictive.shortestBreachNotification + 'h');

  console.log('\n=== Multi-Jurisdiction Example Complete ===');
}

main().catch(console.error);
