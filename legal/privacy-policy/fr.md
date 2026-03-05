# Politique de Confidentialité

**Protocole Signet — Ébauche v0.1.0**

*Modèle — Consultez un conseiller juridique qualifié dans votre juridiction avant le déploiement.*

**Date d'Entrée en Vigueur :** [DATE]
**Dernière Mise à Jour :** [DATE]

---

## 1. Introduction

La présente Politique de Confidentialité décrit comment [ORGANIZATION NAME] (« nous », « notre » ou « nos ») collecte, utilise, divulgue et protège les informations en lien avec le Protocole Signet (le « Protocole »), un protocole de vérification d'identité décentralisé pour le réseau Nostr utilisant des preuves à divulgation nulle de connaissance, des signatures en anneau et des identifiants cryptographiques.

Le Protocole Signet est conçu avec la protection de la vie privée comme principe fondamental. Il permet aux utilisateurs de prouver des affirmations concernant leur identité — telles que la tranche d'âge, le statut professionnel ou la juridiction géographique — sans révéler les données personnelles sous-jacentes. La présente Politique de Confidentialité explique quelles interactions limitées de données ont lieu et comment elles sont gérées.

Cette Politique s'applique à tous les utilisateurs, vérificateurs, parties de confiance et autres participants qui interagissent avec le Protocole Signet, quelle que soit leur localisation.

---

## 2. Responsable du Traitement des Données

**Responsable du Traitement :** [ORGANIZATION NAME]
**Adresse du Siège :** [ADRESSE]
**E-mail de Contact :** [CONTACT EMAIL]
**Délégué à la Protection des Données (DPD) :** [DPO EMAIL]

Pour les juridictions exigeant un représentant local :

- **Représentant dans l'UE (Art. 27 du RGPD) :** [NOM ET ADRESSE DU REPRÉSENTANT UE]
- **Représentant au Royaume-Uni (Art. 27 du RGPD UK) :** [NOM ET ADRESSE DU REPRÉSENTANT UK]
- **Brésil (LGPD) :** [REPRÉSENTANT AU BRÉSIL]
- **Corée du Sud (PIPA) :** [REPRÉSENTANT EN CORÉE DU SUD]

---

## 3. Données que Nous Collectons et Traitons

Le Protocole Signet est architecturé pour minimiser la collecte de données. Étant donné que le Protocole utilise des preuves à divulgation nulle de connaissance, des signatures en anneau et une vérification décentralisée des identifiants, une grande partie des informations reste exclusivement sous le contrôle de l'utilisateur et n'est jamais transmise ni accessible par nous.

### 3.1 Catégories de Données

| Catégorie | Description | Source | Lieu de Stockage |
|-----------|-------------|--------|------------------|
| **Clés Publiques Nostr** | Clés publiques secp256k1 (npub) utilisées pour les interactions du Protocole | Générées par l'utilisateur | Relais Nostr (décentralisé) |
| **Métadonnées d'Identifiants** | Types d'événements Nostr 30470–30475 contenant le niveau de vérification, les horodatages d'émission, les dates d'expiration et les identifiants de type d'identifiant | Générées lors de l'émission des identifiants | Relais Nostr (décentralisé) |
| **Preuves à Divulgation Nulle** | Bulletproofs pour la vérification de tranche d'âge ; futures preuves ZK-SNARK/ZK-STARK pour d'autres affirmations | Générées localement par l'utilisateur | Relais Nostr (décentralisé) |
| **Signatures en Anneau** | Signatures cryptographiques prouvant l'appartenance à un groupe sans révéler quel membre a signé | Générées localement par l'utilisateur | Relais Nostr (décentralisé) |
| **Données de Niveau de Vérification** | Niveau (1–4) indiquant la solidité de la vérification d'identité | Attribué lors de la vérification | Intégré dans les événements d'identifiants |
| **Enregistrements de Garants** | Événements de type 30471 représentant des endorsements du réseau de confiance | Créés par les parties garantes | Relais Nostr (décentralisé) |
| **Événements de Politique** | Événements de type 30472 spécifiant les exigences des parties de confiance | Créés par les parties de confiance | Relais Nostr (décentralisé) |
| **Inscription des Vérificateurs** | Événements de type 30473 identifiant les vérificateurs professionnels | Créés par les vérificateurs | Relais Nostr (décentralisé) |
| **Données de Défi/Réponse** | Événements de type 30474 pour les défis de légitimité des vérificateurs | Générées lors de la vérification | Relais Nostr (décentralisé) |
| **Enregistrements de Révocation** | Événements de type 30475 pour la révocation d'identifiants | Créés lors de la révocation des identifiants | Relais Nostr (décentralisé) |

