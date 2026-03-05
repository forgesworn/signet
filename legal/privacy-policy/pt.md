# Política de Privacidade

**Protocolo Signet — Rascunho v0.1.0**

*Modelo — Consulte um advogado qualificado em sua jurisdição antes da implantação.*

**Data de Vigência:** [DATA]
**Última Atualização:** [DATA]

---

## 1. Introdução

Esta Política de Privacidade descreve como [ORGANIZATION NAME] ("nós", "nos" ou "nosso") coleta, utiliza, divulga e protege informações em conexão com o Protocolo Signet (o "Protocolo"), um protocolo de verificação de identidade descentralizado para a rede Nostr que utiliza provas de conhecimento zero, assinaturas em anel e credenciais criptográficas.

O Protocolo Signet foi projetado com a privacidade como seu princípio fundamental. Ele permite que os usuários comprovem afirmações sobre sua identidade — como faixa etária, status profissional ou jurisdição geográfica — sem revelar os dados pessoais subjacentes. Esta Política de Privacidade explica quais interações limitadas de dados ocorrem e como são gerenciadas.

Esta Política se aplica a todos os usuários, verificadores, partes confiantes e outros participantes que interagem com o Protocolo Signet, independentemente da localização.

---

## 2. Controlador de Dados

**Controlador de Dados:** [ORGANIZATION NAME]
**Endereço Registrado:** [ENDEREÇO]
**E-mail de Contato:** [CONTACT EMAIL]
**Encarregado de Proteção de Dados (DPO):** [DPO EMAIL]

Para jurisdições que exigem um representante local:

- **Representante na UE (Art. 27 do RGPD):** [NOME E ENDEREÇO DO REPRESENTANTE NA UE]
- **Representante no Reino Unido (Art. 27 do RGPD do RU):** [NOME E ENDEREÇO DO REPRESENTANTE NO RU]
- **Brasil (LGPD):** [REPRESENTANTE NO BRASIL]
- **Coreia do Sul (PIPA):** [REPRESENTANTE NA COREIA DO SUL]

---

## 3. Dados que Coletamos e Processamos

O Protocolo Signet foi arquitetado para minimizar a coleta de dados. Como o Protocolo utiliza provas de conhecimento zero, assinaturas em anel e verificação descentralizada de credenciais, grande parte das informações permanece exclusivamente sob o controle do usuário e nunca é transmitida ou acessível por nós.

### 3.1 Categorias de Dados

| Categoria | Descrição | Fonte | Local de Armazenamento |
|-----------|-----------|-------|----------------------|
| **Chaves Públicas Nostr** | Chaves públicas secp256k1 (npub) usadas para interações do Protocolo | Geradas pelo usuário | Relays Nostr (descentralizado) |
| **Metadados de Credenciais** | Tipos de eventos Nostr 30470–30475 contendo nível de verificação, timestamps de emissão, datas de expiração e identificadores de tipo de credencial | Gerados durante a emissão de credenciais | Relays Nostr (descentralizado) |
| **Provas de Conhecimento Zero** | Bulletproofs para verificação de faixa etária; futuras provas ZK-SNARK/ZK-STARK para outras afirmações | Geradas localmente pelo usuário | Relays Nostr (descentralizado) |
| **Assinaturas em Anel** | Assinaturas criptográficas que comprovam pertencimento a um grupo sem revelar qual membro assinou | Geradas localmente pelo usuário | Relays Nostr (descentralizado) |
| **Dados de Nível de Verificação** | Nível (1–4) indicando a solidez da verificação de identidade | Atribuído durante a verificação | Embutido em eventos de credenciais |
| **Registros de Endosso** | Eventos tipo 30471 representando endossos da rede de confiança | Criados pelas partes endossantes | Relays Nostr (descentralizado) |
| **Eventos de Política** | Eventos tipo 30472 especificando requisitos das partes confiantes | Criados pelas partes confiantes | Relays Nostr (descentralizado) |
| **Registro de Verificadores** | Eventos tipo 30473 identificando verificadores profissionais | Criados pelos verificadores | Relays Nostr (descentralizado) |
| **Dados de Desafio/Resposta** | Eventos tipo 30474 para desafios de legitimidade de verificadores | Gerados durante a verificação | Relays Nostr (descentralizado) |
| **Registros de Revogação** | Eventos tipo 30475 para revogação de credenciais | Criados quando credenciais são revogadas | Relays Nostr (descentralizado) |

### 3.2 Dados que NÃO Coletamos

Por design, o Protocolo Signet **não** coleta, processa ou armazena:

