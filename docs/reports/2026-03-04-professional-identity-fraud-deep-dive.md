# Professional Identity Fraud: A Deep Dive

**Date:** 2026-03-04
**Purpose:** Advocacy material for engaging professional bodies and regulators with the Signet protocol. This report documents the scale, consequences, and regulatory gaps of professional identity fraud — the exact problem Signet's multi-signal verifier authentication is designed to solve.

---

## Executive Summary

Professional identity fraud — where individuals impersonate licensed professionals to commit fraud, provide unlicensed services, or establish false credentials — is a growing and underreported problem with lethal consequences.

**Key findings:**

- **$47 billion** lost to identity fraud and scams by US adults in 2024, up from $43 billion in 2023
- **250,000** identity fraud filings in the UK in 2024 alone, accounting for 59% of all fraud
- A fake psychiatrist practised in the UK NHS for **22 years** before detection, treating hundreds of patients
- Two fake engineers in California compromised the structural integrity of **hundreds of buildings** across 56 cities
- Solicitor impersonation in UK property transactions caused **£11.7 million** in losses in a single year (2024-25)
- AI deepfake attacks now occur at a rate of **one every five minutes**, with human detection rates at just 24.5%
- **300+ US companies** unknowingly hired North Korean operatives using AI-generated professional identities, generating $88 million

The credential gap — the inability to verify a professional's identity at the point of service — is the common thread across every case in this report. No real-time, trustless verification system exists. Signet is designed to close that gap.

---

## 1. Medical Professional Impersonation

### 1.1 Scale

Aggregate statistics on fake doctors are not collected uniformly at national level in most countries. Evidence comes from individual prosecutions, regulatory enforcement actions, and regional studies.

- A 1984 US Congressional estimate (Rep. Claude Pepper) put the number of people practising medicine with fake degrees in the US at up to **10,000** — a figure never systematically updated
- In India, the Indian Medical Association estimates at least **1 million informal/unlicensed practitioners** operate across the country
- A WHO assessment found that **57.3% of those describing themselves as doctors in India** lacked a recognised medical degree
- In the UK, the CPS has prosecuted **13 cases** of people pretending to be registered doctors since 2004 — low frequency, but catastrophic when they occur

### 1.2 Notable Cases

#### Zholia Alemi — UK, 1995-2023 (22 years undetected)

The most significant professional identity fraud case in UK history.

- Forged a University of Auckland medical degree in 1995
- Registered with the GMC using the forged documents — the forged papers contained **spelling errors** that were not caught
- Worked as an NHS psychiatrist for **22 years** across multiple NHS Trusts, often as a locum
- Held **Section 12 powers** under the Mental Health Act — the authority to detain patients against their will
- Became a Member of the Royal College of Psychiatrists in 2003 (by passing legitimate exams)
- Defrauded the NHS of **£1-1.3 million** in salary
- Attempted to steal a **£1.3 million** estate by forging a dementia patient's will
- **Not detected by the GMC** — exposed by a regional newspaper journalist
- Convicted February 2023: 13 counts of fraud, 2 of forgery, 3 of deception, 2 of using a false instrument
- Sentenced to **7 years**; ordered to repay **£406,624**
- Trial judge condemned the GMC for **"an abject failure of scrutiny"**
- Triggered a GMC review of approximately **3,000 doctors** who had registered via the same pre-2003 Commonwealth route

**What Signet would have changed:** A domain proof or professional body attestation requirement would have required Alemi to either hack the University of Auckland's website or obtain a cryptographic attestation from them — neither of which she could have done. The nullifier system would have flagged any attempt to register under multiple identities.

#### Narendra Yadav / "N John Camm" — India, 2025 (7 deaths)

- Impersonated Professor John Camm, Emeritus Professor of Clinical Cardiology at St George's University of London
- Created a website (njohncamm.com) and Twitter account in the real doctor's name
- Obtained employment at Mission Hospital in Damoh, Madhya Pradesh
- Performed **64 cardiac procedures including 45 angioplasties**
- **Seven patients died**
- Falsified registration documents claiming to be licensed in Andhra Pradesh
- Arrested April 2025

**What Signet would have changed:** Cross-referencing the claimed pubkey against the real Professor Camm's established Signet identity would have instantly exposed the impersonation. A domain proof from St George's University website would have been impossible to forge.

#### Other notable cases

