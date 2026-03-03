# Kinderschutzrichtlinie

**Signet-Protokoll — Entwurf v0.1.0**

*Vorlage — Konsultieren Sie einen qualifizierten Rechtsberater in Ihrer Gerichtsbarkeit vor der Bereitstellung.*

**Datum des Inkrafttretens:** [DATUM]
**Letzte Aktualisierung:** [DATUM]

---

## 1. Zweck

Diese Kinderschutzrichtlinie ("Richtlinie") legt die Verpflichtung von [ORGANIZATION NAME] zum Schutz von Kindern fest, die mit dem Signet-Protokoll interagieren oder davon betroffen sind. Die Stufe-4-Verifizierung des Protokolls (Professionelle Verifizierung — Erwachsener + Kind) befasst sich speziell mit der Identitätsverifizierung von Kindern.

Die Sicherheit und der Schutz der Privatsphäre von Kindern hat für uns höchste Priorität.

---

## 2. Geltungsbereich

Diese Richtlinie gilt für: alle Interaktionen mit Personen unter 18 Jahren; Stufe-4-Ausstellung und -Verifizierung; Altersverifizierungsprozesse mittels Zero-Knowledge-Beweisen; alle Mitarbeiter, Verifizierer und Dritte; alle Gerichtsbarkeiten.

---

## 3. Altersverifikation durch Zero-Knowledge-Beweise

Das Protokoll verwendet Bulletproofs zur Altersverifikation: beweist ohne zu enthüllen, kann nicht rückgängig gemacht werden, wird kryptografisch verifiziert, einmal ausgestellt und mehrfach verwendet.

### Standard-Altersbereiche

| Bereich | Beschreibung | Anwendungsfall |
|---------|-------------|----------------|
| Unter 13 | Unter COPPA-Schwelle | Volle elterliche Einwilligung erforderlich |
| 13–15 | Über COPPA, unter einigen DSGVO-Schwellen | Elterliche Einwilligung möglicherweise erforderlich |
| 16–17 | Über den meisten digitalen Einwilligungsaltern | Eigenständige Einwilligung in den meisten Gerichtsbarkeiten |
| 18+ | Volljährigkeit | Volle eigenständige Einwilligung |

---

## 4. Mechanismen der Elterlichen Einwilligung

| Gerichtsbarkeit | Digitales Einwilligungsalter | Erforderlicher Mechanismus |
|-----------------|------------------------------|---------------------------|
| Vereinigte Staaten (COPPA) | 13 | Überprüfbare elterliche Einwilligung |
| EU (DSGVO Standard) | 16 | Angemessene Überprüfungsbemühungen |
| Deutschland | 16 | DSGVO + BDSG |
| Vereinigtes Königreich | 13 | Altersangemessene Überprüfung |
| Brasilien | 12 (mit Einwilligung bis 18) | Spezifische, hervorgehobene Einwilligung |
| Südkorea | 14 | Einwilligung des gesetzlichen Vertreters |
| Indien | 18 | Überprüfbare Einwilligung des Elternteils/Vormunds |
| China | 14 | Separate Einwilligung des Elternteils/Vormunds |

Das Protokoll unterstützt: Stufe-3/4-verifizierte Eltern-/Vormundberechtigungsnachweise, Co-Verifizierung und delegierte Einwilligung. Eltern können die Einwilligung jederzeit durch ein Widerrufsereignis (Typ 30475) zurückziehen.

---

## 5. Datenminimierung für Kinder

Strengste Minimierungsprinzipien. Erfasst: Nostr-Öffentlicher Schlüssel des Kindes, Altersbereichsbeweis (ZK), Einwilligungsnachweis der Eltern, Berechtigungsnachweis-Metadaten. **Nicht** erfasst: Name, Geburtsdatum, Foto, Identifikationsnummer, Standort, Schule, Verhaltensdaten, Nutzungsverfolgung.

---

## 6. Verbotene Nutzungen

Streng verboten: Profiling, Verfolgung, zielgerichtete Werbung, Datenmonetarisierung, automatisierte Entscheidungsfindung mit rechtlichen Auswirkungen, Überwachung, Social Scoring, Nudging-Techniken, unnötige Datenerhebung, Weitergabe ohne Einwilligung.

---

## 7. Meldung und Reaktion bei Vorfällen

Kritische Vorfälle (sofort): Verletzung von Kinderdaten, betrügerische Stufe-4-Berechtigungsnachweise, Kompromittierung des Einwilligungsmechanismus, Verdacht auf Ausbeutung. Hohe Priorität (4 Stunden): Ausnutzung der Altersverifikation, Missbrauch durch vertrauende Partei.

---

## 8. Gerichtsbarkeit-Spezifische Anforderungen

**Vereinigtes Königreich:** AADC — 15 Standards. **Vereinigte Staaten:** COPPA. **Europäische Union:** DSGVO Art. 8 (Deutschland: 16 Jahre). Jugendschutzgesetz, Jugendmedienschutz-Staatsvertrag. **Australien:** Privacy Act + Online Safety Act. **Südkorea:** PIPA + Jugendschutzgesetz. **Brasilien:** LGPD Art. 14. **Indien:** DPDP-Gesetz 2023.

---

## 9. Kontakt

**Kinderschutzbeauftragter:** [CONTACT EMAIL]
**Datenschutzbeauftragter:** [DPO EMAIL]

**Notfallmeldung:**
- UK: Internet Watch Foundation
- US: NCMEC CyberTipline
- EU: INHOPE
- AU: eSafety Commissioner

---

*Diese Kinderschutzrichtlinie dient als Vorlage. Sie stellt keine Rechtsberatung dar. Konsultieren Sie einen qualifizierten Rechtsberater vor der Bereitstellung.*

*Signet-Protokoll — Entwurf v0.1.0*
*Dokumentversion: 1.0*