- Nomes reais, endereços ou números de identificação governamental
- Dados biométricos
- Datas de nascimento exatas (as provas de faixa etária revelam apenas que um usuário está dentro de uma faixa)
- Informações financeiras ou dados de pagamento
- Dados de localização ou endereços IP (no nível do Protocolo; operadores de relays podem coletar endereços IP independentemente)
- Histórico de navegação ou impressões digitais de dispositivos
- Endereços de e-mail (a menos que fornecidos voluntariamente para suporte)
- Fotografias ou imagens
- Os dados subjacentes a qualquer prova de conhecimento zero

### 3.3 Dados Processados por Terceiros

Os operadores de relays Nostr processam independentemente os dados transmitidos através de seus relays. Suas práticas de dados são regidas por suas próprias políticas de privacidade. O Protocolo Signet não controla os operadores de relays.

---

## 4. Bases Legais para o Processamento

### 4.1 União Europeia / Espaço Econômico Europeu (RGPD)

| Finalidade | Base Legal | Artigo do RGPD |
|------------|-----------|----------------|
| Operação do Protocolo e verificação de credenciais | Interesse legítimo | Art. 6(1)(f) |
| Cumprimento de obrigações legais | Obrigação legal | Art. 6(1)(c) |
| Emissão de credenciais iniciada pelo usuário | Execução de contrato | Art. 6(1)(b) |
| Segurança infantil e verificação de idade | Interesse legítimo / Obrigação legal | Art. 6(1)(f) / Art. 6(1)(c) |

### 4.2 Reino Unido (RGPD do RU / Lei de Proteção de Dados 2018)

As mesmas bases legais do RGPD da UE se aplicam.

### 4.3 Estados Unidos (CCPA / CPRA / Leis Estaduais)

- **Não** vendemos informações pessoais.
- **Não** compartilhamos informações pessoais para publicidade comportamental entre contextos.
- Residentes da Califórnia têm direito a saber, excluir, corrigir e recusar.

### 4.4 Brasil (LGPD — Lei Geral de Proteção de Dados)

O processamento é baseado em:
- Interesse legítimo (Art. 7, X)
- Cumprimento de obrigações legais ou regulatórias (Art. 7, II)
- Execução de contrato ou procedimentos preliminares (Art. 7, V)

### 4.5 Coreia do Sul (PIPA)

O processamento cumpre os requisitos da PIPA, incluindo coleta mínima necessária, limitação de finalidade e requisitos de consentimento.

### 4.6 Japão (APPI)

O processamento cumpre a APPI emendada, incluindo especificação de finalidade e requisitos de transferência transfronteiriça.

### 4.7 China (PIPL)

Quando o Protocolo é acessado da República Popular da China, o processamento é baseado no consentimento individual ou execução de contrato, respeitando os requisitos de localização de dados.

### 4.8 Índia (DPDP)

O processamento cumpre a Lei DPDP, incluindo processamento baseado em consentimento ou usos legítimos.

---

## 5. Como Utilizamos os Dados

Os dados processados através do Protocolo Signet são utilizados exclusivamente para:

1. **Emissão e Verificação de Credenciais** — Permitir que usuários criem, apresentem e verifiquem credenciais nos quatro níveis de verificação.
2. **Cálculo do Signet IQ** — Calcular o Signet IQ baseado em endossos, níveis de credenciais e histórico de verificação.
3. **Verificação de Faixa Etária** — Usar Bulletproofs para provar que um usuário está dentro de uma faixa etária sem revelar sua idade exata.
4. **Verificação Profissional** — Permitir que profissionais licenciados atuem como verificadores.
5. **Revogação de Credenciais** — Processar eventos de revogação quando credenciais são invalidadas.
6. **Integridade do Protocolo** — Manter a integridade criptográfica e a segurança do Protocolo.
7. **Conformidade Legal** — Cumprir leis e regulamentos aplicáveis.

---

## 6. Compartilhamento e Divulgação de Dados

### 6.1 Compartilhamento no Nível do Protocolo

O Protocolo Signet opera na rede Nostr, que é descentralizada. Quando você publica um evento, ele é transmitido para relays Nostr. Isso é inerente ao design do Protocolo e é iniciado por você.

### 6.2 Não Compartilhamos Dados Com

- Anunciantes ou empresas de marketing
- Corretores de dados
- Plataformas de mídia social (além da publicação em relays Nostr)
- Agências governamentais (exceto quando exigido por lei)

### 6.3 Divulgação Exigida por Lei

Podemos divulgar informações se exigido por ordem judicial válida, lei ou regulamento aplicável, ou solicitação de autoridade competente. Notificaremos os usuários afetados quando legalmente permitido.