| Case | Country | Duration | Outcome |
|---|---|---|---|
| **Dean Faiello** — operated unlicensed skin clinic on Park Avenue | US (NYC) | 1996-2003 | Patient died from lidocaine overdose; 20-year sentence |
| **Gustavo Nunez** — fake cosmetic surgery clinic | US (Arizona) | 2012-2014 | Patient suffered brain damage; 38.25 years |
| **Malachi Love-Robinson** — 17-year-old posed as doctor | US (Florida) | 2016 | Stole $35,000 from elderly patient; 3.5 years |
| **Stephan Gevorkian** — "Pathways Medical" | US (LA) | Until 2023 | Treated thousands including cancer patients; charged with 5 felonies |
| **Levon Mkhitarian** — stole another doctor's identity | UK | 2007-2015 | Treated ~3,000 patients under stolen identity |
| South Africa crackdown | South Africa | Ongoing | 124 bogus doctors arrested in a single operation |

### 1.3 Patient Harm

- In India, an estimated **20% of all treatment-related deaths** involve a fake or unqualified practitioner (2018)
- The Yadav case documented **7 deaths** from a single impersonator
- Faiello's patient died from a toxic overdose of lidocaine administered during a laser treatment
- Nunez's patient suffered **life-threatening injuries and brain damage** after he failed to call for help for nearly an hour during a seizure
- Alemi held the power to **detain patients involuntarily** — the consequences of misdiagnosis at this level are incalculable

### 1.4 NHS-Specific

- NHS fraud reports: **6,367** in 2023-24 (up 26% from 5,048 in 2022-23)
- NHS staff fraud: **2,963 reports** (46% of all NHS fraud reports)
- NHS annual fraud vulnerability estimated at **£1.316 billion**
- The NHSCFA explicitly categorises "individuals obtaining employment by purporting to have qualifications they don't have, or providing false identity documents" as a defined fraud type
- The GMC does not proactively detect fake registrations — it relies on employers and pharmacists to check the register

---

## 2. Legal Professional Impersonation

### 2.1 Scale

#### UK — Solicitor Impersonation

The SRA publishes quarterly scam roundups showing the scale:

- **Q1 2023/24:** 83 scam alerts
- **Feb-Apr 2025:** 107 scam alerts
- **May-Jul 2025:** 149 scam alerts

The trend is sharply upward. At the current run rate, the SRA is dealing with **500-600+ scam alerts per year**.

Earlier SRA data on bogus firms specifically:
- **548 reports** of bogus firms in 2013 (57% increase on 2012)
- **450+** reports in the first 8 months of 2014
- **46% of all reports** involve identity theft of a law firm or solicitor — typically through website cloning

#### UK — Conveyancing Fraud

City of London Police data for April 2024 - March 2025:
- **143 cases** reported to Action Fraud
- **£11.7 million** in total losses
- Residential property: 140 cases, £10.97 million (average loss: **£78,393 per case**)
- Peak month: March 2025, nearly **£2 million** in losses
- Lloyds Bank reported a **29% increase** in conveyancing scam reports in H2 2023 vs H1 2023

How it works: criminals gain access to email chains between buyers, sellers, and solicitors. They impersonate the solicitor and redirect house deposit payments to accounts under their control. Average victim loses their entire deposit.

#### US — Unauthorised Practice of Law

- California State Bar: **900+ UPL cases** opened in FY 2024 (non-attorney); **208 referrals** to law enforcement
- Florida Bar: ~**700 UPL complaints per year**; highest dedicated UPL enforcement budget at $1.4 million
- ABA survey: at least **10 of 36 jurisdictions** had UPL enforcement that was "inactive or nonexistent" due to insufficient funding
- Fake crypto recovery law firms: **$9.9 million** in additional losses to crypto scam victims (Feb 2023-Feb 2024)

### 2.2 Notable Cases

#### Mescall / "Prospection Legal" — New York, 2022-2025

- Operated fake law firms under names including "Prospection Legal" and "Mescall Law P.C."
- Created professional profiles on legal directories and social media
- Claimed a Texas Tech law degree and over a decade of experience
- Hired a genuine licensed attorney (deceiving her about his own credentials)
- Took on over **100 clients** and collected nearly **$290,000**
- Ordered to repay **$294,275**; expected sentence: 2-6 years

#### Bogus solicitor Naveed Rai — UK, repeat offender

