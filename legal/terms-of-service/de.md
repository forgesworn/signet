# Nutzungsbedingungen

**Signet-Protokoll — Entwurf v0.1.0**

*Vorlage — Konsultieren Sie einen qualifizierten Rechtsberater in Ihrer Gerichtsbarkeit vor der Bereitstellung.*

**Datum des Inkrafttretens:** [DATUM]
**Letzte Aktualisierung:** [DATUM]

---

## 1. Annahme der Bedingungen

Durch den Zugang, die Nutzung oder die Teilnahme am Signet-Protokoll (dem „Protokoll"), einschließlich, aber nicht beschränkt auf die Erstellung von Berechtigungsnachweisen, die Ausstellung oder den Empfang von Bürgschaften, die Tätigkeit als Verifizierer oder das Vertrauen auf Protokoll-Berechtigungsnachweise, erklären Sie sich (der „Nutzer", „Sie" oder „Ihr") mit diesen Nutzungsbedingungen (den „Bedingungen") einverstanden. Wenn Sie mit diesen Bedingungen nicht einverstanden sind, dürfen Sie das Protokoll nicht nutzen.

Diese Bedingungen stellen eine rechtsverbindliche Vereinbarung zwischen Ihnen und [ORGANIZATION NAME] („wir", „uns" oder „unser") dar.

Wenn Sie das Protokoll im Namen einer Organisation nutzen, erklären und garantieren Sie, dass Sie die Befugnis haben, diese Organisation an diese Bedingungen zu binden.

---

## 2. Berechtigung

### 2.1 Allgemeine Berechtigung

Zur Nutzung des Protokolls müssen Sie:
- Mindestens das Alter der digitalen Einwilligung in Ihrer Gerichtsbarkeit erreicht haben
- Die Geschäftsfähigkeit zum Abschluss einer verbindlichen Vereinbarung besitzen
- Nicht durch geltende Gesetze oder Vorschriften an der Nutzung gehindert sein
- Nicht zuvor wegen Verstoßes gegen diese Bedingungen ausgeschlossen worden sein

### 2.2 Altersanforderungen

| Gerichtsbarkeit | Mindestalter | Mit Elterlicher Einwilligung |
|-----------------|-------------|------------------------------|
| Europäische Union (Standard) | 16 | 13 (je nach Mitgliedstaat) |
| Deutschland | 16 | Nicht vorgesehen (DSGVO-Standardalter) |
| Vereinigtes Königreich | 13 | Entfällt |
| Vereinigte Staaten | 13 | Unter 13 mit COPPA-konformer elterlicher Einwilligung |
| Brasilien | 18 | 12 mit elterlicher Einwilligung |
| Südkorea | 14 | Unter 14 mit elterlicher Einwilligung |
| Japan | 15 | Unter 15 mit elterlicher Einwilligung |
| China | 14 | Unter 14 mit elterlicher Einwilligung |
| Indien | 18 | Gemäß DPDP-Gesetz |

### 2.3 Verifizierer-Berechtigung

Für die Tätigkeit als professioneller Verifizierer (Stufe 3 oder 4) müssen Sie zusätzlich: eine gültige Berufslizenz besitzen, in der relevanten Gerichtsbarkeit zugelassen sein, die separate Verifizierer-Vereinbarung unterzeichnen und eine Berufshaftpflichtversicherung unterhalten.

---

## 3. Beschreibung des Protokolls

### 3.1 Überblick

Das Signet-Protokoll ist ein dezentrales Identitätsverifizierungsprotokoll für das Nostr-Netzwerk. Es ermöglicht die Erstellung und Überprüfung von Identitätsnachweisen mittels Zero-Knowledge-Beweisen, Ringsignaturen und eines gestuften Vertrauenssystems, ohne zugrunde liegende personenbezogene Daten preiszugeben.

### 3.2 Verifizierungsstufen

- **Stufe 1 — Selbsterklärt:** Vom Nutzer erstellte Berechtigungsnachweise ohne externe Verifizierung.
- **Stufe 2 — Vertrauensnetzwerk:** Berechtigungsnachweise, die durch Bürgschaften anderer Teilnehmer gestärkt werden.
- **Stufe 3 — Professionelle Verifizierung (Erwachsener):** Von einem lizenzierten professionellen Verifizierer persönlich verifizierte Berechtigungsnachweise.
- **Stufe 4 — Professionelle Verifizierung (Erwachsener + Kind):** Stufe-3-Verifizierung erweitert auf die Kinderidentitätsverifizierung mit elterlicher Aufsicht.

### 3.3 Ereignistypen

30470 (Berechtigungsnachweise), 30471 (Bürgschaften), 30472 (Richtlinien), 30473 (Verifizierer-Registrierung), 30474 (Herausforderungen), 30475 (Widerrufe), 30476 (Identitätsbrücke), 30477 (Delegation), 30478–30480 (Wahlsystem). Nummern sind Platzhalter.

### 3.4 Kryptografische Komponenten

Schnorr-Signaturen (secp256k1), Bulletproofs für Altersbereichsbeweise, Ringsignaturen, geplante ZK-Schicht (ZK-SNARKs/ZK-STARKs).

### 3.5 Dezentrale Natur

Das Protokoll arbeitet auf dem Nostr-Netzwerk ohne zentralen Server, Datenbank oder Autorität. [ORGANIZATION NAME] entwickelt und pflegt die Protokollspezifikation, kontrolliert aber nicht das Netzwerk.

---

## 4. Nutzerpflichten

### 4.1 Allgemeine Pflichten

1. **Richtigkeit:** Wahrheitsgemäße Angaben bei der Erstellung von Berechtigungsnachweisen.
2. **Schlüsselsicherheit:** Sicherer Umgang mit Ihrem Nostr-Privatschlüssel (nsec).
3. **Rechtskonformität:** Einhaltung aller geltenden Gesetze und Vorschriften.
4. **Verantwortungsvolle Nutzung:** Nutzung des Protokolls nach Treu und Glauben.
5. **Meldepflicht:** Unverzügliche Meldung von Sicherheitslücken oder Missbrauch an [CONTACT EMAIL].

### 4.2 Verbotene Nutzung

Sie dürfen NICHT:
1. Falsche, irreführende oder betrügerische Berechtigungsnachweise erstellen
2. Eine andere Person oder Einrichtung nachahmen
3. Versuchen, Zero-Knowledge-Beweise rückzuingeniieren
4. Das Protokoll für illegale Aktivitäten nutzen
5. Die kryptografische Infrastruktur des Protokolls angreifen
6. Das Netzwerk mit illegitimen Ereignissen überfluten
7. Mit Verifizierern bei der Ausstellung unberechtigter Berechtigungsnachweise zusammenwirken
8. Das Protokoll zur Umgehung von Altersbeschränkungen oder Kinderschutzmaßnahmen ausnutzen
9. Automatisierte Systeme zur Massengenierung von Berechtigungsnachweisen verwenden
10. Den Betrieb des Protokolls oder des Nostr-Netzwerks stören

### 4.3 Bürgschaftspflichten (Stufe 2)

Bei der Bürgschaft für einen anderen Nutzer müssen Sie eine echte Grundlage haben, dürfen keine Bezahlung annehmen, können die Bürgschaft jederzeit widerrufen und verstehen, dass Ihr Bürgschaftsverhalten Ihren eigenen Signet IQ beeinflusst.

---

## 5. Verifizierer-Pflichten

Verifizierer müssen ihre Berufsqualifikationen aufrechterhalten, Verifizierungen gemäß der Verifizierer-Vereinbarung durchführen, die Identität persönlich überprüfen, genaue Aufzeichnungen führen und Kompromittierungen unverzüglich melden. Verifizierer sind unabhängig für ihre Verifizierungen verantwortlich.

---

## 6. Ausstellung und Lebenszyklus von Berechtigungsnachweisen

Berechtigungsnachweise werden durch Veröffentlichung von Ereignissen des Typs 30470 erstellt und können durch den Inhaber, den ausstellenden Verifizierer oder das Protokoll durch Ereignisse des Typs 30475 widerrufen werden. [ORGANIZATION NAME] garantiert nicht die Akzeptanz eines Berechtigungsnachweises durch eine vertrauende Partei.

---

## 7. Geistiges Eigentum

Die Protokollspezifikation wird unter einer Open-Source-Lizenz veröffentlicht. „Signet-Protokoll" und zugehörige Logos sind Marken von [ORGANIZATION NAME]. Sie behalten das Eigentum an Ihren Inhalten.

---

## 8. Gewährleistungsausschluss

DAS PROTOKOLL WIRD „WIE BESEHEN" UND „WIE VERFÜGBAR" OHNE JEGLICHE GEWÄHRLEISTUNG BEREITGESTELLT, WEDER AUSDRÜCKLICH NOCH STILLSCHWEIGEND. [ORGANIZATION NAME] ÜBERNIMMT KEINE GARANTIE FÜR DIE RICHTIGKEIT VON BERECHTIGUNGSNACHWEISEN, DIE KOMPETENZ VON VERIFIZIERERN ODER DEN UNTERBRECHUNGSFREIEN BETRIEB DES PROTOKOLLS.

---

## 9. Haftungsbeschränkung

SOWEIT NACH GELTENDEM RECHT ZULÄSSIG, HAFTET [ORGANIZATION NAME] NICHT FÜR INDIREKTE, ZUFÄLLIGE, BESONDERE, FOLGE- ODER STRAFSCHÄDEN. DIE GESAMTHAFTUNG IST BESCHRÄNKT AUF DEN HÖHEREN BETRAG VON: (A) DEM BETRAG, DEN SIE IN DEN LETZTEN 12 MONATEN GEZAHLT HABEN, ODER (B) [HAFTUNGSHÖCHSTBETRAG].

Diese Beschränkungen gelten nicht für gesetzlich unabdingbare Haftung, Vorsatz oder grobe Fahrlässigkeit. Nichts in diesen Bedingungen beeinträchtigt Ihre gesetzlichen Verbraucherrechte.

---

## 10. Freistellung

Sie verpflichten sich, [ORGANIZATION NAME] von allen Ansprüchen, Schäden, Verlusten und Kosten freizustellen, die aus Ihrer Nutzung des Protokolls, Ihrem Verstoß gegen diese Bedingungen oder gegen geltendes Recht entstehen.

---

## 11. Anwendbares Recht und Streitbeilegung

### 11.1 Anwendbares Recht

Diese Bedingungen unterliegen dem Recht von [GERICHTSBARKEIT DES ANWENDBAREN RECHTS].

### 11.2 Streitbeilegungsverfahren

**Schritt 1 — Verhandlung:** 30 Tage gütliche Verhandlung.
**Schritt 2 — Mediation:** Mediation durch [MEDIATIONSSTELLE].
**Schritt 3 — Schiedsverfahren:** Bindendes Schiedsverfahren durch [SCHIEDSGERICHTSSTELLE] am [SCHIEDSORT].

### 11.3 EU-Verbraucherrechte

Als Verbraucher in der Europäischen Union können Sie auch eine Beschwerde über die EU-Plattform zur Online-Streitbeilegung einreichen: [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).

---

## 12. Beendigung

Sie können die Nutzung des Protokolls jederzeit einstellen. Bereits veröffentlichte Ereignisse verbleiben möglicherweise auf Nostr-Relais. Wir behalten uns das Recht vor, Verifizierer-Berechtigungsnachweise aus wichtigem Grund zu widerrufen.

---

## 13. Änderungen

Wir behalten uns das Recht vor, diese Bedingungen mit 30 Tagen Vorankündigung für wesentliche Änderungen zu ändern. Ihre fortgesetzte Nutzung nach einer Änderung gilt als Annahme.

---

## 14. Allgemeine Bestimmungen

### 14.1 Gesamte Vereinbarung

Diese Bedingungen zusammen mit der Datenschutzerklärung und anwendbaren Vereinbarungen bilden die gesamte Vereinbarung.

### 14.2 Salvatorische Klausel

Sollte eine Bestimmung unwirksam sein, bleiben die übrigen Bestimmungen in Kraft.

### 14.3 Verzicht

Die Nichtausübung eines Rechts stellt keinen Verzicht dar.

### 14.4 Abtretung

Sie dürfen diese Bedingungen nicht ohne unsere Zustimmung abtreten.

### 14.5 Höhere Gewalt

Keine Partei haftet für Verzögerungen aufgrund höherer Gewalt.

### 14.6 Exportkontrolle

Sie verpflichten sich zur Einhaltung aller anwendbaren Export- und Sanktionsgesetze.

---

## 15. Kontakt

**[ORGANIZATION NAME]**
E-Mail: [CONTACT EMAIL]
Adresse: [ADRESSE]

---

*Diese Nutzungsbedingungen dienen als Vorlage für das Signet-Protokoll. Sie stellen keine Rechtsberatung dar. [ORGANIZATION NAME] empfiehlt, einen qualifizierten Rechtsberater zu konsultieren, bevor die Bereitstellung erfolgt.*

*Signet-Protokoll — Entwurf v0.1.0*
*Dokumentversion: 1.0*