### 3.2 Données que Nous ne Collectons PAS

Par conception, le Protocole Signet ne collecte, ne traite ni ne stocke **pas** :

- Les noms réels, adresses ou numéros d'identification gouvernementaux
- Les données biométriques
- Les dates de naissance exactes (les preuves de tranche d'âge révèlent uniquement qu'un utilisateur se trouve dans une tranche)
- Les informations financières ou données de paiement
- Les données de localisation ou adresses IP (au niveau du Protocole ; les opérateurs de relais peuvent collecter les adresses IP indépendamment)
- L'historique de navigation ou les empreintes numériques des appareils
- Les adresses e-mail (sauf si fournies volontairement pour le support)
- Les photographies ou images
- Les données sous-jacentes à toute preuve à divulgation nulle

### 3.3 Données Traitées par des Tiers

Les opérateurs de relais Nostr traitent indépendamment les données transmises via leurs relais. Leurs pratiques en matière de données sont régies par leurs propres politiques de confidentialité. Le Protocole Signet ne contrôle pas les opérateurs de relais.

---

## 4. Bases Légales du Traitement

Nous traitons les données sur les bases légales suivantes, selon votre juridiction :

### 4.1 Union Européenne / Espace Économique Européen (RGPD)

| Finalité | Base Légale | Article du RGPD |
|----------|-------------|-----------------|
| Fonctionnement du Protocole et vérification des identifiants | Intérêt légitime | Art. 6(1)(f) |
| Respect des obligations légales | Obligation légale | Art. 6(1)(c) |
| Émission d'identifiants initiée par l'utilisateur | Exécution d'un contrat | Art. 6(1)(b) |
| Sécurité des enfants et vérification de l'âge | Intérêt légitime / Obligation légale | Art. 6(1)(f) / Art. 6(1)(c) |

### 4.2 Royaume-Uni (RGPD UK / Data Protection Act 2018)

Les mêmes bases légales que le RGPD de l'UE s'appliquent, complétées par le Data Protection Act 2018 et le Code de Conception Appropriée à l'Âge (AADC).

### 4.3 États-Unis (CCPA / CPRA / Lois des États)

En vertu de la CCPA et de la CPRA de Californie :
- Nous ne **vendons pas** d'informations personnelles.
- Nous ne **partageons pas** d'informations personnelles pour la publicité comportementale inter-contexte.
- Les résidents de Californie ont le droit de savoir, de supprimer, de corriger et de s'opposer.
- Nous respectons les lois étatiques applicables en matière de confidentialité.

### 4.4 Brésil (LGPD)

Le traitement est fondé sur :
- L'intérêt légitime (Art. 7, X)
- Le respect des obligations légales ou réglementaires (Art. 7, II)
- L'exécution d'un contrat ou de procédures préliminaires (Art. 7, V)

### 4.5 Corée du Sud (PIPA)

Le traitement est conforme aux exigences de la PIPA, notamment :
- La collecte limitée au minimum nécessaire
- La limitation spécifique des finalités
- La notification des finalités du traitement
- Le respect des exigences de consentement

### 4.6 Japon (APPI)

Le traitement est conforme à l'APPI modifiée, notamment :
- La spécification de la finalité d'utilisation
- L'acquisition correcte des informations personnelles
- Le respect des exigences relatives aux transferts transfrontaliers

### 4.7 Chine (PIPL)

Lorsque le Protocole est accessible depuis la République populaire de Chine :
- Le traitement est fondé sur le consentement individuel ou l'exécution d'un contrat
- Les exigences de localisation des données sont respectées
- Les transferts transfrontaliers sont conformes aux articles 38–43 de la PIPL

### 4.8 Inde (DPDP)

Le traitement est conforme à la loi DPDP, notamment :
- Le traitement fondé sur le consentement ou des utilisations légitimes
- Les obligations en tant que fiduciaire des données
- Les droits des titulaires de données

---

## 5. Comment Nous Utilisons les Données

Les données traitées via le Protocole Signet sont utilisées exclusivement pour :

