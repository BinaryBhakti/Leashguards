# Leashguards

AI Rights & Contract Intelligence System

Leashguards is a prototype contract intelligence platform that helps users inspect legal and quasi-legal documents before accepting them. It extracts important clauses, flags risky language, explains practical implications in plain language, and generates a severity-based risk report.

This repository contains a local full-stack contract intelligence application. The Node backend serves the browser app, runs analysis through an API, and stores recent reports locally.

## Current Application

- Paste contract text or upload a text-like document.
- Parse PDF, DOCX, RTF, text, and image scans with OCR.
- Route scanned PDFs through Google Document AI when configured.
- Select the agreement category and affected party perspective.
- Select jurisdiction, project, version, and AI reasoning mode.
- Run clause extraction and risk analysis.
- Review risk score, clause categories, red flags, practical implications, and negotiation suggestions.
- Explore extracted clauses with risk labels.
- Compare terms against benchmark safeguard profiles.
- Review missing safeguards, obligation maps, and consequence scenarios.
- Copy, print, or download a text report.
- Generate a professional PDF report.
- Keep recent review history in browser storage.
- Persist reports through the local backend and compare versions.
- Register/login locally for user-scoped report history.
- Use sample agreements for quick demonstrations.

## Optional LLM Setup

Leashguards works without an external model using transparent local reasoning. To enable deeper LLM reasoning, set one provider before starting the server.

Recommended local setup:

```powershell
copy .env.example .env.local
```

Then edit `.env.local` and put your keys there. `.env.local` is ignored by git.

OpenAI:

```powershell
$env:LEASHGUARDS_LLM_PROVIDER='openai'
$env:OPENAI_API_KEY='your-key'
npm start
```

Gemini:

```powershell
$env:LEASHGUARDS_LLM_PROVIDER='gemini'
$env:GEMINI_API_KEY='your-key'
npm start
```

## Google Document AI Setup

For scanned PDFs, configure Document AI before starting the server:

```powershell
$env:GOOGLE_CLOUD_PROJECT_ID='your-project-id'
$env:GOOGLE_CLOUD_LOCATION='us'
$env:GOOGLE_DOCUMENT_AI_PROCESSOR_ID='your-processor-id'
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\service-account.json'
npm start
```

Embedded-text PDFs work without this setup. Image files use local OCR.

## Hardening Controls

- File type and size validation.
- Corrupt PDF/DOCX handling.
- Multi-file upload bundles.
- OCR confidence warnings and language selection.
- Short/huge document warnings.
- Duplicate clause detection.
- Distant contradiction signals.
- Rate limiting through `LEASHGUARDS_RATE_LIMIT`.
- Optional encrypted local JSON storage through `LEASHGUARDS_STORAGE_KEY`.
- Deployment diagnostics at `/api/deployment-check`.

## Run Locally

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:5173
```

If port `5173` is already busy:

```powershell
$env:PORT='5174'
npm start
```

Then open `http://127.0.0.1:5174`.

No package installation is required for the current version because the backend uses only built-in Node.js modules.

## Project Structure

```text
index.html          App shell
styles.css          Responsive interface styling
app.js              Browser controller and rendering
server.js           Local API and static file server
data/reports.json   Generated after saved analyses
src/analyzer.js     Contract intelligence engine
src/rules.js        Risk rule library
src/benchmarks.js   Benchmark and safeguard profiles
src/report.js       Text report formatter
src/samples.js      Demonstration agreements
docs/               Project analysis and specification
```

## Important Disclaimer

Leashguards is a legal awareness and contract intelligence tool. It does not replace legal professionals and does not provide legally binding advice.
