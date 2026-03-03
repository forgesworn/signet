# Datenschutzerklärung

**Signet-Protokoll — Entwurf v0.1.0**

*Vorlage — Konsultieren Sie einen qualifizierten Rechtsberater in Ihrer Gerichtsbarkeit vor der Bereitstellung.*

**Datum des Inkrafttretens:** [DATUM]
**Letzte Aktualisierung:** [DATUM]

---

## 1. Einleitung

Diese Datenschutzerklärung beschreibt, wie [ORGANIZATION NAME] („wir", „uns" oder „unser") Informationen im Zusammenhang mit dem Signet-Protokoll (dem „Protokoll") erhebt, verwendet, offenlegt und schützt. Das Signet-Protokoll ist ein dezentrales Identitätsverifizierungsprotokoll für das Nostr-Netzwerk, das Zero-Knowledge-Beweise (Beweise ohne Offenlegung), Ringsignaturen und kryptografische Berechtigungsnachweise verwendet.

Das Signet-Protokoll wurde mit dem Schutz der Privatsphäre als Kernprinzip entwickelt. Es ermöglicht Nutzern, Behauptungen über ihre Identität — wie Altersbereich, beruflicher Status oder geografische Zuständigkeit — zu beweisen, ohne die zugrunde liegenden personenbezogenen Daten preiszugeben. Diese Datenschutzerklärung erläutert, welche begrenzten Dateninteraktionen stattfinden und wie diese gehandhabt werden.

Diese Erklärung gilt für alle Nutzer, Verifizierer, vertrauende Parteien und andere Teilnehmer, die mit dem Signet-Protokoll interagieren, unabhängig von ihrem Standort.

---

## 2. Verantwortlicher für die Datenverarbeitung

**Verantwortlicher:** [ORGANIZATION NAME]
**Sitzadresse:** [ADRESSE]
**Kontakt-E-Mail:** [CONTACT EMAIL]
**Datenschutzbeauftragter (DSB):** [DPO EMAIL]

Für Rechtsordnungen, die einen lokalen Vertreter erfordern:

- **EU-Vertreter (Art. 27 DSGVO):** [NAME UND ADRESSE DES EU-VERTRETERS]
- **UK-Vertreter (Art. 27 UK-DSGVO):** [NAME UND ADRESSE DES UK-VERTRETERS]
- **Brasilien (LGPD):** [VERTRETER IN BRASILIEN]
- **Südkorea (PIPA):** [VERTRETER IN SÜDKOREA]

---

## 3. Daten, die wir Erheben und Verarbeiten

Das Signet-Protokoll ist so konzipiert, dass die Datenerhebung minimiert wird. Da das Protokoll Zero-Knowledge-Beweise, Ringsignaturen und dezentrale Berechtigungsüberprüfung verwendet, verbleibt ein Großteil der Informationen ausschließlich unter der Kontrolle des Nutzers und wird niemals an uns übermittelt oder ist für uns zugänglich.

### 3.1 Datenkategorien

| Kategorie | Beschreibung | Quelle | Speicherort |
|-----------|-------------|--------|------------|
| **Nostr Öffentliche Schlüssel** | secp256k1 öffentliche Schlüssel (npub) für Protokoll-Interaktionen | Vom Nutzer generiert | Nostr-Relais (dezentral) |
| **Berechtigungsnachweis-Metadaten** | Nostr-Ereignistypen 30470–30475 mit Verifizierungsstufe, Ausstellungszeitstempeln, Ablaufdaten und Berechtigungstypkennungen | Bei der Ausstellung generiert | Nostr-Relais (dezentral) |
| **Zero-Knowledge-Beweise** | Bulletproofs für Altersbereichsverifizierung; zukünftige ZK-SNARK/ZK-STARK-Beweise für andere Behauptungen | Lokal vom Nutzer generiert | Nostr-Relais (dezentral) |
| **Ringsignaturen** | Kryptografische Signaturen, die die Zugehörigkeit zu einer Gruppe beweisen, ohne zu enthüllen, welches Mitglied signiert hat | Lokal vom Nutzer generiert | Nostr-Relais (dezentral) |
| **Verifizierungsstufen-Daten** | Stufe (1–4), die die Stärke der Identitätsverifizierung angibt | Bei der Verifizierung zugewiesen | In Berechtigungsereignissen eingebettet |
| **Bürgschaftsaufzeichnungen** | Ereignisse des Typs 30471 für Vertrauensnetzwerk-Befürwortungen | Von bürgenden Parteien erstellt | Nostr-Relais (dezentral) |
| **Richtlinienereignisse** | Ereignisse des Typs 30472 mit Anforderungen der vertrauenden Parteien | Von vertrauenden Parteien erstellt | Nostr-Relais (dezentral) |
| **Verifizierer-Registrierung** | Ereignisse des Typs 30473 zur Identifizierung professioneller Verifizierer | Von Verifizierern erstellt | Nostr-Relais (dezentral) |
| **Herausforderungs-/Antwortdaten** | Ereignisse des Typs 30474 für interaktive Verifizierung | Bei der Verifizierung generiert | Nostr-Relais (dezentral) |
| **Widerrufsaufzeichnungen** | Ereignisse des Typs 30475 für den Widerruf von Berechtigungsnachweisen | Bei Widerruf erstellt | Nostr-Relais (dezentral) |