1. **Émission et Vérification d'Identifiants** — Permettre aux utilisateurs de créer, présenter et vérifier des identifiants à travers les quatre niveaux de vérification.
2. **Calcul du Signet IQ** — Calculer les scores Signet IQ basés sur les garants du réseau de confiance, les niveaux d'identifiants et l'historique de vérification.
3. **Vérification de Tranche d'Âge** — Utiliser les Bulletproofs pour prouver qu'un utilisateur se trouve dans une tranche d'âge sans révéler son âge exact.
4. **Vérification Professionnelle** — Permettre aux professionnels licenciés (avocats, notaires, professionnels médicaux) d'agir comme vérificateurs.
5. **Révocation d'Identifiants** — Traiter les événements de révocation lorsque les identifiants sont invalidés.
6. **Intégrité du Protocole** — Maintenir l'intégrité cryptographique et la sécurité du Protocole.
7. **Conformité Légale** — Se conformer aux lois et réglementations applicables.

---

## 6. Partage et Divulgation des Données

### 6.1 Partage au Niveau du Protocole

Le Protocole Signet fonctionne sur le réseau Nostr, qui est décentralisé. Lorsque vous publiez un événement d'identifiant, de garant ou un autre événement du Protocole, il est diffusé aux relais Nostr. Ceci est inhérent à la conception du Protocole et est initié par vous.

### 6.2 Nous ne Partageons pas les Données avec

- Les annonceurs ou sociétés de marketing
- Les courtiers en données
- Les plateformes de médias sociaux (au-delà de la publication sur les relais Nostr)
- Les agences gouvernementales (sauf si requis par la loi ou une procédure judiciaire valide)

### 6.3 Divulgation Requise par la Loi

Nous pouvons divulguer des informations si requis par :
- Une ordonnance judiciaire valide, une citation à comparaître ou une procédure légale
- La loi ou la réglementation applicable
- Une demande d'une autorité de police ou de régulation ayant compétence

Nous informerons les utilisateurs concernés de telles demandes lorsque la loi le permet.

### 6.4 Partage de Données des Vérificateurs

Les vérificateurs professionnels (Niveaux 3 et 4) publient des événements d'inscription de vérificateur (type 30473) sur le réseau Nostr. Ces événements incluent la clé publique du vérificateur, ses qualifications professionnelles et des informations juridictionnelles. Les vérificateurs consentent à cette publication dans le cadre de l'Accord de Vérificateur.

---

## 7. Transferts Internationaux de Données

### 7.1 Architecture Décentralisée

Le réseau Nostr fonctionne à l'échelle mondiale. Lorsque vous publiez des événements sur des relais Nostr, ces événements peuvent être répliqués vers des relais situés partout dans le monde. C'est une caractéristique fondamentale du protocole décentralisé.

### 7.2 Mécanismes de Transfert

Pour tout traitement centralisé que nous effectuons, les transferts internationaux de données sont protégés par :

- **UE/EEE :** Clauses Contractuelles Types (CCT) approuvées par la Commission européenne (Décision 2021/914), complétées par des évaluations d'impact des transferts si nécessaire.
- **Royaume-Uni :** Accord International de Transfert de Données (IDTA) ou Addendum UK aux CCT de l'UE.
- **Corée du Sud :** Conformité aux dispositions de transfert transfrontalier de la PIPA.
- **Japon :** Transferts vers des pays offrant un niveau de protection adéquat reconnu par la PPC, ou avec le consentement de l'utilisateur.
- **Chine :** Évaluations de sécurité, contrats types ou certifications selon la PIPL.
- **Brésil :** Transferts conformes à l'Art. 33 de la LGPD.

### 7.3 Décisions d'Adéquation

Nous nous appuyons sur les décisions d'adéquation lorsqu'elles sont disponibles, y compris le Cadre de Protection des Données UE-États-Unis et la décision d'adéquation du Japon par la Commission européenne.

---

## 8. Conservation des Données

### 8.1 Événements Nostr

Les événements publiés sur le réseau Nostr sont conservés par les opérateurs de relais selon leurs propres politiques. Le réseau Nostr étant décentralisé, nous ne pouvons pas garantir la suppression des événements de tous les relais.

### 8.2 Cycle de Vie des Identifiants

| Type de Données | Durée de Conservation |
|-----------------|----------------------|
| Identifiants actifs | Jusqu'à expiration ou révocation |
| Identifiants révoqués | Les événements de révocation sont conservés indéfiniment pour l'intégrité de la vérification |
| Identifiants expirés | Conservés sur les relais selon les politiques des opérateurs |
| Enregistrements de garants | Jusqu'à révocation par la partie garante |
| Données de défi/réponse | Éphémères ; non conservées après la vérification |