- Appeared before Coventry County Court pretending to be a solicitor
- This was his **second** offence — previously jailed for the same crime in 2013
- Jailed 15 months (suspended), £15,000 costs, 200 hours unpaid work

#### Scotland — £6 million investment fraud (2023)

- Iain Robertson (8 years), Alastair Blackwood (7 years), David Lyons (7 years)
- Ran two bogus investment schemes that defrauded **150+ victims of £6 million**

#### Notario Fraud — targeting immigrants

A distinct and structurally significant fraud vector. In Spanish-speaking countries, "notario" denotes a legal professional with powers beyond a common law notary. In the US, unlicensed individuals exploit this misunderstanding to provide fake immigration legal services.

- New York City passed what it described as the **nation's most comprehensive legislation** targeting immigration legal services fraud in June 2025
- Complaints are at an **"all-time high"**
- Thousands of immigrants annually lose money and immigration status

**What Signet would have changed:** A client checking the solicitor's Signet profile would see their verifier confidence score, domain proof status, and whether their credentials are attested by the SRA. Cloned websites would not pass Signet's domain proof verification because the attacker cannot sign the `.well-known/signet.json` file with the real solicitor's private key.

---

## 3. Engineering Professional Impersonation

### 3.1 Credential Forgery

Unlike medicine and law, engineering fraud commonly takes the form of **PE seal theft** — forging the stamp of a licensed Professional Engineer — rather than wholesale impersonation of a specific person.

#### Gutierrez and Rodriguez — Southern California, 2007-2016

The most significant documented engineering fraud case:

- Two former employees of Palos Verdes Engineering Co. used stolen software to forge engineering seals and signatures
- Over approximately **11 years**, they produced structural engineering drawings for **hundreds of residential and commercial projects** across **56 cities** in Los Angeles, Ventura, San Bernardino, and Riverside Counties
- Affected structures **"may be unsafe and not suitable for habitation"**
- Each convicted of more than **450 felony counts** (forgery, identity theft, grand theft)
- Each faced up to **257 years** in prison; received 1 year jail + 5 years probation

#### Other engineering credential theft cases

- **California moonlighting case:** An unlicensed architect and an unlicensed draftsman moonlit for six years using their employer's PE seal. Convicted of **238 and 193 felony counts** respectively
- **Alabama:** An unlicensed construction firm owner used a PE's seal without permission on numerous projects
- **Florida:** Individuals who failed the PE exam created counterfeit digital seals to begin signing off on work

### 3.2 Grenfell Tower — UK, 2017 (72 deaths)

While not a simple impersonation case, Grenfell Tower illustrates the catastrophic consequences of professional credential failures in construction:

- A fire risk assessor **fabricated his professional qualification list**
- A licensed fire engineer signed off a cladding assessment as "fine" despite what the inquiry described as "omissions, assumptions and gaps"
- The Phase 2 Inquiry report (September 2024) found the fire was caused by **"systematic dishonesty, incompetence, and greed"**
- **72 people died**
- Post-Grenfell: Adam Kiziak of Tri Fire Ltd was found to have signed **EWS1 fire safety certificates** using another engineer's credentials and signature without permission (IFE membership suspended November 2024)

### 3.3 Structural Safety Impact

- Construction fraud (broader than just credential forgery) pushes **60% of small construction companies** toward bankruptcy
- Post-disaster fraud alone costs an estimated **$9.2-9.3 billion annually** in the US
- ASCE has directly linked bribery and credential fraud to **structural collapses**

**What Signet would have changed:** A PE's Signet identity, cryptographically bound to their professional registration, would make seal forgery detectable. Anyone reviewing plans could verify the signer's credentials against their Signet profile in real time. The California case — 11 years of forged seals across 56 cities — would have been caught the first time someone checked.

---

## 4. Accounting and Financial Professional Impersonation

### 4.1 Fake CPAs and Investment Advisors

#### BF Borgers CPA PC — SEC enforcement, 2024

- Charged with deliberate and systemic PCAOB compliance failures across **more than 1,500 SEC filings** (January 2021-June 2023)
- Fabricated audit documentation and falsely claimed work met PCAOB standards
- Firm fined **$12 million**; Benjamin Borgers personally fined **$2 million**

#### Investment advisor impersonation via LinkedIn

- Fraudsters create fake LinkedIn profiles impersonating specific real financial advisors at named firms
- Contact victims with cryptocurrency investment "opportunities"
- LinkedIn detected **86 million fake profiles** in H1 2024 alone
- **142 million** spam/scam incidents in the same period

