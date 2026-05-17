import { benchmarkProfiles, requiredSafeguards } from "./benchmarks.js";
import { getJurisdictionProfile } from "./jurisdictions.js";
import { riskRules, severityWeights } from "./rules.js";

const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export function analyzeContract(rawText, context = {}) {
  const normalized = normalizeText(rawText);
  const clauses = extractClauses(normalized);
  const duplicateInfo = detectDuplicateClauses(clauses);
  const templateMode = isTemplateDocument(normalized);
  const findings = [];
  const effectiveContext = {
    contractType: context.contractType || "general",
    perspective: context.perspective || "individual",
    counterparty: context.counterparty || "the other party",
    jurisdiction: context.jurisdiction || "not specified",
    projectName: context.projectName || "General project",
    versionLabel: context.versionLabel || "v1"
  };

  clauses.forEach((clause, index) => {
    if (duplicateInfo.duplicateIndexes.has(index)) return;

    riskRules.forEach((rule) => {
      const matched = rule.patterns.some((pattern) => pattern.test(clause.text));
      if (!matched) return;
      const conditional = templateMode || isTemplateOrOptionalClause(clause.text);
      const baseSeverity = adjustSeverity(rule.severity, rule.domain, effectiveContext.contractType);

      findings.push({
        id: `${rule.id}-${index}`,
        ruleId: rule.id,
        clauseNumber: index + 1,
        excerpt: trimExcerpt(clause.text),
        domain: rule.domain,
        label: rule.label,
        severity: conditional ? downgradeSeverity(baseSeverity) : baseSeverity,
        confidence: conditional ? Math.max(0.55, rule.confidence - 0.16) : rule.confidence,
        conditional,
        why: rule.why,
        impact: conditional
          ? `${personalizeImpact(rule.impact, effectiveContext.perspective)} This appears in template or optional checkbox language, so confirm whether it was selected or completed.`
          : personalizeImpact(rule.impact, effectiveContext.perspective),
        recommendation: conditional
          ? `${rule.recommendation} Also confirm whether this optional/template clause is actually part of the signed agreement.`
          : rule.recommendation
      });
    });
  });

  const deduped = dedupeFindings(findings);
  const enrichedClauses = buildClauseMap(clauses, deduped);
  const domainSummary = summarizeDomains(deduped);
  const severitySummary = summarizeSeverity(deduped);
  const benchmarkResults = compareBenchmarks(normalized, effectiveContext.contractType);
  const missingSafeguards = findMissingSafeguards(normalized, effectiveContext.contractType, deduped);
  const obligations = extractObligations(enrichedClauses, effectiveContext);
  const scenarios = buildScenarios(deduped, missingSafeguards, effectiveContext);
  const documentStats = buildDocumentStats(normalized, enrichedClauses, deduped);
  documentStats.duplicateClauses = duplicateInfo.duplicates.length;
  const contradictions = detectContradictions(normalized, deduped);
  const analysisWarnings = buildAnalysisWarnings(normalized, documentStats, duplicateInfo, effectiveContext);
  const readiness = buildReadinessChecklist(deduped, missingSafeguards, benchmarkResults, analysisWarnings, contradictions);
  const score = calculateRiskScore(deduped, clauses.length, { templateMode });
  const level = riskLevel(score);

  return {
    generatedAt: new Date().toISOString(),
    context: effectiveContext,
    score,
    level,
    clausesAnalyzed: clauses.length,
    clauses: enrichedClauses,
    findings: deduped.sort(sortFindings),
    domainSummary,
    severitySummary,
    benchmarkResults,
    missingSafeguards,
    obligations,
    scenarios,
    documentStats,
    readiness,
    analysisWarnings,
    templateMode,
    contradictions,
    duplicateClauses: duplicateInfo.duplicates,
    jurisdictionNotes: buildJurisdictionNotes(effectiveContext.jurisdiction, deduped),
    summary: buildSummary(score, level, deduped, effectiveContext),
    recommendations: buildRecommendations(deduped, missingSafeguards)
  };
}

