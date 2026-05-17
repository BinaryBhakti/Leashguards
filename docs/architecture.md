# Architecture

## Current Application Architecture

Leashguards is implemented as a local full-stack browser application.

```text
User input
  -> Node API
  -> text normalization
  -> clause segmentation
  -> rule-based semantic risk matching
  -> benchmark and safeguard comparison
  -> obligation extraction
  -> scenario simulation
  -> severity and confidence scoring
  -> explainable report generation
  -> dashboard rendering
  -> local report persistence
```

## Components

### Interface Layer

Files:

- `index.html`
- `styles.css`
- `app.js`

Responsibilities:

- Document intake.
- Category and perspective selection.
- Sample loading.
- Analysis trigger.
- Risk dashboard rendering.
- Report interaction.
- Filtering, tabs, copy, print, download, and review history.

### Server Layer

File:

- `server.js`

Responsibilities:

- Serve the frontend.
- Expose `/api/health`.
- Expose `/api/analyze`.
- Expose `/api/parse-document`.
- Expose `/api/export/pdf`.
- Expose `/api/compare`.
- Expose `/api/projects`.
- Expose `/api/reports`.
- Persist recent reports in `data/reports.json`.

### Analysis Layer

Files:

- `src/analyzer.js`
- `src/rules.js`
- `src/benchmarks.js`
- `src/report.js`

Responsibilities:

- Normalize input text.
- Split text into clauses.
- Evaluate clauses against risk rules.
- Assign domain, severity, confidence, and recommendations.
- Compute overall risk score and summary.
- Compare against benchmark profiles.
- Detect missing safeguards.
- Extract obligations and scenario consequences.
- Format exportable text reports.

### Demo Data

File:

- `src/samples.js`

Responsibilities:

- Provide realistic sample documents for live demonstrations.
- Cover employment, subscription, privacy, and freelance scenarios.

## AI Roadmap

The prototype uses transparent heuristics to keep results explainable. In a production architecture, the local analyzer can become the orchestration layer for multiple AI modules:

- OCR/document parser: extracts text from scanned PDFs, DOCX, and images.
- Clause extraction model: identifies legally meaningful clauses.
- Embedding search: compares clauses against benchmark standards.
- LLM risk reasoner: explains implications and detects subtle imbalance.
- Adversarial reviewer: asks "how could this clause harm the user?"
- Negotiation advisor: proposes safer language.
- Compliance checker: maps privacy and regulatory obligations.

## Deployment Model

The current build can be deployed as a static site. A production system would likely use:

- Frontend: React or similar SPA.
- Backend: API service for parsing, OCR, LLM orchestration, and report storage.
- Storage: object storage for documents with encryption.
- Database: relational database for users and reports.
- Vector database: benchmark clause retrieval.
- Model providers: Google proprietary AI models or other legal NLP models.
