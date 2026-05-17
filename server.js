import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formidable } from "formidable";
import { analyzeContract } from "./src/analyzer.js";
import { authenticateRequest, loginUser, registerUser } from "./src/auth.js";
import { parseDocument } from "./src/documentParser.js";
import { documentAiStatus } from "./src/documentAiParser.js";
import { loadLocalEnv } from "./src/env.js";
import { generateAiInsights, llmStatus } from "./src/llmReasoner.js";
import { createProfessionalPdf } from "./src/pdfReport.js";
import { formatReport } from "./src/report.js";
import { createRateLimiter, documentFingerprint, redactReport } from "./src/security.js";
import { createJsonStore } from "./src/storage.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname);
loadLocalEnv();
const dataDir = join(root, "data");
const store = createJsonStore(dataDir);
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const rateLimit = createRateLimiter({
  windowMs: Number(process.env.LEASHGUARDS_RATE_WINDOW_MS || process.env.LEXGUARD_RATE_WINDOW_MS || 60_000),
  max: Number(process.env.LEASHGUARDS_RATE_LIMIT || process.env.LEXGUARD_RATE_LIMIT || 90)
});

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const server = createServer(async (request, response) => {
  try {
    if (!rateLimit(request, response)) {
      return sendJson(response, 429, { error: "Too many requests. Please wait before trying again." });
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "leashguards",
        mode: "local",
        llm: llmStatus(),
        documentAi: documentAiStatus()
      });
    }

    if (url.pathname === "/api/deployment-check" && request.method === "GET") {
      return sendJson(response, 200, deploymentCheck());
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      return await handleRegister(request, response);
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      return await handleLogin(request, response);
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const user = await authenticateRequest(store, request);
      return sendJson(response, 200, { user });
    }

    if (url.pathname === "/api/parse-document" && request.method === "POST") {
      return await handleParseDocument(request, response);
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      return await handleAnalyze(request, response);
    }

    if (url.pathname === "/api/export/pdf" && request.method === "POST") {
      return await handlePdfExport(request, response);
    }

    if (url.pathname === "/api/compare" && request.method === "POST") {
      return await handleCompare(request, response);
    }

    if (url.pathname === "/api/projects" && request.method === "GET") {
      const user = await authenticateRequest(store, request);
      return sendJson(response, 200, { projects: await buildProjects(user) });
    }

    if (url.pathname === "/api/reports" && request.method === "GET") {
      const user = await authenticateRequest(store, request);
      return sendJson(response, 200, { reports: await readReportsForUser(user) });
    }

    if (url.pathname.startsWith("/api/")) {
      return sendJson(response, 404, { error: "API route not found" });
    }

    return serveStatic(url.pathname, response);
  } catch (error) {
    return sendJson(response, error.statusCode || 500, { error: error.statusCode ? error.message : "Server error", detail: error.message });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Start with another port, for example: $env:PORT='5174'; npm start`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Leashguards running at http://${host}:${port}`);
});

async function handleAnalyze(request, response) {
  const payload = await readJsonBody(request);
  const user = await authenticateRequest(store, request);
  const text = String(payload.text || "").trim();

  if (!text) {
    return sendJson(response, 400, { error: "Document text is required." });
  }

  const report = analyzeContract(text, {
    contractType: payload.contractType || "general",
    perspective: payload.perspective || "individual",
    counterparty: payload.counterparty || "the other party",
    jurisdiction: payload.jurisdiction || "not specified",
    projectName: payload.projectName || "General project",
    versionLabel: payload.versionLabel || "v1"
  });

  report.caseName = payload.caseName || "Untitled review";
  report.userId = user?.id || "anonymous";
  report.projectName = payload.projectName || "General project";
  report.versionLabel = payload.versionLabel || "v1";
  report.id = createReportId(report);
  report.documentFingerprint = documentFingerprint(text);
  report.sourcePreview = text.slice(0, 280);
  report.aiInsights = await generateAiInsights({
    text,
    report,
    provider: payload.llmProvider || process.env.LEASHGUARDS_LLM_PROVIDER || process.env.LEXGUARD_LLM_PROVIDER || "none"
  });
  report.exportText = formatReport(report);

  await saveReport(report);
  return sendJson(response, 200, { report });
}

async function handleParseDocument(request, response) {
  const { fields, files } = await parseMultipart(request);
  const uploadedFiles = Array.isArray(files.document) ? files.document : [files.document].filter(Boolean);

  if (!uploadedFiles.length) {
    return sendJson(response, 400, { error: "Upload one or more documents using the field name 'document'." });
  }

  const parsedDocuments = [];

  for (const uploaded of uploadedFiles.slice(0, 8)) {
    parsedDocuments.push(await parseDocument(uploaded, {
      ocrLanguage: Array.isArray(fields.ocrLanguage) ? fields.ocrLanguage[0] : fields.ocrLanguage
    }));
  }

  const combinedText = parsedDocuments
    .map((item, index) => `\n\n--- Document ${index + 1}: ${item.metadata.filename} ---\n${item.text}`)
    .join("\n")
    .trim();

  return sendJson(response, 200, {
    text: combinedText,
    documents: parsedDocuments,
    metadata: {
      parser: "multi-document",
      documentCount: parsedDocuments.length,
      filenames: parsedDocuments.map((item) => item.metadata.filename)
    },
    warnings: parsedDocuments.flatMap((item) => item.warnings || [])
  });
}

async function handleRegister(request, response) {
  try {
    const payload = await readJsonBody(request);
    const user = await registerUser(store, payload);
    return sendJson(response, 201, { user });
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }
}

