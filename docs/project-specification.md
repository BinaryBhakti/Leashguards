# Project Specification: Leashguards

## Product Goal

Build a working AI-assisted contract intelligence platform that analyzes legal and quasi-legal documents, identifies risky clauses, explains their consequences, and helps users make informed decisions before agreeing.

## Non-Goal

Leashguards must not claim to provide legal advice, replace an attorney, or determine legal enforceability with certainty.

## Implemented Scope

### Inputs

- Paste contract text.
- Upload PDF, DOCX, RTF, text, markdown, CSV, and scanned image files for OCR.
- Name a review case.
- Select agreement category:
  - Employment
  - Freelance or service
  - Vendor or SaaS
  - Subscription
  - Rental
  - Privacy policy
  - Platform terms
  - Insurance
  - General contract
- Select user perspective:
  - Individual
  - Employee
  - Freelancer
  - Customer
  - Tenant
  - Small business
  - Organization

- Enter counterparty name.
- Select jurisdiction.
- Select local, OpenAI, or Gemini reasoning mode.

### Processing

- Normalize document text.
- Segment into paragraphs and candidate clauses.
- Match clauses against structured risk patterns.
- Classify findings by risk domain.
- Compute severity, confidence, and weighted score.
- Generate explanations, implications, and suggested negotiation moves.
- Compare clauses against agreement-specific benchmark profiles.
- Detect missing safeguards expected for the selected agreement type.
- Extract obligation-like clauses.
- Generate scenario-based consequence simulations.

### Outputs

- Overall risk score.
- Risk level: Low, Moderate, High, Critical.
- Severity distribution.
- Top findings.
- Clause-by-clause analysis.
- Plain-language explanation.
- Practical consequence scenario.
- Negotiation recommendation.
- Category and domain breakdown.
- Export-ready report layout.
- Review readiness checklist.
- Recent analysis history.
- Copy, print, and download actions.
- Backend-backed analysis endpoint.
- Local JSON report persistence.
- Document parsing endpoint.
- Professional PDF export endpoint.
- Project/version comparison endpoint.

## Risk Domains

- Employment restrictions
- Financial obligations
- Intellectual property
- Privacy and data protection
- Dispute resolution
- Liability and indemnity
- Termination and renewal
- Compliance and governance
- Ambiguity and unilateral control

## Scoring Model

Each finding receives:

- Severity: Low, Medium, High, Critical
- Confidence: 0.55 to 0.95
- Weight by risk domain and language strength

Overall risk score is calculated from matched findings, clause density, criticality, and ambiguity burden. Scores are capped at 100.

## Explainability Requirements

Each finding should include:

- Original clause excerpt.
- Risk label.
- Why it matters.
- Potential real-world impact.
- Safer alternative or negotiation point.
- Confidence indicator.

## Architecture

- Browser UI: `index.html`, `styles.css`, `app.js`
- Local API server: `server.js`
- Local analysis engine: `src/analyzer.js`
- Domain/risk rules: `src/rules.js`
- Benchmark and safeguard profiles: `src/benchmarks.js`
- Report formatter: `src/report.js`
- Sample contracts: `src/samples.js`
- Documentation: `docs/`

## Future Enhancements

- Broader scanned PDF rendering for OCR.
- LLM-based clause extraction.
- RAG over legal standards and contract benchmarks.
- Multi-agent workflows:
  - Clause extractor
  - Risk critic
  - Counterparty simulator
  - Negotiation advisor
  - Compliance checker
- User accounts and multi-user document history.
- Deeper jurisdiction-specific legal knowledge.
- Human lawyer review workflow.
