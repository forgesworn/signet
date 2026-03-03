// Signet Protocol — Brazilian Lawyer Example
// Demonstrates identity verification under LGPD (Lei Geral de Protecao de Dados)
// Jurisdiction: Brazil (BR)
// Profession: Lawyer regulated by the OAB (Ordem dos Advogados do Brasil)
// Features: LGPD compliance, digital credential support, child protection under Art. 14

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
  getRetentionGuidance,
  setLanguage,
  t,
  getTierDescription,
  formatLocalizedTrustScore,
  computeTrustScore,
} from '../../src/index.js';

async function main() {
  console.log('=== Protocolo Signet — Verificacao de Advogado Brasileiro ===\n');

  // Set language to Portuguese
  setLanguage('pt');

  // --- 1. Jurisdiction and OAB lookup ---
  const br = getJurisdiction('BR');
  if (!br) throw new Error('BR jurisdiction not found');

  console.log(`Jurisdicao: ${br.name} (${br.nameLocal})`);
  console.log(`Sistema juridico: ${br.legalSystem}`);
  console.log(`Protecao de dados: ${br.dataProtection.name} - ${br.dataProtection.fullName}`);
  console.log(`Autoridade supervisora: ${br.dataProtection.supervisoryAuthority}`);
  if (br.dataProtection.notes) {
    console.log(`Nota: ${br.dataProtection.notes}`);
  }
  console.log();

  // Look up the OAB — notably, it issues digital credentials via ICP-Brasil
  const legalBodies = getProfessionalBodies('BR', 'legal');
  console.log('Entidades profissionais juridicas no Brasil:');
  for (const body of legalBodies) {
    console.log(`  - ${body.name}`);
    if (body.nameEn) console.log(`    (${body.nameEn})`);
    console.log(`    Website: ${body.website}`);
    console.log(`    Registro publico: ${body.hasPublicRegister}`);
    if (body.registerUrl) {
      console.log(`    URL do registro: ${body.registerUrl}`);
    }
    // OAB issues digital certificates via ICP-Brasil PKI
    console.log(`    Credenciais digitais: ${body.issuesDigitalCredentials}`);
    if (body.notes) {
      console.log(`    Nota: ${body.notes}`);
    }
  }
  console.log();

  // --- 2. Generate identities ---
  const advogado = generateKeyPair();   // The verifying lawyer (advogado)
  const subject = generateKeyPair();    // Person being verified
  const parent = generateKeyPair();     // Parent (for child credential)

  // --- 3. Create Tier 3 credential (Portuguese output) ---
  console.log(`--- ${t('tier_3')}: ${t('credential_professional')} ---`);
  console.log(getTierDescription(3));
  console.log();

  const credential = await createProfessionalCredential(
    advogado.privateKey,
    subject.publicKey,
    {
      profession: 'lawyer',
      jurisdiction: 'BR',
    }
  );

  const verification = await verifyCredential(credential);
  const parsed = parseCredential(credential)!;

  console.log(`${t('credential_professional')}: ${t('status_valid')}`);
  console.log(`  ${t('msg_signature_valid')}`);
  console.log(`  Tier: ${parsed.tier}, Profissao: ${parsed.profession}`);
  console.log(`  Jurisdicao: ${parsed.jurisdiction}`);
  console.log();

  // --- 4. LGPD compliance check ---
  // Brazil's LGPD is modelled on the GDPR and requires explicit consent.
  // ICP-Brasil provides the PKI infrastructure for digital signatures.
  console.log('--- Verificacao de conformidade LGPD ---');
  const compliance = checkCredentialCompliance(credential, 'BR');
  console.log(`Em conformidade: ${compliance.compliant}`);

  for (const issue of compliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERRO]'
      : issue.severity === 'warning' ? '[AVISO]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
    console.log(`    Regulamento: ${issue.regulation}`);
    if (issue.remediation) {
      console.log(`    Acao: ${issue.remediation}`);
    }
  }
  console.log();

  // --- 5. LGPD consent requirements ---
  // LGPD treats biometric data as sensitive personal data requiring specific legal basis.
  console.log('--- Requisitos de consentimento ---');
  const consent = getConsentRequirements('BR');
  console.log(`Consentimento explicito: ${consent.requiresExplicitConsent}`);
  console.log(`Idade de consentimento digital: ${consent.consentAge}`);
  console.log(`Categorias de dados: ${consent.dataCategories.join(', ')}`);
  if (consent.specialCategories.length > 0) {
    console.log(`Categorias especiais: ${consent.specialCategories.join(', ')}`);
  }
  if (consent.notes) {
    console.log(`Nota: ${consent.notes}`);
  }
  console.log();

  // --- 6. Child protection under LGPD Art. 14 ---
  // LGPD Art. 14 provides specific rules for processing children's data.
  // Brazil's digital consent age is 12 (one of the lowest globally).
  // The ECA (Estatuto da Crianca e do Adolescente) provides additional protections.
  console.log('--- Protecao infantil — LGPD Art. 14 + ECA ---');

  const childCredential = await createChildSafetyCredential(
    advogado.privateKey,
    parent.publicKey,
    {
      profession: 'lawyer',
      jurisdiction: 'BR',
      ageRange: '8-12',
    }
  );

  const childVerification = await verifyCredential(childCredential);
  const childParsed = parseCredential(childCredential)!;

  console.log(`${t('credential_professional_child')}: ${t('status_valid')}`);
  console.log(`  Escopo: ${childParsed.scope}, Faixa etaria: ${childParsed.ageRange}`);
  console.log(`  Assinatura valida: ${childVerification.signatureValid}`);
  console.log();

  // Check child compliance for a 10-year-old
  console.log('--- Conformidade infantil (idade 10, BR) ---');
  const childCompliance = checkChildCompliance(10, 'BR');
  console.log(`Em conformidade: ${childCompliance.compliant}`);
  console.log(`Idade minima de consentimento: ${childCompliance.minConsentAge}`);
  console.log(`Maioridade: ${childCompliance.ageOfMajority}`);
  console.log(`Consentimento parental necessario: ${childCompliance.requiresParentalConsent}`);

  for (const issue of childCompliance.issues) {
    const prefix = issue.severity === 'error' ? '[ERRO]'
      : issue.severity === 'warning' ? '[AVISO]'
      : '[INFO]';
    console.log(`  ${prefix} ${issue.message}`);
  }
  console.log();

  // --- 7. Data retention ---
  console.log('--- Retencao de dados ---');
  const retention = getRetentionGuidance('BR');
  console.log(`Orientacao: ${retention.guidance}`);
  console.log(`Regulamento: ${retention.regulation}`);
  console.log();

  // --- 8. Trust score (Portuguese output) ---
  console.log(`--- ${t('msg_trust_score')} ---`);
  const trustScore = computeTrustScore(
    subject.publicKey,
    [credential],
    [],
    Math.floor(Date.now() / 1000) - 2 * 365 * 24 * 60 * 60
  );
  console.log(formatLocalizedTrustScore(trustScore.score));

  console.log('\n=== Exemplo de Advogado Brasileiro Concluido ===');
}

main().catch(console.error);