### 3.2 Daten, die wir NICHT Erheben

Das Signet-Protokoll erhebt, verarbeitet oder speichert absichtlich **nicht**:

- Echte Namen, Adressen oder staatliche Identifikationsnummern
- Biometrische Daten
- Genaue Geburtsdaten (Altersbereichsbeweise zeigen nur, dass ein Nutzer in einem Bereich liegt)
- Finanzinformationen oder Zahlungsdaten
- Standortdaten oder IP-Adressen (auf Protokollebene; Relaisbetreiber können IP-Adressen unabhängig erheben)
- Browserverlauf oder Gerätefingerabdrücke
- E-Mail-Adressen (es sei denn, sie werden freiwillig für den Support bereitgestellt)
- Fotografien oder Bilder
- Die zugrunde liegenden Daten hinter einem Zero-Knowledge-Beweis

### 3.3 Von Dritten Verarbeitete Daten

Nostr-Relaisbetreiber verarbeiten unabhängig Daten, die über ihre Relais übertragen werden. Ihre Datenpraktiken unterliegen ihren eigenen Datenschutzerklärungen. Das Signet-Protokoll kontrolliert keine Relaisbetreiber.

---

## 4. Rechtsgrundlagen für die Verarbeitung

Wir verarbeiten Daten auf den folgenden Rechtsgrundlagen, abhängig von Ihrer Gerichtsbarkeit:

### 4.1 Europäische Union / Europäischer Wirtschaftsraum (DSGVO)

| Zweck | Rechtsgrundlage | DSGVO-Artikel |
|-------|----------------|---------------|
| Protokollbetrieb und Berechtigungsüberprüfung | Berechtigtes Interesse | Art. 6(1)(f) |
| Erfüllung rechtlicher Verpflichtungen | Rechtliche Verpflichtung | Art. 6(1)(c) |
| Vom Nutzer initiierte Berechtigungsausstellung | Vertragserfüllung | Art. 6(1)(b) |
| Kindersicherheit und Altersverifikation | Berechtigtes Interesse / Rechtliche Verpflichtung | Art. 6(1)(f) / Art. 6(1)(c) |

### 4.2 Vereinigtes Königreich (UK-DSGVO / Datenschutzgesetz 2018)

Es gelten dieselben Rechtsgrundlagen wie bei der EU-DSGVO, ergänzt durch das Datenschutzgesetz 2018 und den Age Appropriate Design Code (AADC).

### 4.3 Vereinigte Staaten (CCPA / CPRA / Landesgesetze)

Gemäß CCPA und CPRA:
- Wir **verkaufen** keine personenbezogenen Informationen.
- Wir **teilen** keine personenbezogenen Informationen für kontextübergreifende Verhaltenswerbung.
- Einwohner Kaliforniens haben das Recht auf Auskunft, Löschung, Berichtigung und Widerspruch.

### 4.4 Brasilien (LGPD)

Die Verarbeitung basiert auf berechtigtem Interesse (Art. 7, X), Erfüllung gesetzlicher Pflichten (Art. 7, II) und Vertragserfüllung (Art. 7, V).

### 4.5 Südkorea (PIPA)

Die Verarbeitung entspricht den Anforderungen des PIPA, einschließlich Minimierung der Datenerhebung, Zweckbindung und Einhaltung der Einwilligungsanforderungen.