### 4.2 Tax Fraud via Fake Professionals

The IRS/DOJ increasingly pursues tax preparers and CPAs operating without proper credentials:
- An unlicensed chiropractor in New Jersey masterminded a fraud ring billing **nearly $4 million** from insurance carriers
- Unqualified tax preparers charge fees in immigrant communities, filing fraudulent returns and redirecting refunds

---

## 5. The Digital Dimension: AI and Deepfakes

### 5.1 Scale and Growth

| Metric | Figure | Period |
|---|---|---|
| Deepfake attack frequency | One every 5 minutes | 2024 |
| Deepfake incident growth | +257% | 2024 vs 2023 |
| Q1 2025 deepfake incidents | 179 (vs 150 for all of 2024) | Q1 2025 |
| Financial losses from deepfake fraud | $200+ million | Q1 2025 alone |
| Average business loss per deepfake fraud | $500,000 | 2024 |
| Human detection rate for quality deepfakes | 24.5% | 2024 |
| CEO impersonation attacks per day | 400+ companies targeted | 2024 |
| Projected AI fraud losses (US) | $40 billion | By 2027 (Deloitte) |

### 5.2 North Korean IT Worker Scheme

The most documented large-scale deployment of AI for professional identity fraud:

- **300+ US companies** unknowingly hired North Korean operatives
- Operatives used stolen identities, AI-generated personas, and deepfakes to pass video interviews
- Total scheme revenue: **$88 million** over six years (December 2024 DOJ indictment)
- An Arizona facilitator was sentenced to **102 months** for running a $17 million element of the scheme
- Operatives maintain "laptop farms" to appear to work from legitimate US locations

### 5.3 Online Professional Profiles

- LinkedIn: **86 million fake profiles** detected in H1 2024; **142 million** spam/scam incidents
- LinkedIn's AI image detector claims **99% accuracy** on AI-generated photos, but sophisticated fraudsters combine AI images with AI-written text, fake employment histories, and stolen credential details
- Telehealth fraud: a single 2023 federal investigation led to charges against **52 medical professionals** for over **$1.2 billion** in fraudulent billing
- The largest single telehealth fraud indictment in 2023: **$1.9 billion** (Miami)

### 5.4 Telehealth and Remote Services

Remote service delivery — telehealth, online legal services, virtual financial advice — eliminates the physical consultation that previously provided a partial check against impersonation:

- DOJ HHS Office of Inspector General reviewed 1,700 telehealth providers billing Medicare in 2020 and found concerning billing patterns for **100% of the sample**
- FTC documented a **"sharp spike in impersonation fraud"** — costs increased **85% year-over-year** during 2020-2021
- Online immigration legal services fraud specifically proliferates via TikTok, WhatsApp, and Facebook

---

## 6. The Numbers: Identity Fraud at Scale

### 6.1 United States

| Metric | 2024 Figure | Trend |
|---|---|---|
| Total identity fraud + scams losses | **$47 billion** | Up $4B from 2023 |
| FTC-reported fraud losses | **$12.5 billion** | +25% YoY |
| Identity theft complaints | **1,135,270** | +9.5% |
| Impersonation scam losses | **$2.95 billion** | 3x the 2020 level |
| Government impersonation losses | **$789 million** | +$171M from 2023 |
| Account takeover fraud | **$15.6 billion** | Up from $12.7B (2023) |
| Victims of identity theft (share of pop.) | **1 in 5 Americans** (22%) | — |

### 6.2 United Kingdom

| Metric | 2024 Figure | Trend |
|---|---|---|
| Total NFD fraud filings (Cifas) | **421,000+** | +13%, record high |
| Identity fraud filings | **~250,000** | +5%, 59% of all fraud |
| Online channel proportion | **86%** | — |
| Fraud losses prevented (Cifas members) | **£2.1 billion** | — |
| UK Finance total fraud losses | **£1.17 billion** | Broadly flat |
| APP (push payment) fraud | **£450.7 million**, 186K cases | Down 2% and 20% |
| Total Action Fraud reported losses | **£2.3 billion** | +6% |
| Conveyancing fraud (solicitor impersonation) | **£11.7M**, 143 cases | — |
| Insurance fraud claims detected (ABI) | **£1.16 billion**, 98,400+ claims | +2% value, +12% volume |

### 6.3 Global