### 6.4 Compartilhamento de Dados de Verificadores

Verificadores profissionais (Nível 3 e 4) publicam eventos de registro de verificador (tipo 30473) na rede Nostr.

---

## 7. Transferências Internacionais de Dados

### 7.1 Arquitetura Descentralizada

A rede Nostr opera globalmente. Eventos publicados podem ser replicados para relays em qualquer lugar do mundo.

### 7.2 Mecanismos de Transferência

- **UE/EEE:** Cláusulas Contratuais Padrão (CCPs) aprovadas pela Comissão Europeia (Decisão 2021/914).
- **Reino Unido:** Acordo Internacional de Transferência de Dados (IDTA) ou Adendo do RU às CCPs da UE.
- **Coreia do Sul:** Conformidade com as disposições de transferência transfronteiriça da PIPA.
- **Japão:** Transferências para países com nível adequado de proteção ou com consentimento.
- **China:** Avaliações de segurança, contratos padrão ou certificações conforme PIPL.
- **Brasil:** Transferências em conformidade com o Art. 33 da LGPD.

---

## 8. Retenção de Dados

### 8.1 Eventos Nostr

Eventos publicados na rede Nostr são retidos por operadores de relays conforme suas próprias políticas.

### 8.2 Ciclo de Vida das Credenciais

| Tipo de Dados | Período de Retenção |
|---------------|---------------------|
| Credenciais ativas | Até expiração ou revogação |
| Credenciais revogadas | Eventos de revogação retidos indefinidamente para integridade da verificação |
| Credenciais expiradas | Conforme políticas dos operadores de relays |
| Registros de endosso | Até revogados pela parte endossante |
| Dados de desafio/resposta | Efêmeros; não retidos após a verificação |

### 8.3 Registros Centralizados

- Registros de suporte: 2 anos a partir da última interação
- Registros de conformidade legal: Conforme exigido por lei (tipicamente 5–7 anos)
- Logs de auditoria: 3 anos

---

## 9. Seus Direitos

### 9.1 Direitos Universais

Independentemente da sua jurisdição, você pode: solicitar informações sobre dados processados, solicitar correção de dados imprecisos, retirar consentimento e apresentar reclamação.

### 9.2 União Europeia / EEE (RGPD)

Direitos de: acesso (Art. 15), retificação (Art. 16), apagamento (Art. 17), limitação (Art. 18), portabilidade de dados (Art. 20), oposição (Art. 21) e decisões automatizadas (Art. 22).

### 9.3 Reino Unido (RGPD do RU)

Direitos equivalentes aos do RGPD da UE. Reclamações podem ser feitas ao ICO.

### 9.4 Estados Unidos (CCPA / CPRA)

Residentes da Califórnia têm direito a: saber, excluir, corrigir, recusar e não discriminação.

### 9.5 Brasil (LGPD)

Os titulares de dados têm direito a:
- Confirmação da existência de processamento
- Acesso aos dados
- Correção de dados incompletos, imprecisos ou desatualizados
- Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos
- Portabilidade de dados
- Eliminação de dados processados com consentimento
- Informação sobre dados compartilhados
- Informação sobre a possibilidade de negar consentimento e suas consequências
- Revogação do consentimento