async function handleLogin(request, response) {
  try {
    const payload = await readJsonBody(request);
    const session = await loginUser(store, payload);
    response.setHeader("Set-Cookie", `leashguards_session=${encodeURIComponent(session.token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`);
    return sendJson(response, 200, session);
  } catch (error) {
    return sendJson(response, 401, { error: error.message });
  }
}

async function handlePdfExport(request, response) {
  const payload = await readJsonBody(request);
  if (!payload.report) return sendJson(response, 400, { error: "Report payload is required." });

  const pdf = await createProfessionalPdf(payload.report);
  response.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeFilename(payload.report.caseName || "leashguards-report")}.pdf"`
  });
  response.end(pdf);
}

async function handleCompare(request, response) {
  const payload = await readJsonBody(request);
  const base = payload.baseReport || null;
  const revised = payload.revisedReport || null;

  if (!base || !revised) {
    return sendJson(response, 400, { error: "baseReport and revisedReport are required." });
  }

  const comparison = compareReports(base, revised);
  return sendJson(response, 200, { comparison });
}

async function serveStatic(pathname, response) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    return sendText(response, 403, "Forbidden");
  }

  try {
    await readFile(filePath);
  } catch (error) {
    return sendText(response, 404, "Not found");
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function parseMultipart(request) {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
    maxFileSize: 25 * 1024 * 1024
  });

  return new Promise((resolvePromise, rejectPromise) => {
    form.parse(request, (error, fields, files) => {
      if (error) rejectPromise(error);
      else resolvePromise({ fields, files });
    });
  });
}

async function readReports() {
  return store.readReports();
}

async function readReportsForUser(user) {
  const reports = await readReports();
  if (!user) return reports.filter((report) => !report.userId || report.userId === "anonymous");
  return reports.filter((report) => report.userId === user.id || report.userId === "anonymous");
}

async function saveReport(report) {
  const reports = await readReports();
  const nextReports = [
    trimStoredReport(report),
    ...reports.filter((item) => item.id !== report.id)
  ].slice(0, 25);

  await store.writeReports(nextReports);
}

function trimStoredReport(report) {
  const redacted = redactReport(report);
  return {
    caseName: redacted.caseName,
    id: redacted.id,
    userId: redacted.userId,
    projectName: redacted.projectName,
    versionLabel: redacted.versionLabel,
    generatedAt: redacted.generatedAt,
    context: redacted.context,
    score: redacted.score,
    level: redacted.level,
    clausesAnalyzed: redacted.clausesAnalyzed,
    clauses: redacted.clauses,
    findings: redacted.findings,
    domainSummary: redacted.domainSummary,
    severitySummary: redacted.severitySummary,
    benchmarkResults: redacted.benchmarkResults,
    missingSafeguards: redacted.missingSafeguards,
    obligations: redacted.obligations,
    scenarios: redacted.scenarios,
    recommendations: redacted.recommendations,
    documentStats: redacted.documentStats,
    readiness: redacted.readiness,
    jurisdictionNotes: redacted.jurisdictionNotes,
    analysisWarnings: redacted.analysisWarnings,
    contradictions: redacted.contradictions,
    duplicateClauses: redacted.duplicateClauses,
    aiInsights: redacted.aiInsights,
    summary: redacted.summary,
    sourcePreview: redacted.sourcePreview,
    documentFingerprint: redacted.documentFingerprint
  };
}

function deploymentCheck() {
  const checks = [
    {
      name: "Node runtime",
      ok: true,
      detail: process.version
    },
    {
      name: "Host binding",
      ok: Boolean(host),
      detail: `${host}:${port}`
    },
    {
      name: "Storage mode",
      ok: true,
      detail: process.env.LEASHGUARDS_STORAGE_KEY || process.env.LEXGUARD_STORAGE_KEY ? "encrypted-json-configured" : "local-json"
    },
    {
      name: "Document AI",
      ok: documentAiStatus().configured,
      detail: documentAiStatus().configured ? "configured" : "not configured"
    },
    {
      name: "LLM provider",
      ok: llmStatus().active !== "offline",
      detail: llmStatus().active
    },
    {
      name: "Rate limiting",
      ok: true,
      detail: `${process.env.LEASHGUARDS_RATE_LIMIT || process.env.LEXGUARD_RATE_LIMIT || 90} requests/window`
    }
  ];

  return {
    ok: checks.every((check) => check.ok || ["Document AI", "LLM provider"].includes(check.name)),
    checks
  };
}

async function buildProjects(user) {
  const reports = user ? await readReportsForUser(user) : await readReports();
  const projects = new Map();

  reports.forEach((report) => {
    const name = report.projectName || "General project";
    if (!projects.has(name)) {
      projects.set(name, { name, reports: [] });
    }
    projects.get(name).reports.push(report);
  });

  return [...projects.values()].map((project) => ({
    ...project,
    reports: project.reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
  }));
}

function compareReports(base, revised) {
  const baseFindings = new Map(base.findings.map((finding) => [finding.ruleId, finding]));
  const revisedFindings = new Map(revised.findings.map((finding) => [finding.ruleId, finding]));
  const added = [...revisedFindings.values()].filter((finding) => !baseFindings.has(finding.ruleId));
  const removed = [...baseFindings.values()].filter((finding) => !revisedFindings.has(finding.ruleId));
  const persistent = [...revisedFindings.values()].filter((finding) => baseFindings.has(finding.ruleId));

  return {
    base: { caseName: base.caseName, score: base.score, level: base.level },
    revised: { caseName: revised.caseName, score: revised.score, level: revised.level },
    scoreDelta: revised.score - base.score,
    added,
    removed,
    persistent
  };
}

function createReportId(report) {
  return `${safeFilename(report.projectName || "project")}-${safeFilename(report.versionLabel || "v")}-${Date.now()}`;
}

function safeFilename(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "leashguards";
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, payload) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(payload);
}
