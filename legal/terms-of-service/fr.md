# Conditions d'Utilisation

**Protocole Signet — Ébauche v0.1.0**

*Modèle — Consultez un conseiller juridique qualifié dans votre juridiction avant le déploiement.*

**Date d'Entrée en Vigueur :** [DATE]
**Dernière Mise à Jour :** [DATE]

---

## 1. Acceptation des Conditions

En accédant, utilisant ou participant au Protocole Signet (le « Protocole »), y compris, sans s'y limiter, la création d'identifiants, l'émission ou la réception de garants, l'action en tant que vérificateur ou la confiance dans les identifiants du Protocole, vous (« Utilisateur », « vous ») acceptez d'être lié par les présentes Conditions d'Utilisation (« Conditions »). Si vous n'acceptez pas ces Conditions, vous ne devez pas utiliser le Protocole.

Les présentes Conditions constituent un accord juridiquement contraignant entre vous et [ORGANIZATION NAME] (« nous », « notre »).

Si vous utilisez le Protocole pour le compte d'une organisation, vous déclarez et garantissez que vous avez l'autorité pour engager cette organisation.

---

## 2. Éligibilité

### 2.1 Éligibilité Générale

Pour utiliser le Protocole, vous devez :
- Avoir au moins l'âge du consentement numérique dans votre juridiction
- Avoir la capacité juridique de conclure un accord contraignant
- Ne pas être interdit d'utiliser le Protocole en vertu de la loi applicable
- Ne pas avoir été précédemment suspendu ou exclu du Protocole

### 2.2 Exigences d'Âge

| Juridiction | Âge Minimum | Avec Consentement Parental |
|-------------|-------------|---------------------------|
| Union Européenne (par défaut) | 16 | 13 (variable par État membre) |
| France | 15 | En dessous de 15 avec consentement parental |
| Royaume-Uni | 13 | S/O |
| États-Unis | 13 | Moins de 13 avec consentement parental COPPA |
| Brésil | 18 | 12 avec consentement parental |
| Corée du Sud | 14 | Moins de 14 avec consentement parental |
| Japon | 15 | Moins de 15 avec consentement parental |
| Chine | 14 | Moins de 14 avec consentement parental |
| Inde | 18 | Selon la loi DPDP |

### 2.3 Éligibilité des Vérificateurs

Pour agir en tant que vérificateur professionnel (Niveau 3 ou 4), vous devez en outre :
- Détenir une licence professionnelle en cours de validité (juridique, médicale, notariale)
- Être autorisé à exercer dans la juridiction concernée
- Signer l'Accord de Vérificateur séparé
- Maintenir une assurance de responsabilité professionnelle

---

## 3. Description du Protocole

### 3.1 Aperçu

Le Protocole Signet est un protocole de vérification d'identité décentralisé pour le réseau Nostr. Il permet aux utilisateurs de créer et vérifier des identifiants d'identité à l'aide de preuves à divulgation nulle de connaissance, de signatures en anneau et d'un système de confiance à plusieurs niveaux, sans révéler les données personnelles sous-jacentes.

### 3.2 Niveaux de Vérification

- **Niveau 1 — Auto-déclaré :** Identifiants générés par l'utilisateur sans vérification externe.
- **Niveau 2 — Réseau de Confiance :** Identifiants renforcés par des garants d'autres participants.
- **Niveau 3 — Vérification Professionnelle (Adulte) :** Identifiants vérifiés par un vérificateur professionnel licencié.
- **Niveau 4 — Vérification Professionnelle (Adulte + Enfant) :** Vérification de Niveau 3 étendue aux enfants avec supervision parentale.

### 3.3 Types d'Événements

- **30470** — Événements d'identifiants
- **30471** — Événements de garants
- **30472** — Événements de politique
- **30473** — Événements d'inscription des vérificateurs
- **30474** — Événements de défi
- **30475** — Événements de révocation

### 3.4 Composants Cryptographiques

Le Protocole utilise : les signatures Schnorr sur secp256k1, les Bulletproofs pour les preuves de tranche d'âge, les signatures en anneau et une future couche ZK planifiée.

### 3.5 Nature Décentralisée

Le Protocole fonctionne sur le réseau Nostr et ne dispose d'aucun serveur central, base de données ou autorité. [ORGANIZATION NAME] développe et maintient la spécification du Protocole mais ne contrôle pas le réseau.

---

## 4. Obligations de l'Utilisateur

### 4.1 Obligations Générales

1. **Exactitude :** Fournir des informations véridiques lors de la création d'identifiants.
2. **Sécurité des Clés :** Protéger votre clé privée Nostr (nsec).
3. **Conformité :** Respecter toutes les lois et réglementations applicables.
4. **Usage Responsable :** Utiliser le Protocole de bonne foi.
5. **Signalement :** Signaler rapidement toute vulnérabilité ou usage abusif à [CONTACT EMAIL].

### 4.2 Usages Interdits

Vous NE devez PAS :
1. Créer des identifiants faux, trompeurs ou frauduleux
2. Usurper l'identité d'une autre personne ou entité
3. Tenter de rétro-ingéniérer les preuves à divulgation nulle
4. Utiliser le Protocole pour faciliter des activités illégales
5. Attaquer l'infrastructure cryptographique du Protocole
6. Spammer le réseau avec des événements illégitimes
7. S'entendre avec des vérificateurs pour émettre des identifiants injustifiés
8. Exploiter le Protocole pour contourner les restrictions d'âge
9. Utiliser des systèmes automatisés pour générer en masse des identifiants
10. Interférer avec le fonctionnement du Protocole ou du réseau Nostr