| Metric | Figure | Trend |
|---|---|---|
| Identity fraud rate | **2.5% of all verifications** | Up from 1.1% in 2021 (>2x) |
| Deepfake-enabled fraud losses | **$200M+ in Q1 2025 alone** | — |
| Projected AI fraud (US, Deloitte) | **$40 billion by 2027** | — |

---

## 7. Regulatory Responses — and Their Gaps

### 7.1 What Regulators Are Doing

| Body | Action | Limitation |
|---|---|---|
| **GMC (UK)** | Public register; post-Alemi review of 3,000 doctors | Relies on employers/pharmacists to check; does not proactively detect |
| **SRA (UK)** | Scam alerts, "Find a Solicitor" register, intelligence-led investigation | Reactive; cannot prevent website cloning; 500+ alerts/year and rising |
| **NHSCFA (UK)** | NHS fraud reports, staff fraud categorisation | Does not separately count fake credential cases; £1.3B fraud vulnerability |
| **California State Bar** | 900+ UPL cases/year; law enforcement referrals | One state; 10 of 36 US jurisdictions have "inactive" UPL enforcement |
| **FTC (US)** | Government and Business Impersonation Rule (April 2024) | Reactive enforcement; 5 cases and 13 websites shut down since launch |
| **EU eIDAS 2.0** | QEAAs for verified professional attributes; EUDI Wallet | Not yet deployed; 2026 compliance deadline; centralised trust model |
| **UK DIATF** | Trust framework for digital identity providers | Covers person-level identity, not professional credentials specifically |

### 7.2 What's Missing

**No jurisdiction has a decentralised, real-time, cryptographically verifiable professional credential system.**

The gaps:

1. **The register model is passive.** Professional registers (GMC, SRA, state bar associations) exist but require the *user* to check them. There is no mechanism for a professional to *prove* their credential at the point of service — the credential is a database entry, not a cryptographic proof in the professional's possession.

2. **Verification is not composable.** A solicitor's SRA registration, their firm's domain, their LinkedIn profile, and their identity are separate, unlinked data points. There is no system that combines these signals into a single verifiable assertion.

3. **Website cloning defeats current defences.** The SRA's primary defence against bogus firms is publication of warnings. But a cloned website can appear before a warning is issued. A cryptographic domain proof (where the site must contain a signature verifiable against the professional's public key) would make cloning detectable instantly.

4. **Cross-border verification doesn't exist.** A UK solicitor's SRA registration has no machine-readable connection to any other jurisdiction's registry. A professional moving between countries carries no portable, verifiable credential.

5. **AI is outrunning detection.** Deepfake detection is at 24.5% human accuracy. AI-generated professional profiles are increasingly indistinguishable from real ones. The only sustainable defence is cryptographic: the professional signs their identity with their private key, and anyone can verify it.

6. **No proactive detection of duplicates.** A person can obtain verified credentials in multiple jurisdictions under different identities with no cross-referencing. Signet's nullifier system would catch this.

---

## 8. The Signet Proposition

Every case in this report shares a common root cause: the inability to verify a professional's identity at the point of service. Signet addresses this through:

### 8.1 Multi-Signal Verifier Authentication

Instead of trusting a single register entry, Signet combines five independent signals:

| Signal | How it helps | Which cases it addresses |
|---|---|---|
| **Cross-professional vouches** | Verifiers must be vouched for by 2+ professions | Prevents isolated fake professionals |
| **Domain proof** (`.well-known/signet.json`) | Cryptographic proof linking pubkey to professional website | Defeats website cloning (SRA scams), exposes Alemi (no University of Auckland proof) |
| **Registry cross-check** | Automated verification against SRA, GMC, NPPES APIs | Catches non-existent licence numbers |
| **Professional body attestation** | The professional body itself attests to the binding | Gold standard; eliminates impersonation entirely |
| **Network position analysis** | Graph-theoretic detection of suspicious clusters | Catches Sybil mesh attacks |

### 8.2 Domain Proof vs Website Cloning

The SRA reports that **46% of bogus firm cases** involve website cloning. A Signet domain proof makes cloning ineffective:

- The real solicitor publishes a signed proof at `https://smithandpartners.co.uk/.well-known/signet.json`
- The proof contains a Schnorr signature by the solicitor's private key
- A cloned website at `smithandpartners-uk.co.uk` cannot reproduce this signature — the attacker doesn't have the private key
- Any client checking the Signet proof immediately detects the clone