### 8.3 Enregistrements Centralisés

Les enregistrements que nous maintenons de manière centralisée sont conservés pendant :
- Enregistrements de support : 2 ans à compter de la dernière interaction
- Enregistrements de conformité légale : Selon la loi applicable (généralement 5–7 ans)
- Journaux d'audit : 3 ans

---

## 9. Vos Droits

### 9.1 Droits Universels

Quelle que soit votre juridiction, vous pouvez :
- Demander des informations sur les données que nous traitons vous concernant
- Demander la correction de données inexactes
- Retirer votre consentement lorsque le traitement est fondé sur le consentement
- Déposer une plainte auprès de nous ou d'une autorité de contrôle

### 9.2 Union Européenne / EEE (RGPD)

En vertu du RGPD, vous disposez du droit :
- **D'accès** (Art. 15) — Obtenir une copie de vos données personnelles
- **De rectification** (Art. 16) — Corriger des données inexactes
- **D'effacement** (Art. 17) — Demander la suppression (« droit à l'oubli ») lorsque applicable
- **De limitation** (Art. 18) — Limiter le traitement dans certaines circonstances
- **À la portabilité des données** (Art. 20) — Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine
- **D'opposition** (Art. 21) — S'opposer au traitement fondé sur l'intérêt légitime
- **Relatif aux décisions automatisées** (Art. 22) — Ne pas faire l'objet de décisions exclusivement automatisées produisant des effets juridiques