### 4.6 Japan (APPI)

Die Verarbeitung entspricht dem geänderten APPI, einschließlich Zweckbestimmung, ordnungsgemäßer Erhebung und Einhaltung der Anforderungen für grenzüberschreitende Übermittlungen.

### 4.7 China (PIPL)

Bei Zugang zum Protokoll aus der Volksrepublik China basiert die Verarbeitung auf Einwilligung oder Vertragserfüllung, wobei die Datenlokalisierungsanforderungen eingehalten werden.

### 4.8 Indien (DPDP)

Die Verarbeitung entspricht dem DPDP-Gesetz, einschließlich Einwilligung oder berechtigter Nutzung, Pflichten als Datenverwalter und Rechte der Dateninhaber.

---

## 5. Wie wir Daten Verwenden

Daten, die über das Signet-Protokoll verarbeitet werden, werden ausschließlich verwendet für:

1. **Ausstellung und Überprüfung von Berechtigungsnachweisen** — Nutzern die Erstellung, Vorlage und Überprüfung von Berechtigungsnachweisen über die vier Verifizierungsstufen hinweg ermöglichen.
2. **Berechnung der Vertrauensbewertung** — Berechnung von Vertrauensbewertungen basierend auf Bürgschaften, Berechtigungsstufen und Verifizierungshistorie.
3. **Altersbereichsverifikation** — Verwendung von Bulletproofs zum Nachweis, dass ein Nutzer in einem Altersbereich liegt, ohne sein genaues Alter preiszugeben.
4. **Professionelle Verifikation** — Lizenzierten Fachleuten (Anwälten, Notaren, Medizinern) die Tätigkeit als Verifizierer ermöglichen.
5. **Widerruf von Berechtigungsnachweisen** — Verarbeitung von Widerrufsereignissen.
6. **Protokollintegrität** — Aufrechterhaltung der kryptografischen Integrität und Sicherheit.
7. **Rechtskonformität** — Einhaltung geltender Gesetze und Vorschriften.

---

## 6. Datenweitergabe und Offenlegung

### 6.1 Weitergabe auf Protokollebene

Das Signet-Protokoll arbeitet im dezentralen Nostr-Netzwerk. Wenn Sie ein Ereignis veröffentlichen, wird es an Nostr-Relais übertragen. Dies ist Teil des Protokolldesigns und wird von Ihnen initiiert.

### 6.2 Wir Geben Daten NICHT Weiter an

- Werbetreibende oder Marketingunternehmen
- Datenhändler
- Social-Media-Plattformen (über die Veröffentlichung auf Nostr-Relais hinaus)
- Regierungsbehörden (außer bei gesetzlicher Verpflichtung)

### 6.3 Gesetzlich Vorgeschriebene Offenlegung

Wir können Informationen offenlegen, wenn dies durch einen gültigen Gerichtsbeschluss, die geltende Gesetzgebung oder eine Anfrage einer Strafverfolgungs- oder Regulierungsbehörde erforderlich ist. Wir werden betroffene Nutzer über solche Anfragen informieren, soweit gesetzlich zulässig.

### 6.4 Datenweitergabe von Verifizierern

Professionelle Verifizierer (Stufe 3 und 4) veröffentlichen Verifizierer-Registrierungsereignisse (Typ 30473) im Nostr-Netzwerk.

---

## 7. Internationale Datenübermittlungen

### 7.1 Dezentrale Architektur

Das Nostr-Netzwerk arbeitet global. Veröffentlichte Ereignisse können auf Relais weltweit repliziert werden.

### 7.2 Übermittlungsmechanismen

Für zentralisierte Verarbeitungen schützen wir internationale Datenübermittlungen durch:

- **EU/EWR:** Standardvertragsklauseln (SVK) gemäß Kommissionsbeschluss 2021/914, ergänzt durch Transferfolgenabschätzungen.
- **Vereinigtes Königreich:** Internationales Datenübermittlungsabkommen (IDTA) oder UK-Nachtrag zu den EU-SVK.
- **Südkorea:** Einhaltung der grenzüberschreitenden Übermittlungsbestimmungen des PIPA.
- **Japan:** Übermittlungen an Länder mit angemessenem Schutzniveau oder mit Einwilligung.
- **China:** Sicherheitsbewertungen, Standardverträge oder Zertifizierungen gemäß PIPL.
- **Brasilien:** Übermittlungen gemäß Art. 33 LGPD.