### 4.3 Obligations de Garant (Niveau 2)

Lorsque vous garantissez un autre utilisateur :
- Vous devez avoir une base réelle pour le garant
- Vous ne devez pas accepter de paiement en échange de garants
- Vous pouvez révoquer un garant à tout moment
- Votre comportement de garant affecte votre propre score de confiance

---

## 5. Obligations du Vérificateur

Les vérificateurs doivent maintenir leurs qualifications professionnelles, effectuer des vérifications conformément à l'Accord de Vérificateur, vérifier l'identité en personne, maintenir des dossiers précis et signaler immédiatement tout compromis. Les vérificateurs sont indépendamment responsables de leurs vérifications.

---

## 6. Émission et Cycle de Vie des Identifiants

Les identifiants sont créés via des événements de type 30470. Ils peuvent être révoqués par le titulaire, le vérificateur émetteur ou le Protocole via des événements de type 30475. [ORGANIZATION NAME] ne garantit pas l'acceptation d'un identifiant par une partie de confiance.

---

## 7. Propriété Intellectuelle

La spécification du Protocole est publiée sous licence open-source. « Protocole Signet » et les logos associés sont des marques de [ORGANIZATION NAME]. Vous conservez la propriété de tout contenu que vous créez.

---

## 8. Exclusions de Garantie

LE PROTOCOLE EST FOURNI « TEL QUEL » ET « SELON DISPONIBILITÉ » SANS GARANTIES D'AUCUNE SORTE, EXPRESSES OU IMPLICITES. [ORGANIZATION NAME] NE GARANTIT PAS L'EXACTITUDE DES IDENTIFIANTS, LA COMPÉTENCE DES VÉRIFICATEURS, NI LE FONCTIONNEMENT ININTERROMPU DU PROTOCOLE.

---

## 9. Limitation de Responsabilité

DANS LA MESURE MAXIMALE PERMISE PAR LA LOI APPLICABLE, [ORGANIZATION NAME] NE SERA PAS RESPONSABLE DES DOMMAGES INDIRECTS, ACCESSOIRES, SPÉCIAUX, CONSÉCUTIFS OU PUNITIFS. LA RESPONSABILITÉ TOTALE NE DÉPASSERA PAS LE PLUS ÉLEVÉ DE : (A) LE MONTANT PAYÉ PAR VOUS DANS LES 12 MOIS PRÉCÉDENTS, OU (B) [MONTANT LIMITE DE RESPONSABILITÉ].

Ces limitations ne s'appliquent pas à la responsabilité qui ne peut être exclue par la loi, à la faute intentionnelle ou à la négligence grave. Rien dans ces Conditions n'affecte vos droits légaux en tant que consommateur.

---

## 10. Indemnisation

Vous acceptez d'indemniser et de dégager de toute responsabilité [ORGANIZATION NAME] contre toutes réclamations, dommages, pertes et frais découlant de votre utilisation du Protocole, de votre violation de ces Conditions, ou de votre violation de toute loi applicable.

---

## 11. Loi Applicable et Résolution des Litiges

### 11.1 Loi Applicable

Ces Conditions sont régies par les lois de [JURIDICTION DE LOI APPLICABLE].

### 11.2 Résolution des Litiges

**Étape 1 — Négociation :** Négociation de bonne foi pendant 30 jours.
**Étape 2 — Médiation :** Médiation administrée par [ORGANISME DE MÉDIATION].
**Étape 3 — Arbitrage :** Arbitrage contraignant administré par [ORGANISME D'ARBITRAGE] à [SIÈGE DE L'ARBITRAGE].

### 11.3 Droits des Consommateurs de l'UE

Si vous êtes un consommateur dans l'Union Européenne, vous pouvez également déposer une plainte via la plateforme de Règlement en Ligne des Litiges de l'UE : [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).

---

## 12. Résiliation

Vous pouvez cesser d'utiliser le Protocole à tout moment. Les événements publiés peuvent rester sur les relais Nostr. Nous nous réservons le droit de révoquer les identifiants de vérificateur pour cause justifiée.

---

## 13. Modifications

Nous nous réservons le droit de modifier ces Conditions avec un préavis de 30 jours pour les changements substantiels. Votre utilisation continue du Protocole après les modifications constitue l'acceptation.

---

## 14. Dispositions Générales

### 14.1 Intégralité de l'Accord

Ces Conditions, avec la Politique de Confidentialité et les accords applicables, constituent l'accord complet entre vous et [ORGANIZATION NAME].

### 14.2 Divisibilité

Si une disposition est invalide, les dispositions restantes restent en vigueur.

### 14.3 Renonciation

Le non-exercice d'un droit ne constitue pas une renonciation.

### 14.4 Cession

Vous ne pouvez pas céder ces Conditions sans notre consentement.

### 14.5 Force Majeure

Aucune partie n'est responsable des retards dus à des causes hors de son contrôle raisonnable.

### 14.6 Conformité aux Règles d'Exportation

Vous acceptez de respecter toutes les lois d'exportation et de sanctions applicables.

---

## 15. Contact

**[ORGANIZATION NAME]**
E-mail : [CONTACT EMAIL]
Adresse : [ADRESSE]

---

*Ces Conditions d'Utilisation sont fournies comme modèle pour le Protocole Signet. Elles ne constituent pas un avis juridique. [ORGANIZATION NAME] recommande de consulter un conseiller juridique qualifié avant le déploiement.*

*Protocole Signet — Ébauche v0.1.0*
*Version du Document : 1.0*