**Autorité de Contrôle :** Vous pouvez déposer une plainte auprès de votre autorité locale de protection des données. En France, la CNIL : [https://www.cnil.fr](https://www.cnil.fr).

### 9.3 Royaume-Uni (RGPD UK)

Vous disposez de droits équivalents à ceux du RGPD de l'UE. Vous pouvez déposer une plainte auprès de l'ICO.

### 9.4 États-Unis (CCPA / CPRA)

Les résidents de Californie ont le droit de :
- **Savoir** — Quelles informations personnelles sont collectées, utilisées et divulguées
- **Supprimer** — Demander la suppression des informations personnelles
- **Corriger** — Demander la correction d'informations personnelles inexactes
- **S'opposer** — S'opposer à la vente ou au partage des informations personnelles
- **Non-discrimination** — Ne pas être discriminé pour l'exercice des droits de confidentialité

Pour exercer ces droits, contactez [CONTACT EMAIL].

### 9.5 Brésil (LGPD)

Les titulaires de données ont le droit à :
- La confirmation de l'existence du traitement
- L'accès aux données
- La correction de données incomplètes, inexactes ou obsolètes
- L'anonymisation, le blocage ou la suppression de données inutiles ou excessives
- La portabilité des données
- La suppression des données traitées avec consentement
- L'information sur les données partagées
- L'information sur la possibilité de refuser le consentement et ses conséquences
- La révocation du consentement

### 9.6 Corée du Sud (PIPA)

Les titulaires de données ont le droit de :
- Demander l'accès aux informations personnelles
- Demander la correction ou la suppression
- Demander la suspension du traitement
- Déposer une plainte auprès de la PIPC

### 9.7 Japon (APPI)

Les titulaires de données ont le droit de :
- Demander la divulgation des données personnelles conservées
- Demander la correction, l'ajout ou la suppression
- Demander la cessation de l'utilisation ou de la communication à des tiers

### 9.8 Chine (PIPL)

Les titulaires de données ont le droit de :
- Connaître et décider du traitement de leurs informations personnelles
- Restreindre ou refuser le traitement
- Accéder et copier leurs informations personnelles
- Demander la portabilité
- Demander la correction et la suppression
- Demander l'explication des règles de traitement

### 9.9 Inde (Loi DPDP)

Les titulaires de données ont le droit à :
- L'accès aux informations sur le traitement
- La correction et la suppression des données personnelles
- La réparation des griefs
- La désignation d'une autre personne pour exercer leurs droits

### 9.10 Exercice de Vos Droits

Pour exercer l'un des droits ci-dessus, contactez-nous à :
- **E-mail :** [CONTACT EMAIL]
- **E-mail du DPD :** [DPO EMAIL]

Nous répondrons dans les délais requis par la loi applicable :
- RGPD/RGPD UK : 30 jours (extensible de 60 jours pour les demandes complexes)
- CCPA/CPRA : 45 jours (extensible de 45 jours)
- LGPD : 15 jours
- PIPA : 10 jours
- APPI : Sans délai
- PIPL : Promptement

---

## 10. Données des Enfants

### 10.1 Politique Générale

Le Protocole Signet inclut le Niveau 4 (Vérification Professionnelle — Adulte + Enfant), spécifiquement conçu pour la sécurité des enfants. Nous prenons très au sérieux la protection des données des enfants.

### 10.2 Vérification de l'Âge

Le Protocole utilise des preuves à divulgation nulle basées sur Bulletproofs pour la vérification de la tranche d'âge. Ces preuves démontrent qu'un utilisateur se trouve dans une tranche d'âge donnée sans révéler sa date de naissance exacte.

### 10.3 Exigences d'Âge par Juridiction

| Juridiction | Âge Minimum pour le Consentement Numérique | Loi Applicable |
|-------------|---------------------------------------------|----------------|
| UE (par défaut) | 16 ans | Art. 8 du RGPD |
| UE (option d'État membre) | 13–16 ans (variable) | Art. 8(1) du RGPD |
| Royaume-Uni | 13 ans | RGPD UK / AADC |
| États-Unis | 13 ans | COPPA |
| France | 15 ans | RGPD + Loi Informatique et Libertés |
| Brésil | 12 ans (avec consentement parental jusqu'à 18) | Art. 14 de la LGPD |
| Corée du Sud | 14 ans | PIPA |
| Japon | 15 ans (lignes directrices) | APPI |
| Chine | 14 ans | Art. 28 de la PIPL |
| Inde | 18 ans (avec exceptions) | Loi DPDP |

### 10.4 Consentement Parental

Lorsque le consentement parental est requis, le Protocole prend en charge :
- Le consentement parental vérifiable via des identifiants parent/tuteur vérifiés au Niveau 3 ou 4
- La restriction par âge via la vérification de preuve ZK au niveau de la partie de confiance
- Les mécanismes permettant aux parents de consulter, modifier ou révoquer le consentement

### 10.5 Conformité COPPA (États-Unis)

Nous respectons la COPPA. Nous ne collectons pas sciemment des informations personnelles d'enfants de moins de 13 ans sans consentement parental vérifiable.

### 10.6 Code de Conception Appropriée à l'Âge (Royaume-Uni)

Nous nous engageons à respecter les principes du Code AADC du Royaume-Uni, notamment :
- L'évaluation de l'intérêt supérieur de l'enfant
- L'application appropriée à l'âge
- La minimisation des données
- Les paramètres par défaut protecteurs pour les enfants
- La transparence adaptée à l'âge de l'enfant

---

## 11. Sécurité

### 11.1 Sécurité Cryptographique

Le Protocole Signet emploie :
- **Signatures Schnorr** sur la courbe secp256k1 pour toute signature d'identifiants
- **Bulletproofs** pour les preuves à divulgation nulle de tranche d'âge
- **Signatures en anneau** pour les preuves anonymes d'appartenance à un groupe
- **Future couche ZK** prévue pour des types de preuves supplémentaires (ZK-SNARKs/ZK-STARKs)

### 11.2 Sécurité Organisationnelle

Nous mettons en œuvre :
- Des contrôles d'accès et des principes de moindre privilège
- Le chiffrement en transit (TLS 1.2+) pour tout service centralisé
- Des évaluations de sécurité et des tests de pénétration réguliers
- Des procédures de réponse aux incidents
- La formation du personnel sur la protection des données
- Des pratiques de développement sécurisé

### 11.3 Modèle de Sécurité Décentralisé

L'architecture décentralisée du Protocole offre des avantages de sécurité inhérents :
- Aucun point de défaillance unique
- Aucune base de données centralisée à pirater
- Gestion des clés contrôlée par l'utilisateur
- Vérification cryptographique sans intermédiaires de confiance

### 11.4 Notification de Violations

En cas de violation de données personnelles affectant nos systèmes centralisés :
- Nous notifierons l'autorité de contrôle compétente dans les 72 heures (RGPD) ou selon la loi applicable
- Nous notifierons les personnes concernées sans retard injustifié lorsque la violation est susceptible d'entraîner un risque élevé
- Nous documenterons la violation, ses effets et les mesures correctives

---

## 12. Cookies et Technologies de Suivi

Le Protocole Signet **n'utilise pas** :
- De cookies
- De balises web ou pixels de suivi
- D'empreintes numériques de navigateur
- De stockage local à des fins de suivi
- De services d'analyse ou de suivi tiers

Si des services auxiliaires utilisent des cookies, un avis séparé sur les cookies sera fourni avec les mécanismes de consentement appropriés.

---

## 13. Prise de Décision Automatisée et Profilage

### 13.1 Calcul du Signet IQ

Le Protocole calcule des scores Signet IQ basés sur :
- Le niveau de vérification (1–4)
- Le nombre et la qualité des garants
- Les qualifications et la réputation du vérificateur
- L'ancienneté et l'historique des identifiants

Ces scores Signet IQ sont calculés algorithmiquement et sont visibles par les parties de confiance. Ils ne constituent pas une prise de décision automatisée avec effets juridiques au sens de l'Art. 22 du RGPD.

### 13.2 Pas de Profilage à des Fins Marketing

Nous ne pratiquons pas de profilage à des fins de marketing, de publicité ou d'analyse comportementale.

---

## 14. Liens et Services de Tiers

Le Protocole Signet peut interopérer avec :
- Des relais Nostr (opérés indépendamment)
- Des clients Nostr (tels que Fathom, l'implémentation de référence)
- Des organismes professionnels et registres réglementaires

Ces tiers ont leurs propres politiques de confidentialité. Nous ne sommes pas responsables de leurs pratiques en matière de données.

---

## 15. Modifications de cette Politique de Confidentialité

Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Les modifications seront indiquées par la mise à jour de la date de « Dernière Mise à Jour ». Pour les modifications substantielles, nous fournirons un avis via :
- Une annonce par événement Nostr
- Une mise à jour du dépôt de spécifications du Protocole
- Une notification directe lorsque possible

Votre utilisation continue du Protocole après les modifications constitue l'acceptation de la Politique de Confidentialité mise à jour.

---

## 16. Dispositions Spécifiques par Juridiction

### 16.1 Union Européenne — Dispositions Supplémentaires

Lorsque nous traitons des données personnelles en vertu du RGPD, les dispositions du RGPD prévalent sur toute disposition contradictoire de cette Politique.

### 16.2 Californie — Dispositions Supplémentaires

**Ne Pas Vendre ni Partager Mes Informations Personnelles :** Nous ne vendons ni ne partageons d'informations personnelles au sens de la CCPA/CPRA.

### 16.3 Brésil — Dispositions Supplémentaires

Le DPD (Encarregado) peut être contacté à [DPO EMAIL] pour toute question relative à la LGPD.

### 16.4 Australie — Dispositions Supplémentaires

Nous respectons les Principes Australiens de Confidentialité (APPs) en vertu du Privacy Act 1988.

### 16.5 Nouvelle-Zélande — Dispositions Supplémentaires

Nous respectons le Privacy Act 2020.

### 16.6 Singapour — Dispositions Supplémentaires

Nous respectons le Personal Data Protection Act 2012 (PDPA).

### 16.7 Afrique du Sud — Dispositions Supplémentaires

Nous respectons le Protection of Personal Information Act 2013 (POPIA).

---

## 17. Nous Contacter

Pour toute question, préoccupation ou demande relative à cette Politique de Confidentialité :

**Demandes Générales :**
[ORGANIZATION NAME]
E-mail : [CONTACT EMAIL]

**Délégué à la Protection des Données :**
E-mail : [DPO EMAIL]

**Adresse Postale :**
[ORGANIZATION NAME]
[ADRESSE]

---

## 18. Déclarations Réglementaires

Selon la juridiction, nous maintenons des enregistrements ou déclarations auprès :
- De l'ICO (Royaume-Uni) — Numéro d'enregistrement : [NUMÉRO D'ENREGISTREMENT ICO]
- Des autorités de protection des données de l'UE/EEE applicables
- D'autres organismes réglementaires selon la loi

---

*Cette Politique de Confidentialité est fournie comme modèle pour le Protocole Signet. Elle ne constitue pas un avis juridique. [ORGANIZATION NAME] recommande de consulter un conseiller juridique qualifié familier avec les lois applicables de protection des données dans votre juridiction avant le déploiement.*

*Protocole Signet — Ébauche v0.1.0*
*Version du Document : 1.0*
