import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAiInsights({ text, report, provider = process.env.LEASHGUARDS_LLM_PROVIDER || process.env.LEXGUARD_LLM_PROVIDER || "none" }) {
  try {
    if (provider === "none") {
      return offlineInsights(report);
    }

    if (provider === "openai") {
      return generateOpenAiInsights(text, report);
    }

    if (provider === "gemini") {
      return generateGeminiInsights(text, report);
    }

    return offlineInsights(report);
  } catch (error) {
    return offlineInsights(report, `AI provider failed safely: ${error.message}`);
  }
}

export function llmStatus() {
  return {
    configuredProvider: process.env.LEASHGUARDS_LLM_PROVIDER || process.env.LEXGUARD_LLM_PROVIDER || "none",
    openaiReady: Boolean(process.env.OPENAI_API_KEY),
    geminiReady: Boolean(process.env.GEMINI_API_KEY),
    active: activeProvider()
  };
}

async function generateOpenAiInsights(text, report) {
  if (!process.env.OPENAI_API_KEY) return offlineInsights(report, "OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: buildPrompt(text, report) }
    ]
  });

  return parseAiJson(response.choices[0]?.message?.content, report);
}

async function generateGeminiInsights(text, report) {
  if (!process.env.GEMINI_API_KEY) return offlineInsights(report, "GEMINI_API_KEY is not configured.");

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
  const result = await model.generateContent(`${systemPrompt()}\n\n${buildPrompt(text, report)}\n\nReturn only JSON.`);

  return parseAiJson(result.response.text(), report);
}

function activeProvider() {
  const provider = process.env.LEASHGUARDS_LLM_PROVIDER || process.env.LEXGUARD_LLM_PROVIDER || "none";
  if (provider === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (provider === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  return "offline";
}

function systemPrompt() {
  return [
    "You are Leashguards, a legal awareness assistant.",
    "Do not provide legal advice or claim legal certainty.",
    "Do not invent statutes, citations, cases, or jurisdiction-specific rules not present in the supplied context.",
    "If uncertain, say review with qualified counsel.",
    "Analyze contractual risk from the affected party's perspective.",
    "Return concise JSON with exactly these keys: plainLanguageSummary, contradictions, deeperRisks, negotiationScript, attorneyQuestions.",
    "contradictions, deeperRisks, negotiationScript, and attorneyQuestions must be arrays of short strings."
  ].join(" ");
}

function buildPrompt(text, report) {
  const excerpt = text.slice(0, 12000);
  const findings = report.findings.slice(0, 8).map((finding) => ({
    label: finding.label,
    severity: finding.severity,
    domain: finding.domain,
    excerpt: finding.excerpt
  }));

  return JSON.stringify({
    context: report.context,
    score: report.score,
    level: report.level,
    findings,
    contractExcerpt: excerpt
  });
}

function parseAiJson(content, report) {
  try {
    const cleaned = extractJson(content);
    return sanitizeInsights({
      provider: activeProvider(),
      ...JSON.parse(cleaned)
    });
  } catch (error) {
    return offlineInsights(report, "The AI provider returned non-JSON output.");
  }
}

function extractJson(content = "") {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  throw new Error("No JSON object found.");
}

function sanitizeInsights(insights) {
  const sanitized = {
    provider: String(insights.provider || "unknown").slice(0, 40),
    note: typeof insights.note === "string" ? insights.note.slice(0, 300) : "",
    plainLanguageSummary: stringField(insights.plainLanguageSummary, 1200),
    contradictions: stringArray(insights.contradictions, 6, 350),
    deeperRisks: stringArray(insights.deeperRisks, 8, 350),
    negotiationScript: stringArray(insights.negotiationScript, 8, 350),
    attorneyQuestions: stringArray(insights.attorneyQuestions, 8, 250)
  };
  sanitized.hallucinationWarnings = hallucinationWarnings(sanitized);
  return sanitized;
}

function stringField(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function stringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string").slice(0, maxItems).map((item) => item.slice(0, maxLength));
}

function hallucinationWarnings(insights) {
  const allText = [
    insights.plainLanguageSummary,
    ...insights.contradictions,
    ...insights.deeperRisks,
    ...insights.negotiationScript,
    ...insights.attorneyQuestions
  ].join(" ");
  const warnings = [];

  if (/\b(section|article|regulation|statute)\s+\d+/i.test(allText) || /\b[A-Z][a-z]+ v\. [A-Z][a-z]+/.test(allText)) {
    warnings.push("AI output appears to mention legal citations or cases. Verify independently before relying on them.");
  }

  if (/\bguaranteed|definitely enforceable|definitely unenforceable|will win\b/i.test(allText)) {
    warnings.push("AI output used certainty language. Treat it as non-binding legal awareness only.");
  }

  return warnings;
}

function offlineInsights(report, note = "Using transparent local reasoning. Configure an LLM provider for deeper AI analysis.") {
  const topFindings = report.findings.slice(0, 3).map((finding) => finding.label);

  return {
    provider: "offline",
    note,
    plainLanguageSummary: report.summary,
    contradictions: detectSimpleContradictions(report),
    deeperRisks: topFindings.map((finding) => `${finding} may create practical risk beyond the clause wording.`),
    negotiationScript: report.recommendations.slice(0, 4).map((item) => `Please revise this term: ${item.text}`),
    attorneyQuestions: [
      "Which clauses are enforceable in the selected jurisdiction?",
      "Which obligations survive termination?",
      "Are the liability and indemnity terms mutual and proportionate?"
    ],
    hallucinationWarnings: []
  };
}

function detectSimpleContradictions(report) {
  const labels = new Set(report.findings.map((finding) => finding.ruleId));
  const contradictions = [];

  if (labels.has("termination-for-convenience") && labels.has("cancellation-penalty")) {
    contradictions.push("The agreement appears to allow exit while also imposing penalty-like consequences for leaving.");
  }

  if (labels.has("warranty-disclaimer") && labels.has("liability-cap")) {
    contradictions.push("The agreement may disclaim quality promises while also limiting remedies if the service fails.");
  }

  return contradictions;
}