### 8.3 Real-Time Credential Presentation

Signet credentials are in the professional's possession (as Nostr events), not in a remote database. A professional can prove their credentials at any time:

- A patient meeting a doctor can verify their Signet profile on the spot
- A homebuyer can check their solicitor's Signet identity before transferring funds
- A building inspector can verify an engineer's Signet credentials before accepting their stamp

### 8.4 Document-Based Nullifiers

Signet's nullifier system — `H(document_type || country_code || document_number || "signet-uniqueness-v1")` — provides decentralised duplicate detection:

- If a person gets verified with two different keypairs, both credentials will share the same nullifier
- Anyone can scan the credential set for duplicates — no central registry needed
- This catches the "get verified twice and sell one identity" attack

### 8.5 Audit Trail

Every Signet credential traces to its issuer. If a sold identity is used for fraud:

1. The credential identifies the issuing verifier
2. The verifier's records identify the document presented
3. The professional faces disciplinary consequences for verifying the same passport for two different pubkeys

This creates deterrence through accountability — something that does not exist in the current system.

---

## 9. The Advocacy Case

### 9.1 For Professional Bodies

"Your members are being impersonated. The SRA alone issues 500+ scam alerts per year. Conveyancing fraud costs £11.7 million per year. A fake doctor practised in the NHS for 22 years. Your current defences — public registers and warning notices — are reactive and insufficient. Signet provides your members with a cryptographic proof of identity that cannot be cloned, forged, or impersonated. Adopting Signet positions your body as a leader in professional credential security."

### 9.2 For Regulators

"Identity fraud costs the UK £2.3 billion per year (Action Fraud). The NHS fraud vulnerability is £1.316 billion. Professional impersonation is a growing component that current regulatory frameworks do not address. The DIATF covers person-level identity but not professional credentials. eIDAS 2.0 mandates credential verification from 2026 but relies on centralised QTSPs. Signet offers a decentralised, open-standard alternative that professional bodies can adopt voluntarily, without legislative change, while providing stronger guarantees than any current system."

### 9.3 For Politicians

"Your constituents are losing an average of £78,393 each to solicitor impersonation in property transactions. Fake doctors are treating NHS patients. Construction professionals are forging engineering seals, compromising building safety. A single MP publishing their Nostr pubkey on parliament.uk creates a trust anchor for their constituency and a precedent for cryptographic identity verification across government. The UK has the opportunity to lead on decentralised identity — or follow the EU's centralised eIDAS model."

### 9.4 For the Public

"Before you transfer your house deposit, you should be able to verify your solicitor is who they claim to be — instantly, on your phone, using cryptographic proof. Before you see a doctor, you should be able to confirm their registration is genuine. Before an engineer signs off on your building's safety, their stamp should be verifiable. Signet makes this possible."

---

## Sources