### 7.3 Angemessenheitsbeschlüsse

Wir stützen uns auf Angemessenheitsbeschlüsse, wo verfügbar, einschließlich des EU-US-Datenschutzrahmens.

---

## 8. Datenspeicherung

### 8.1 Nostr-Ereignisse

Im Nostr-Netzwerk veröffentlichte Ereignisse werden von Relaisbetreibern gemäß deren eigenen Richtlinien gespeichert. Wir können die Löschung von Ereignissen aus allen Relais nicht garantieren.

### 8.2 Lebenszyklus der Berechtigungsnachweise

| Datentyp | Aufbewahrungsfrist |
|----------|-------------------|
| Aktive Berechtigungsnachweise | Bis zum Ablauf oder Widerruf |
| Widerrufene Berechtigungsnachweise | Widerrufsereignisse werden unbefristet für die Verifizierungsintegrität aufbewahrt |
| Abgelaufene Berechtigungsnachweise | Gemäß den Richtlinien der Relaisbetreiber |
| Bürgschaftsaufzeichnungen | Bis zum Widerruf durch die bürgende Partei |
| Herausforderungs-/Antwortdaten | Kurzlebig; nach der Verifizierung nicht aufbewahrt |

### 8.3 Zentralisierte Aufzeichnungen

- Supportaufzeichnungen: 2 Jahre ab der letzten Interaktion
- Rechtskonformitätsaufzeichnungen: Wie gesetzlich vorgeschrieben (typischerweise 5–7 Jahre)
- Auditprotokolle: 3 Jahre

---

## 9. Ihre Rechte

### 9.1 Universelle Rechte

Unabhängig von Ihrer Gerichtsbarkeit können Sie:
- Auskunft über die von uns verarbeiteten Daten verlangen
- Die Berichtigung unrichtiger Daten verlangen
- Die Einwilligung widerrufen, wenn die Verarbeitung auf Einwilligung beruht
- Eine Beschwerde bei uns oder einer Aufsichtsbehörde einlegen

### 9.2 Europäische Union / EWR (DSGVO)

