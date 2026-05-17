# Problem Analysis: Leashguards

## Core Need

People and organizations routinely accept agreements they do not fully understand. These documents often contain dense legal language, hidden obligations, restrictive clauses, broad rights transfers, unilateral terms, privacy risks, and financial liabilities. The problem asks for an AI-powered system that goes beyond summarization by extracting clauses, reasoning about real-world consequences, and explaining risk transparently.

## Primary Users

- Employees reviewing offer letters, employment contracts, non-competes, confidentiality agreements, and IP assignment clauses.
- Freelancers and small businesses reviewing service agreements, vendor contracts, and client terms.
- Consumers reviewing subscription agreements, rental agreements, platform terms, privacy policies, and insurance policies.
- Organizations reviewing vendor or SaaS contracts for liability, compliance, privacy, renewal, and termination risk.

## Contract Risks To Detect

- Employment restrictions: non-compete, non-solicit, moonlighting restrictions, unilateral termination, salary clawbacks.
- Financial liabilities: cancellation penalties, auto-renewals, late fees, indemnity, hidden charges, liquidated damages.
- Intellectual property: broad assignment, work-for-hire language, moral rights waiver, ownership of pre-existing work.
- Privacy and data: excessive data collection, third-party sharing, indefinite retention, vague consent, biometric or sensitive data use.
- Dispute resolution: mandatory arbitration, class action waiver, distant jurisdiction, one-sided fee shifting.
- Liability and warranty: broad disclaimers, limitation of liability, consequential damage exclusion, asymmetric remedies.
- Ambiguity and imbalance: vague phrases, unilateral amendment rights, undefined obligations, contradictory terms.

## Required Capabilities

The system should:

- Ingest legal text from multiple document types.
- Extract meaningful clauses rather than only summarize paragraphs.
- Classify clauses by legal function and risk domain.
- Identify harmful, exploitative, ambiguous, or one-sided terms.
- Explain practical consequences from the affected party's perspective.
- Score risk by severity and confidence.
- Produce interpretable, actionable reports.
- Support multiple agreement categories.
- Include clear disclaimers that the platform is not legal advice.

## Prototype Strategy

For the first build, Leashguards should demonstrate end-to-end product behavior in the browser:

- A document intake panel with text paste, upload, category selection, and sample contracts.
- A local analysis engine using structured legal-risk heuristics.
- Clause extraction by sentence and paragraph segmentation.
- Risk classification across employment, privacy, financial, IP, dispute, liability, termination, compliance, and ambiguity domains.
- A dashboard with overall risk score, severity distribution, clause findings, explanations, and negotiation recommendations.

This establishes the complete user experience and reasoning interface. Later versions can replace or augment the local heuristic engine with LLM-based extraction, RAG benchmarks, OCR, vector search, and multi-agent workflows.