### UK Regulatory
- [SRA — Bogus Law Firms and Identity Theft (Warning Notice)](https://www.sra.org.uk/solicitors/guidance/bogus-law-firms-identity-theft/)
- [SRA — Scam Alerts](https://www.sra.org.uk/consumers/scam-alerts/)
- [GMC — Fraudulent Activity](https://www.gmc-uk.org/about/fraudulent-activity)
- [GMC — Statement on Zholia Alemi](https://www.gmc-uk.org/news/news-archive/statement-on-zholia-alemi)
- [CPS — Fake Doctor ordered to repay £406,624](https://www.cps.gov.uk/cps/news/fake-doctor-has-been-ordered-pay-back-ps406624-nhs-fraud-and-forgery-offending)
- [NHSCFA — NHS Staff Fraud](https://cfa.nhs.uk/fraud-prevention/reference-guide/nhscfa-thematic-fraud-areas/NHS-staff-fraud)
- [NHSCFA — Annual Report 2023-2024](https://www.gov.uk/government/publications/nhs-counter-fraud-authority-annual-report-and-accounts-2023-to-2024)

### UK Fraud Statistics
- [Cifas — Fraudscape 2025](https://www.cifas.org.uk/newsroom/fraudscape-2025-record-fraud-levels)
- [City of London Police — Conveyancing Fraud Surge 2025](https://www.cityoflondon.police.uk/news/city-of-london/news/2025/city-of-london-police-warns-public-about-surge-in-payment-diversion-fraud-targeting-property-transactions/)
- [UK Finance — Annual Fraud Report 2025](https://www.ukfinance.org.uk/policy-and-guidance/reports-and-publications/annual-fraud-report-2025)
- [ABI — Fraudulent Insurance Claims 2024](https://www.abi.org.uk/products-and-issues/topics-and-issues/fraud/fraud-data/)
- [NCA — National Strategic Assessment 2025 — Fraud](https://www.nationalcrimeagency.gov.uk/threats-2025/nsa-fraud-2025)

### US Fraud Statistics
- [FTC — $12.5 Billion Fraud Losses in 2024](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024)
- [FTC — Impersonation Scams 2024 Data Spotlight](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/04/impersonation-scams-not-what-they-used-be)
- [AARP/Javelin — Identity Fraud Cost Americans $47 Billion in 2024](https://www.aarp.org/money/scams-fraud/javelin-identity-theft-report-2024/)
- [California State Bar — Annual Discipline Report FY 2024](https://www.calbar.ca.gov/Portals/0/documents/reports/2024-Annual-Discipline-Report.pdf)

### Case Studies
- [Zholia Alemi — Wikipedia](https://en.wikipedia.org/wiki/Zholia_Alemi)
- [Psychology Today — How a Fake Psychiatrist Worked for 20 Years in the NHS](https://www.psychologytoday.com/us/blog/slightly-blighty/202303/how-did-a-fake-psychiatrist-work-for-20-years-in-uks-nhs)
- [Business Standard — Fake Cardiologist "N John Camm" in Madhya Pradesh](https://www.business-standard.com/india-news/n-john-camm-narendra-yadav-madhya-pradesh-damoh-mission-hospital-deaths-125040700346_1.html)
- [FindLaw — New York Fake Lawyer Mescall ($290,000 Fraud)](https://www.findlaw.com/legalblogs/law-and-life/new-york-man-poses-as-a-lawyer-and-steals-290000-from-clients/)
- [ENR — Fake Engineers Put Hundreds of Projects at Risk in California](https://www.enr.com/articles/38838-fake-engineers-put-hundreds-of-projects-at-risk-in-california)
- [SEC — BF Borgers CPA Fraud](https://www.sec.gov/newsroom/press-releases/2024-51)
- [DEA — Gustavo Nunez Fake Doctor Sentenced to 38+ Years](https://www.dea.gov/press-releases/2017/08/09/fake-doctor-arrested-dea-sentenced-over-38-years-prison)
- [Law Society of Scotland — Solicitors Jailed for £6M Fraud](https://www.lawscot.org.uk/news-and-events/law-society-news/solicitors-jailed-for-fraud/)

### AI and Deepfakes
- [DeepStrike — Deepfake Statistics 2025](https://deepstrike.io/blog/deepfake-statistics-2025)
- [DOJ — North Korea IT Worker Fraud Scheme ($88M)](https://www.justice.gov/opa/pr/arizona-woman-sentenced-17m-information-technology-worker-fraud-scheme-generated-revenue)
- [National Law Review — Deepfake Candidate Problem](https://natlawreview.com/article/your-next-data-breach-may-start-job-interview-deepfake-candidate-problem)
- [Sumsub — 2024 Global Identity Fraud Report](https://sumsub.com/fraud-report-2024/)

### Regulatory Frameworks
- [UK DIATF — GOV.UK](https://www.gov.uk/government/collections/uk-digital-identity-and-attributes-trust-framework)
- [UK Digital Identity Sectoral Analysis 2025](https://www.gov.uk/government/publications/digital-identity-sectoral-analysis-report-2025/digital-identity-sectoral-analysis-2025)
- [eIDAS 2.0 Fraud Prevention Requirements (Unissey)](https://www.unissey.com/en/blog/digital-identity-how-to-prepare-for-eidas-2-0-fraud-prevention-requirements)
- [3,000 Doctors Face Checks Post-Alemi — Kingsley Napley](https://www.kingsleynapley.co.uk/insights/blogs/regulatory-blog/3000-doctors-face-checks-after-psychiatrist-who-practised-without-a-licence-is-sentenced-to-a-five-year-prison-sentence)
- [Legal Futures — Bogus Solicitor Repeat Offender](https://www.legalfutures.co.uk/latest-news/bogus-solicitor-handed-suspended-jail-sentence-after-second-offence)
- [Jeelani Law — Fake Lawyers Preying on Immigrants](https://www.jeelani-law.com/how-fake-lawyers-are-preying-on-undocumented-immigrants-through-social-media/)
