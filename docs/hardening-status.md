# Hardening Status

## Improved

- Scanned PDF pathway now supports Google Document AI when configured.
- PDF/DOCX/image/text upload parsing includes file size and type validation.
- Corrupt or mismatched PDF/DOCX files return clean errors instead of crashing the server.
- Password-protected or encrypted PDFs are detected through parser failure messages and reported to the user.
- Multi-file upload is supported and combines documents into one review bundle.
- OCR language can be selected for common demo languages.
- Bad OCR quality produces a confidence warning.
- Table-heavy PDF extraction produces a layout warning and recommends Document AI.
- Very short documents produce an incomplete-input warning.
- Very large extracted text is truncated for safe local processing.
- Duplicate clauses are detected and de-emphasized in scoring.
- Distant contradiction signals are detected for cancellation, content ownership, privacy, and arbitration conflicts.
- Request body size limits and per-route rate limiting are enabled.
- Stored reports are redacted for common PII patterns before persistence.
- Optional encrypted JSON storage is available with `LEASHGUARDS_STORAGE_KEY`.
- Local secrets can be loaded from ignored `.env.local` using `.env.example` as a template.
- Deployment diagnostics are available through `/api/deployment-check`.
- LLM reasoning is wrapped in safe fallback behavior.
- LLM output is sanitized and schema-shaped before storage/rendering.
- LLM output is checked for citation-like or certainty language hallucination warnings.
- Jurisdiction notes now use a dedicated jurisdiction profile dataset.
- Benchmarks now cover more agreement categories.
- Local authentication supports register/login with hashed passwords and sessions.
- Reports are tagged by user, project, and version.
- History APIs filter reports by authenticated user where available.

## Still Not Production-Perfect

- Local JSON storage is improved but not a true production database.
- Scanned PDF OCR requires Google Document AI credentials and a configured processor.
- Legal intelligence is richer but not a verified legal database.
- Jurisdiction support is awareness-oriented and not legal advice.
- Authentication is suitable for a local prototype, not a hardened SaaS auth system.
- No virus scanning, malware sandboxing, or enterprise DLP controls yet.
- Table and column reconstruction depends on parser quality; Document AI is recommended for production.
- Multilingual legal reasoning still needs language-specific legal benchmarks and review prompts.
- Rate limiting is in-memory and resets when the process restarts.

## Recommended Cloud Upgrade

- Cloud Run for deployment.
- Document AI for OCR/layout extraction.
- Firestore or Cloud SQL for users/projects/reports.
- Cloud Storage for encrypted document storage.
- Secret Manager for API keys.
- Gemini through Vertex AI for governed LLM reasoning.
