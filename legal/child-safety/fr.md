# Politique de Sécurité des Enfants

**Protocole Signet — Ébauche v0.1.0**

*Modèle — Consultez un conseiller juridique qualifié dans votre juridiction avant le déploiement.*

**Date d'Entrée en Vigueur :** [DATE]
**Dernière Mise à Jour :** [DATE]

---

## 1. Objectif

Cette Politique de Sécurité des Enfants (« Politique ») établit l'engagement de [ORGANIZATION NAME] à protéger les enfants qui interagissent avec le Protocole Signet. La vérification de Niveau 4 du Protocole (Vérification Professionnelle — Adulte + Enfant) traite spécifiquement de la vérification d'identité des enfants.

La sécurité et la vie privée des enfants sont notre préoccupation primordiale.

---

## 2. Champ d'Application

Cette Politique s'applique à : toutes les interactions impliquant des personnes de moins de 18 ans ; l'émission et la vérification d'identifiants de Niveau 4 ; les processus de vérification d'âge par preuves à divulgation nulle ; tout le personnel, vérificateurs et tiers ; toutes les juridictions.

---

## 3. Vérification de l'Âge par Preuves à Divulgation Nulle

Le Protocole utilise Bulletproofs pour la vérification de l'âge : preuve sans révélation, non rétro-ingéniérable, vérifiée cryptographiquement, émise une fois et utilisée plusieurs fois.

### Catégories d'âge standard

| Tranche | Description | Cas d'Usage |
|---------|-------------|-------------|
| Moins de 13 | En dessous du seuil COPPA | Consentement parental complet requis |
| 13–15 | Au-dessus de COPPA, en dessous de certains seuils RGPD | Consentement parental possible selon juridiction |
| 16–17 | Au-dessus de la plupart des âges de consentement numérique | Consentement indépendant dans la plupart des juridictions |
| 18+ | Majorité | Consentement indépendant complet |

---

## 4. Mécanismes de Consentement Parental

| Juridiction | Âge de Consentement Numérique | Mécanisme Requis |
|-------------|-------------------------------|------------------|
| États-Unis (COPPA) | 13 | Consentement parental vérifiable |
| UE (RGPD défaut) | 16 | Efforts raisonnables de vérification |
| France | 15 | RGPD + Loi Informatique et Libertés |
| Royaume-Uni | 13 | Vérification appropriée à l'âge |
| Brésil | 12 (avec consentement jusqu'à 18) | Consentement spécifique et proéminent |
| Corée du Sud | 14 | Consentement du représentant légal |
| Inde | 18 | Consentement vérifiable du parent/tuteur |
| Chine | 14 | Consentement séparé du parent/tuteur |

Le Protocole prend en charge : identifiant vérifié parent/tuteur Niveau 3/4, co-vérification et consentement délégué. Les parents peuvent retirer leur consentement à tout moment par événement de révocation (type 30475).

---

## 5. Minimisation des Données pour les Enfants

Principes les plus stricts appliqués. Collecté : clé publique Nostr de l'enfant, preuve de tranche d'âge (ZK), enregistrement de consentement parental, métadonnées d'identifiant. **Non** collecté : nom, date de naissance, photographie, numéro d'identification, localisation, école, données comportementales, suivi d'utilisation.

---

## 6. Usages Interdits

Strictement interdits : profilage, suivi, publicité ciblée, monétisation des données, décisions automatisées avec effets juridiques, surveillance, notation sociale, techniques de nudge, collecte inutile, partage sans consentement.

---

## 7. Signalement et Réponse aux Incidents

Incidents critiques (immédiat) : violation de données d'enfants, identifiant Niveau 4 frauduleux, compromission du consentement parental, exploitation suspectée. Incidents élevés (4 heures) : exploitation de la vérification d'âge, abus par partie de confiance.

---

## 8. Exigences par Juridiction

**Royaume-Uni :** Code AADC — 15 standards. **États-Unis :** COPPA. **Union Européenne :** RGPD Art. 8 (France : 15 ans). **Australie :** Privacy Act + Online Safety Act. **Corée du Sud :** PIPA + Loi de Protection de la Jeunesse. **Brésil :** LGPD Art. 14. **Inde :** DPDP Act 2023.

---

## 9. Contact

**Responsable de la Sécurité des Enfants :** [CONTACT EMAIL]
**Délégué à la Protection des Données :** [DPO EMAIL]

**Signalement d'urgence :**
- RU : Internet Watch Foundation
- US : NCMEC CyberTipline
- UE : INHOPE
- AU : eSafety Commissioner

---

*Cette Politique est fournie comme modèle. Elle ne constitue pas un avis juridique. Consultez un conseiller juridique qualifié avant le déploiement.*

*Protocole Signet — Ébauche v0.1.0*
*Version du Document : 1.0*