export function normalizeText(text) {
  return (text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractClauses(text) {
  if (!text) return [];

  const paragraphCandidates = text
    .split(/\n{2,}|(?=\n\s*(?:\d+\.|[A-Z][A-Z\s]{6,}:))/)
    .map((part) => part.replace(/\n+/g, " ").trim())
    .filter(Boolean);

  const clauses = [];

  paragraphCandidates.forEach((paragraph) => {
    if (paragraph.length <= 420) {
      clauses.push({ id: `clause-${clauses.length + 1}`, text: paragraph });
      return;
    }

    paragraph
      .split(/(?<=[.;:])\s+(?=(?:[A-Z]|\d+\.))/)
      .map((part) => part.trim())
      .filter((part) => part.length > 30)
      .forEach((part) => clauses.push({ id: `clause-${clauses.length + 1}`, text: part }));
  });

  return clauses;
}

function adjustSeverity(severity, domain, contractType) {
  const highContext =
    (contractType === "employment" && domain === "Employment restrictions") ||
    (contractType === "privacy" && domain === "Privacy and data protection") ||
    (contractType === "freelance" && domain === "Intellectual property");

  if (!highContext) return severity;
  if (severity === "medium") return "high";
  if (severity === "high") return "critical";
  return severity;
}

function downgradeSeverity(severity) {
  if (severity === "critical") return "high";
  if (severity === "high") return "medium";
  if (severity === "medium") return "low";
  return severity;
}

function isTemplateOrOptionalClause(text) {
  return /_{3,}|☐|\(check all that apply\)|\bselect one\b|\bchoose one\b|\[.*?\]/i.test(text);
}

function isTemplateDocument(text) {
  const blankCount = (text.match(/_{3,}/g) || []).length;
  const checkboxCount = (text.match(/☐/g) || []).length;
  const templateSignals = (text.match(/\bcheck all that apply\b|\bselect one\b|\btemplate\b/gi) || []).length;
  return blankCount + checkboxCount + templateSignals >= 8;
}

function personalizeImpact(impact, perspective = "user") {
  const label = perspective || "user";
  return impact.replace(/The user/g, `The ${label}`);
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.ruleId}:${finding.clauseNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeDomains(findings) {
  return Object.values(
    findings.reduce((acc, finding) => {
      if (!acc[finding.domain]) {
        acc[finding.domain] = {
          domain: finding.domain,
          count: 0,
          maxSeverity: finding.severity
        };
      }

      acc[finding.domain].count += 1;
      if (severityRank[finding.severity] > severityRank[acc[finding.domain].maxSeverity]) {
        acc[finding.domain].maxSeverity = finding.severity;
      }

      return acc;
    }, {})
  ).sort((a, b) => severityRank[b.maxSeverity] - severityRank[a.maxSeverity] || b.count - a.count);
}

function summarizeSeverity(findings) {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
}

function calculateRiskScore(findings, clauseCount, options = {}) {
  if (!findings.length) return 8;

  const weightedTotal = findings.reduce((total, finding) => {
    return total + severityWeights[finding.severity] * finding.confidence * 7;
  }, 0);
  const density = Math.min(18, (findings.length / Math.max(clauseCount, 1)) * 40);
  const criticalBoost = findings.some((finding) => finding.severity === "critical") ? 12 : 0;
  const highBoost = findings.filter((finding) => finding.severity === "high").length * 3;

  const rawScore = Math.min(100, Math.round(weightedTotal + density + criticalBoost + highBoost));
  return options.templateMode ? Math.min(76, rawScore) : rawScore;
}

function riskLevel(score) {
  if (score >= 78) return "Critical";
  if (score >= 55) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
}

function buildSummary(score, level, findings, context) {
  if (!findings.length) {
    return "No major risk patterns were detected in this text. A legal professional should still review the full agreement, especially if money, employment, property, sensitive data, or intellectual property is involved.";
  }

  const top = findings.slice(0, 3).map((finding) => finding.label.toLowerCase());
  const category = context.contractType || "contract";

  return `This ${category} review produced a ${level.toLowerCase()} risk rating of ${score}/100. The most important issues are ${humanList(top)}. These terms may affect flexibility, financial exposure, privacy, dispute rights, or ownership unless they are narrowed or clarified.`;
}

function buildClauseMap(clauses, findings) {
  return clauses.map((clause, index) => {
    const clauseFindings = findings.filter((finding) => finding.clauseNumber === index + 1);
    const highest = clauseFindings.sort(sortFindings)[0];

    return {
      ...clause,
      number: index + 1,
      wordCount: countWords(clause.text),
      domains: [...new Set(clauseFindings.map((finding) => finding.domain))],
      severity: highest?.severity || "low",
      findingIds: clauseFindings.map((finding) => finding.id),
      hasRisk: clauseFindings.length > 0
    };
  });
}

function compareBenchmarks(text, contractType) {
  const profile = benchmarkProfiles[contractType] || benchmarkProfiles.general;
  const lower = text.toLowerCase();

  return profile.map((benchmark) => {
    const riskyMatches = benchmark.riskySignals.filter((signal) => lower.includes(signal.toLowerCase()));
    const saferMatches = benchmark.saferSignals.filter((signal) => lower.includes(signal.toLowerCase()));
    const status = riskyMatches.length && !saferMatches.length ? "attention" : riskyMatches.length ? "partial" : "clear";

    return {
      ...benchmark,
      status,
      riskyMatches,
      saferMatches,
      score: Math.max(0, 100 - riskyMatches.length * 28 + saferMatches.length * 18)
    };
  });
}

function findMissingSafeguards(text, contractType, findings) {
  const lower = text.toLowerCase();
  const safeguards = requiredSafeguards[contractType] || requiredSafeguards.general;

  return safeguards
    .filter((safeguard) => !safeguard.signals.some((signal) => lower.includes(signal.toLowerCase())))
    .map((safeguard) => ({
      label: safeguard.label,
      severity: findings.some((finding) => severityRank[finding.severity] >= 3) ? "high" : "medium",
      reason: "This protective term was not detected in the document.",
      recommendation: `Ask to add explicit language for ${safeguard.label.toLowerCase()}.`
    }));
}

function extractObligations(clauses, context) {
  const obligationPatterns = [
    { actor: context.perspective, pattern: /\b(shall|must|agrees?\s+to|required\s+to|responsible\s+for)\b/i },
    { actor: context.counterparty, pattern: /\b(company|provider|client|landlord|employer)\s+(shall|must|may|agrees?\s+to)\b/i },
    { actor: "Either party", pattern: /\b(each party|either party|both parties)\b/i }
  ];

  return clauses
    .filter((clause) => obligationPatterns.some((item) => item.pattern.test(clause.text)))
    .slice(0, 12)
    .map((clause) => {
      const match = obligationPatterns.find((item) => item.pattern.test(clause.text));
      return {
        clauseNumber: clause.number,
        actor: match.actor,
        severity: clause.severity,
        text: trimExcerpt(clause.text)
      };
    });
}

function buildScenarios(findings, missingSafeguards, context) {
  const scenarios = [];
  const has = (ruleId) => findings.some((finding) => finding.ruleId === ruleId);

  if (has("non-compete") || has("non-solicit")) {
    scenarios.push({
      title: "Changing jobs or clients",
      severity: "high",
      outcome: `The ${context.perspective} may face restrictions on joining a competitor, serving familiar clients, or using professional relationships after exit.`
    });
  }

  if (has("ip-assignment")) {
    scenarios.push({
      title: "Reusing prior work",
      severity: "critical",
      outcome: `The ${context.perspective} may lose control over tools, drafts, methods, or prior materials unless ownership carve-outs are added.`
    });
  }

  if (has("auto-renewal") || has("cancellation-penalty")) {
    scenarios.push({
      title: "Leaving the agreement early",
      severity: "high",
      outcome: `The ${context.perspective} may owe renewal charges, penalties, or remaining fees even after stopping use.`
    });
  }

  if (has("data-sharing") || has("data-retention")) {
    scenarios.push({
      title: "Data exposure after signup",
      severity: "high",
      outcome: `Personal or sensitive data may continue to be shared or retained beyond the immediate service relationship.`
    });
  }

  if (has("indemnity") || has("liability-cap")) {
    scenarios.push({
      title: "A dispute or third-party claim",
      severity: "critical",
      outcome: `The ${context.perspective} may carry defense costs or have limited recovery even when the other side contributed to the harm.`
    });
  }

  if (!scenarios.length && missingSafeguards.length) {
    scenarios.push({
      title: "Unclear protection gap",
      severity: "medium",
      outcome: "The contract lacks protective language that would make rights, remedies, and exit paths clearer."
    });
  }

  return scenarios.slice(0, 6);
}

function buildDocumentStats(text, clauses, findings) {
  const words = countWords(text);
  const longClauses = clauses.filter((clause) => clause.wordCount > 90).length;
  const riskDensity = clauses.length ? Math.round((findings.length / clauses.length) * 100) : 0;

  return {
    words,
    clauses: clauses.length,
    longClauses,
    riskDensity,
    readability: words / Math.max(clauses.length, 1) > 85 ? "Dense" : "Readable"
  };
}

function buildReadinessChecklist(findings, missingSafeguards, benchmarks, warnings = [], contradictions = []) {
  return [
    {
      label: "Review critical findings",
      status: findings.some((finding) => finding.severity === "critical") ? "needs-review" : "ok",
      detail: "Critical clauses should be escalated before signature."
    },
    {
      label: "Add missing safeguards",
      status: missingSafeguards.length ? "needs-review" : "ok",
      detail: `${missingSafeguards.length} protective term${missingSafeguards.length === 1 ? "" : "s"} not detected.`
    },
    {
      label: "Benchmark alignment",
      status: benchmarks.some((item) => item.status === "attention") ? "needs-review" : "ok",
      detail: "Compare flagged language against common safer contract patterns."
    },
    {
      label: "Human legal review",
      status: findings.length ? "recommended" : "optional",
      detail: "Use professional review for binding legal decisions."
    },
    {
      label: "Edge-case review",
      status: warnings.length || contradictions.length ? "needs-review" : "ok",
      detail: `${warnings.length} warning${warnings.length === 1 ? "" : "s"} and ${contradictions.length} contradiction signal${contradictions.length === 1 ? "" : "s"}.`
    }
  ];
}

function detectDuplicateClauses(clauses) {
  const seen = new Map();
  const duplicates = [];
  const duplicateIndexes = new Set();

  clauses.forEach((clause, index) => {
    const key = normalizeClauseFingerprint(clause.text);
    if (!key || key.length < 35) return;

    if (seen.has(key)) {
      const originalIndex = seen.get(key);
      duplicateIndexes.add(index);
      duplicates.push({
        clauseNumber: index + 1,
        duplicateOf: originalIndex + 1,
        excerpt: trimExcerpt(clause.text)
      });
    } else {
      seen.set(key, index);
    }
  });

  return { duplicates, duplicateIndexes };
}

function normalizeClauseFingerprint(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(the|a|an|and|or|of|to|in)\b/g, "").trim();
}

function detectContradictions(text, findings) {
  const lower = text.toLowerCase();
  const labels = new Set(findings.map((finding) => finding.ruleId));
  const contradictions = [];

  const pairs = [
    {
      when: lower.includes("cancel anytime") && labels.has("cancellation-penalty"),
      title: "Cancellation conflict",
      detail: "The document suggests cancellation flexibility while also imposing penalty or non-refundable fee language."
    },
    {
      when: lower.includes("you own your content") && labels.has("ip-assignment"),
      title: "Content ownership conflict",
      detail: "The document suggests user ownership while also granting broad ownership or license rights."
    },
    {
      when: /no\s+personal\s+information|do\s+not\s+collect\s+personal/i.test(text) && labels.has("data-sharing"),
      title: "Privacy collection conflict",
      detail: "The document appears to deny personal data collection while also allowing broad data collection or sharing."
    },
    {
      when: lower.includes("no arbitration") && labels.has("arbitration"),
      title: "Dispute process conflict",
      detail: "The document includes signals for both no arbitration and mandatory arbitration."
    }
  ];

  pairs.forEach((pair) => {
    if (pair.when) contradictions.push({ title: pair.title, detail: pair.detail });
  });

  return contradictions;
}

function buildAnalysisWarnings(text, stats, duplicateInfo, context) {
  const warnings = [];

  if (stats.words < 80) {
    warnings.push("Very short document detected. Results may be incomplete because the input may be only an excerpt.");
  }

  if (stats.words > 60000) {
    warnings.push("Very large document detected. Consider reviewing sections separately for higher precision.");
  }

  if (duplicateInfo.duplicates.length) {
    warnings.push(`${duplicateInfo.duplicates.length} duplicate clause${duplicateInfo.duplicates.length === 1 ? "" : "s"} detected and de-emphasized.`);
  }

  if (/_{3,}|☐|\(check all that apply\)/i.test(text)) {
    warnings.push("Template blanks or checkbox options detected. Confirm which options were completed before treating findings as final contract terms.");
  }

  if (hasMeaningfulNonLatinText(text) && !/India|European|United Kingdom|Singapore/i.test(context.jurisdiction)) {
    warnings.push("Possible multilingual or non-English content detected. Configure OCR/language-specific review for better accuracy.");
  }

  return warnings;
}

function hasMeaningfulNonLatinText(text) {
  const nonLatinLetters = text.match(/[\p{Script=Devanagari}\p{Script=Arabic}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hebrew}\p{Script=Thai}]/gu) || [];
  return nonLatinLetters.length > 20;
}

function buildJurisdictionNotes(jurisdiction, findings) {
  const normalized = jurisdiction.toLowerCase();
  const profile = getJurisdictionProfile(jurisdiction);
  const notes = [...profile.notes];

  if (normalized === "not specified" || normalized === "global") {
    notes.push("No jurisdiction was selected. Treat enforceability and statutory rights as unresolved.");
  }

  if (findings.some((finding) => finding.ruleId === "non-compete")) {
    notes.push("Non-compete enforceability varies sharply by jurisdiction and role. Local review is strongly recommended.");
  }

  if (findings.some((finding) => finding.domain === "Privacy and data protection")) {
    notes.push("Privacy obligations depend on applicable data protection regimes, user location, and data type.");
  }

  if (normalized.includes("california")) {
    notes.push("California often scrutinizes employment restraints, consumer terms, privacy disclosures, and unfair business practices.");
  }

  if (normalized.includes("india")) {
    notes.push("India-specific review should consider contract restraint rules, arbitration seat, stamp requirements, and privacy obligations under applicable law.");
  }

  if (normalized.includes("eu") || normalized.includes("gdpr")) {
    notes.push("EU/GDPR review should focus on lawful basis, minimization, retention, processor terms, cross-border transfer, and data subject rights.");
  }

  return [...new Set(notes)];
}

function buildRecommendations(findings, missingSafeguards = []) {
  const unique = [];
  const seen = new Set();

  findings.forEach((finding) => {
    if (seen.has(finding.recommendation)) return;
    seen.add(finding.recommendation);
    unique.push({
      domain: finding.domain,
      severity: finding.severity,
      text: finding.recommendation
    });
  });

  missingSafeguards.forEach((item) => {
    if (seen.has(item.recommendation)) return;
    seen.add(item.recommendation);
    unique.push({
      domain: "Missing safeguard",
      severity: item.severity,
      text: item.recommendation
    });
  });

  return unique.slice(0, 8);
}

function sortFindings(a, b) {
  return severityRank[b.severity] - severityRank[a.severity] || b.confidence - a.confidence;
}

function trimExcerpt(text) {
  return text.length > 520 ? `${text.slice(0, 517).trim()}...` : text;
}

function countWords(text) {
  return (text.match(/\b[\w'-]+\b/g) || []).length;
}

function humanList(items) {
  if (items.length <= 1) return items[0] || "no major issues";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