Gemäß der DSGVO haben Sie das Recht auf:
- **Auskunft** (Art. 15) — Eine Kopie Ihrer personenbezogenen Daten erhalten
- **Berichtigung** (Art. 16) — Unrichtige Daten korrigieren
- **Löschung** (Art. 17) — Löschung verlangen („Recht auf Vergessenwerden")
- **Einschränkung** (Art. 18) — Verarbeitung unter bestimmten Umständen einschränken
- **Datenübertragbarkeit** (Art. 20) — Ihre Daten in einem strukturierten, gängigen, maschinenlesbaren Format erhalten
- **Widerspruch** (Art. 21) — Gegen die Verarbeitung aufgrund berechtigter Interessen widersprechen
- **Automatisierte Entscheidungsfindung** (Art. 22) — Nicht einer ausschließlich automatisierten Entscheidung mit rechtlichen Auswirkungen unterworfen zu werden

**Aufsichtsbehörde:** Sie können eine Beschwerde bei Ihrer lokalen Datenschutzbehörde einlegen. In Deutschland: Landes- oder Bundesdatenschutzbeauftragter.

### 9.3 Vereinigtes Königreich (UK-DSGVO)

Sie haben gleichwertige Rechte wie unter der EU-DSGVO. Sie können eine Beschwerde beim ICO einlegen.

### 9.4 Vereinigte Staaten (CCPA / CPRA)

Einwohner Kaliforniens haben das Recht auf Auskunft, Löschung, Berichtigung, Widerspruch gegen den Verkauf und Nichtdiskriminierung.

### 9.5 Brasilien (LGPD)

Betroffene haben das Recht auf: Bestätigung der Verarbeitung, Zugang, Berichtigung, Anonymisierung/Sperrung/Löschung, Datenportabilität, Löschung bei Einwilligung, Information über geteilte Daten und Widerruf der Einwilligung.

### 9.6 Südkorea (PIPA)

Betroffene haben das Recht auf Auskunft, Berichtigung oder Löschung, Aussetzung der Verarbeitung und Beschwerde bei der PIPC.

### 9.7 Japan (APPI)

Betroffene haben das Recht auf Offenlegung, Berichtigung, Ergänzung oder Löschung und Einstellung der Nutzung.

### 9.8 China (PIPL)

Betroffene haben das Recht, über die Verarbeitung zu entscheiden, die Verarbeitung einzuschränken oder abzulehnen, Daten einzusehen und zu kopieren, Portabilität zu verlangen und Löschung zu beantragen.

### 9.9 Indien (DPDP-Gesetz)

Dateninhaber haben das Recht auf Zugang, Berichtigung und Löschung, Beschwerdebehebung und Benennung einer anderen Person zur Ausübung der Rechte.

### 9.10 Ausübung Ihrer Rechte

Kontaktieren Sie uns unter:
- **E-Mail:** [CONTACT EMAIL]
- **DSB-E-Mail:** [DPO EMAIL]

Antwortfristen gemäß geltendem Recht:
- DSGVO/UK-DSGVO: 30 Tage (um 60 Tage verlängerbar)
- CCPA/CPRA: 45 Tage (um 45 Tage verlängerbar)
- LGPD: 15 Tage
- PIPA: 10 Tage
- APPI: Unverzüglich
- PIPL: Zeitnah

---

## 10. Daten von Kindern

### 10.1 Allgemeine Regelung

Das Signet-Protokoll umfasst die Stufe 4 (Professionelle Verifizierung — Erwachsener + Kind), die speziell für die Kindersicherheit entwickelt wurde. Wir nehmen den Schutz von Kinderdaten äußerst ernst.

### 10.2 Altersverifikation

Das Protokoll verwendet auf Bulletproofs basierende Zero-Knowledge-Beweise für die Altersbereichsverifikation. Diese Beweise zeigen, dass ein Nutzer in einen bestimmten Altersbereich fällt, ohne sein genaues Geburtsdatum preiszugeben.

### 10.3 Alterserfordernisse nach Gerichtsbarkeit

| Gerichtsbarkeit | Mindestalter für digitale Einwilligung | Geltendes Recht |
|-----------------|---------------------------------------|-----------------|
| EU (Standard) | 16 Jahre | Art. 8 DSGVO |
| Deutschland | 16 Jahre | DSGVO Art. 8 + BDSG |
| EU (Mitgliedstaatenoption) | 13–16 Jahre (variiert) | Art. 8(1) DSGVO |
| Vereinigtes Königreich | 13 Jahre | UK-DSGVO / AADC |
| Vereinigte Staaten | 13 Jahre | COPPA |
| Brasilien | 12 Jahre (mit elterlicher Einwilligung bis 18) | Art. 14 LGPD |
| Südkorea | 14 Jahre | PIPA |
| Japan | 15 Jahre (Richtlinien) | APPI |
| China | 14 Jahre | Art. 28 PIPL |
| Indien | 18 Jahre (mit Ausnahmen) | DPDP-Gesetz |

### 10.4 Elterliche Einwilligung

Wenn elterliche Einwilligung erforderlich ist, unterstützt das Protokoll verifizierbare elterliche Einwilligung durch Stufe-3/4-Berechtigungsnachweise, Altersbeschränkung durch ZK-Beweis-Verifizierung und Mechanismen für Eltern zur Überprüfung, Änderung oder zum Widerruf der Einwilligung.

### 10.5 COPPA-Konformität (Vereinigte Staaten)

Wir erheben wissentlich keine personenbezogenen Informationen von Kindern unter 13 Jahren ohne überprüfbare elterliche Einwilligung.

### 10.6 Age Appropriate Design Code (Vereinigtes Königreich)

Wir verpflichten uns zu den Grundsätzen des UK AADC, einschließlich Kindeswohlbewertung, altersgerechter Anwendung, Datenminimierung, kinderschützender Standardeinstellungen und altersgerechter Transparenz.

---

## 11. Sicherheit

### 11.1 Kryptografische Sicherheit

Das Signet-Protokoll verwendet:
- **Schnorr-Signaturen** auf der secp256k1-Kurve
- **Bulletproofs** für Zero-Knowledge-Altersbereichsbeweise
- **Ringsignaturen** für anonyme Gruppenmitgliedschaftsbeweise
- **Zukünftige ZK-Schicht** geplant (ZK-SNARKs/ZK-STARKs)

### 11.2 Organisatorische Sicherheit

Wir implementieren: Zugriffskontrollen, Verschlüsselung bei der Übertragung (TLS 1.2+), regelmäßige Sicherheitsbewertungen, Reaktionsverfahren bei Vorfällen, Mitarbeiterschulungen und sichere Entwicklungspraktiken.

### 11.3 Dezentrales Sicherheitsmodell

Die dezentrale Architektur bietet: keinen einzelnen Ausfallpunkt, keine zentrale Datenbank als Angriffsziel, nutzerkontrollierte Schlüsselverwaltung und kryptografische Verifizierung ohne vertrauenswürdige Vermittler.

### 11.4 Benachrichtigung bei Datenschutzverletzungen

Bei einer Datenschutzverletzung benachrichtigen wir die zuständige Aufsichtsbehörde innerhalb von 72 Stunden (DSGVO), die betroffenen Personen unverzüglich bei hohem Risiko und dokumentieren die Verletzung samt Gegenmaßnahmen.

---

## 12. Cookies und Tracking-Technologien

Das Signet-Protokoll verwendet **keine** Cookies, Web-Beacons, Browser-Fingerprinting, lokalen Speicher für Tracking oder Analysedienste Dritter. Wenn Hilfsdienste Cookies verwenden, wird ein separater Cookie-Hinweis mit entsprechenden Einwilligungsmechanismen bereitgestellt.

---

## 13. Automatisierte Entscheidungsfindung und Profiling

### 13.1 Berechnung der Vertrauensbewertung

Das Protokoll berechnet Vertrauensbewertungen basierend auf Verifizierungsstufe, Bürgschaften, Verifizierer-Qualifikationen und Berechtigungshistorie. Diese stellen keine automatisierte Entscheidungsfindung mit rechtlichen Auswirkungen gemäß Art. 22 DSGVO dar.

### 13.2 Kein Profiling zu Marketingzwecken

Wir betreiben kein Profiling zu Marketing-, Werbe- oder Verhaltensanalysezwecken.

---

## 14. Links und Dienste Dritter

Das Signet-Protokoll kann mit Nostr-Relais, Nostr-Clients (wie Fathom) und Berufsverbänden interoperieren. Diese Dritten haben eigene Datenschutzerklärungen.

---

## 15. Änderungen dieser Datenschutzerklärung

Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Bei wesentlichen Änderungen erfolgt eine Benachrichtigung durch Nostr-Ereignis-Ankündigung, Aktualisierung des Protokoll-Repositorys oder direkte Benachrichtigung.

---

## 16. Gerichtsbarkeit-Spezifische Bestimmungen

### 16.1 Europäische Union

Die Bestimmungen der DSGVO haben Vorrang vor widersprüchlichen Bestimmungen dieser Datenschutzerklärung.

### 16.2 Kalifornien

Wir verkaufen oder teilen keine personenbezogenen Informationen. Wir bieten keine finanziellen Anreize im Zusammenhang mit der Datenerhebung.

### 16.3 Brasilien

Der DSB (Encarregado) ist unter [DPO EMAIL] für alle LGPD-bezogenen Anfragen erreichbar.

### 16.4 Australien

Wir erfüllen die Australian Privacy Principles (APPs) gemäß dem Privacy Act 1988.

### 16.5 Südafrika

Wir erfüllen den Protection of Personal Information Act 2013 (POPIA).

---

## 17. Kontaktieren Sie Uns

**Allgemeine Anfragen:**
[ORGANIZATION NAME]
E-Mail: [CONTACT EMAIL]

**Datenschutzbeauftragter:**
E-Mail: [DPO EMAIL]

**Postadresse:**
[ORGANIZATION NAME]
[ADRESSE]

---

## 18. Behördliche Meldungen

Je nach Gerichtsbarkeit unterhalten wir Registrierungen oder Meldungen bei: dem ICO (Vereinigtes Königreich), anwendbaren EU/EWR-Datenschutzbehörden und anderen Regulierungsbehörden.

---

*Diese Datenschutzerklärung dient als Vorlage für das Signet-Protokoll. Sie stellt keine Rechtsberatung dar. [ORGANIZATION NAME] empfiehlt, einen qualifizierten Rechtsberater zu konsultieren, der mit den anwendbaren Datenschutzgesetzen in Ihrer Gerichtsbarkeit vertraut ist, bevor die Bereitstellung erfolgt.*

*Signet-Protokoll — Entwurf v0.1.0*
*Dokumentversion: 1.0*