Contato da ANPD: [https://www.gov.br/anpd](https://www.gov.br/anpd).

### 9.6 Coreia do Sul (PIPA)

Direitos de acesso, correção ou exclusão, suspensão do processamento e reclamação junto à PIPC.

### 9.7 Japão (APPI)

Direitos de divulgação, correção, adição ou exclusão e cessação do uso.

### 9.8 China (PIPL)

Direitos de conhecer e decidir sobre o processamento, restringir ou recusar, acessar e copiar, solicitar portabilidade, correção e exclusão.

### 9.9 Índia (Lei DPDP)

Direitos de acesso, correção e apagamento, reparação de queixas e nomeação de outra pessoa para exercer os direitos.

### 9.10 Exercício de Seus Direitos

Contate-nos em:
- **E-mail:** [CONTACT EMAIL]
- **E-mail do DPO:** [DPO EMAIL]

Prazos de resposta: RGPD: 30 dias; CCPA: 45 dias; LGPD: 15 dias; PIPA: 10 dias; APPI: sem demora; PIPL: prontamente.

---

## 10. Dados de Crianças

### 10.1 Política Geral

O Protocolo Signet inclui o Nível 4 (Verificação Profissional — Adulto + Criança), projetado especificamente para a segurança infantil.

### 10.2 Verificação de Idade

O Protocolo usa provas de conhecimento zero baseadas em Bulletproofs para verificação de faixa etária sem revelar a data de nascimento exata.

### 10.3 Requisitos de Idade por Jurisdição

| Jurisdição | Idade Mínima para Consentimento Digital | Lei Aplicável |
|------------|----------------------------------------|---------------|
| UE (padrão) | 16 anos | Art. 8 do RGPD |
| Reino Unido | 13 anos | RGPD do RU / AADC |
| Estados Unidos | 13 anos | COPPA |
| Brasil | 12 anos (com consentimento parental até 18) | Art. 14 da LGPD |
| Coreia do Sul | 14 anos | PIPA |
| Japão | 15 anos | APPI |
| China | 14 anos | Art. 28 da PIPL |
| Índia | 18 anos | Lei DPDP |

### 10.4 Consentimento Parental

Quando o consentimento parental é necessário, o Protocolo suporta: consentimento parental verificável através de credenciais de Nível 3/4, restrição por idade via provas ZK e mecanismos para os pais revisarem, modificarem ou revogarem o consentimento.

### 10.5 Conformidade com COPPA (Estados Unidos)

Não coletamos intencionalmente informações pessoais de crianças menores de 13 anos sem consentimento parental verificável.

### 10.6 Código de Design Apropriado à Idade (Reino Unido)

Estamos comprometidos com os princípios do AADC do RU.

---

## 11. Segurança

### 11.1 Segurança Criptográfica

O Protocolo Signet emprega: assinaturas Schnorr (secp256k1), Bulletproofs para provas de faixa etária, assinaturas em anel e futura camada ZK (ZK-SNARKs/ZK-STARKs).

### 11.2 Segurança Organizacional

Implementamos: controles de acesso, criptografia em trânsito (TLS 1.2+), avaliações de segurança regulares, procedimentos de resposta a incidentes, treinamento de pessoal e práticas de desenvolvimento seguro.

### 11.3 Modelo de Segurança Descentralizado

A arquitetura descentralizada fornece: nenhum ponto único de falha, nenhum banco de dados centralizado para violar, gerenciamento de chaves controlado pelo usuário e verificação criptográfica sem intermediários.

### 11.4 Notificação de Violações

Em caso de violação de dados pessoais, notificaremos a autoridade supervisora competente dentro de 72 horas (RGPD), os indivíduos afetados sem demora indevida quando houver alto risco, e documentaremos a violação.

---

## 12. Cookies e Tecnologias de Rastreamento

O Protocolo Signet **não** usa cookies, web beacons, impressão digital de navegador, armazenamento local para rastreamento ou serviços de análise de terceiros.

---

## 13. Tomada de Decisão Automatizada e Perfilamento

O Protocolo calcula o Signet IQ algoritmicamente. Este não constitui tomada de decisão automatizada com efeitos legais sob o Art. 22 do RGPD. Não fazemos perfilamento para marketing.

---

## 14. Links e Serviços de Terceiros

O Protocolo pode interoperar com relays Nostr, clientes Nostr (como Fathom) e órgãos profissionais. Estes terceiros têm suas próprias políticas de privacidade.

---

## 15. Alterações nesta Política de Privacidade

Podemos atualizar esta Política periodicamente. Alterações substanciais serão notificadas por evento Nostr, atualização do repositório do Protocolo ou notificação direta.

---

## 16. Disposições Específicas por Jurisdição

### 16.1 União Europeia

As disposições do RGPD prevalecem sobre disposições conflitantes desta Política.

### 16.2 Califórnia

Não vendemos nem compartilhamos informações pessoais conforme definido pela CCPA/CPRA.

### 16.3 Brasil

O Encarregado (DPO) pode ser contatado em [DPO EMAIL] para todas as consultas relacionadas à LGPD.

### 16.4 Austrália

Cumprimos os Princípios Australianos de Privacidade (APPs) sob o Privacy Act 1988.

---

## 17. Contate-nos

**Consultas Gerais:**
[ORGANIZATION NAME]
E-mail: [CONTACT EMAIL]

**Encarregado de Proteção de Dados:**
E-mail: [DPO EMAIL]

**Endereço Postal:**
[ORGANIZATION NAME]
[ENDEREÇO]

---

*Esta Política de Privacidade é fornecida como modelo para o Protocolo Signet. Não constitui aconselhamento jurídico. [ORGANIZATION NAME] recomenda consultar um advogado qualificado familiarizado com as leis de proteção de dados aplicáveis em sua jurisdição antes da implantação.*

*Protocolo Signet — Rascunho v0.1.0*
*Versão do Documento: 1.0*
