import { analyzeContract } from "./src/analyzer.js";
import { formatReport } from "./src/report.js";
import { samples } from "./src/samples.js";

const elements = {
  authStatus: document.querySelector("#authStatus"),
  authName: document.querySelector("#authName"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  loginButton: document.querySelector("#loginButton"),
  registerButton: document.querySelector("#registerButton"),
  projectName: document.querySelector("#projectName"),
  caseName: document.querySelector("#caseName"),
  versionLabel: document.querySelector("#versionLabel"),
  contractType: document.querySelector("#contractType"),
  perspective: document.querySelector("#perspective"),
  counterparty: document.querySelector("#counterparty"),
  jurisdiction: document.querySelector("#jurisdiction"),
  llmProvider: document.querySelector("#llmProvider"),
  fileInput: document.querySelector("#fileInput"),
  ocrLanguage: document.querySelector("#ocrLanguage"),
  contractText: document.querySelector("#contractText"),
  wordCount: document.querySelector("#wordCount"),
  parseStatus: document.querySelector("#parseStatus"),
  analyzeButton: document.querySelector("#analyzeButton"),
  copyReportButton: document.querySelector("#copyReportButton"),
  downloadButton: document.querySelector("#downloadButton"),
  pdfButton: document.querySelector("#pdfButton"),
  printButton: document.querySelector("#printButton"),
  apiStatus: document.querySelector("#apiStatus"),
  reportTitle: document.querySelector("#reportTitle"),
  emptyState: document.querySelector("#emptyState"),
  report: document.querySelector("#report"),
  riskScore: document.querySelector("#riskScore"),
  riskLevel: document.querySelector("#riskLevel"),
  findingCount: document.querySelector("#findingCount"),
  severeCount: document.querySelector("#severeCount"),
  riskDensity: document.querySelector("#riskDensity"),
  summaryText: document.querySelector("#summaryText"),
  severityBars: document.querySelector("#severityBars"),
  readinessList: document.querySelector("#readinessList"),
  domainList: document.querySelector("#domainList"),
  safeguardList: document.querySelector("#safeguardList"),
  warningList: document.querySelector("#warningList"),
  contradictionList: document.querySelector("#contradictionList"),
  severityFilter: document.querySelector("#severityFilter"),
  domainFilter: document.querySelector("#domainFilter"),
  findingsList: document.querySelector("#findingsList"),
  riskyOnlyToggle: document.querySelector("#riskyOnlyToggle"),
  clauseList: document.querySelector("#clauseList"),
  benchmarkList: document.querySelector("#benchmarkList"),
  scenarioList: document.querySelector("#scenarioList"),
  recommendations: document.querySelector("#recommendations"),
  obligationList: document.querySelector("#obligationList"),
  aiInsightList: document.querySelector("#aiInsightList"),
  jurisdictionList: document.querySelector("#jurisdictionList"),
  compareLatestButton: document.querySelector("#compareLatestButton"),
  comparisonList: document.querySelector("#comparisonList"),
  historyList: document.querySelector("#historyList")
};

let latestReport = null;
let history = loadHistory();
let authToken = localStorage.getItem("leashguards-token") || "";

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    const sample = samples[button.dataset.sample];
    elements.projectName.value = "Demo scenarios";
    elements.caseName.value = `${capitalize(button.dataset.sample)} sample`;
    elements.versionLabel.value = "v1";
    elements.contractType.value = sample.type;
    elements.perspective.value = sample.perspective;
    elements.counterparty.value = sample.counterparty || "the other party";
    elements.contractText.value = sample.text;
    updateWordCount();
    runAnalysis();
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

elements.contractText.addEventListener("input", updateWordCount);
elements.severityFilter.addEventListener("change", () => latestReport && renderFindings(latestReport.findings));
elements.domainFilter.addEventListener("change", () => latestReport && renderFindings(latestReport.findings));
elements.riskyOnlyToggle.addEventListener("change", () => latestReport && renderClauses(latestReport.clauses));
elements.analyzeButton.addEventListener("click", runAnalysis);
elements.copyReportButton.addEventListener("click", copyReport);
elements.downloadButton.addEventListener("click", downloadReport);
elements.pdfButton.addEventListener("click", downloadPdfReport);
elements.printButton.addEventListener("click", () => window.print());
elements.compareLatestButton.addEventListener("click", compareLatestVersions);
elements.loginButton.addEventListener("click", () => submitAuth("login"));
elements.registerButton.addEventListener("click", () => submitAuth("register"));

elements.fileInput.addEventListener("change", async (event) => {
  const files = [...event.target.files];
  if (!files.length) return;

  try {
    elements.caseName.value = files.length === 1 ? files[0].name.replace(/\.[^.]+$/, "") : `${files.length} document bundle`;
    elements.parseStatus.textContent = "Parsing document...";
    elements.contractText.value = await parseUploadedDocument(files);
    elements.parseStatus.textContent = "Document parsed";
    updateWordCount();
  } catch (error) {
    elements.parseStatus.textContent = "Parser fallback used";
    try {
      elements.contractText.value = (await Promise.all(files.map((file) => file.text()))).join("\n\n");
      updateWordCount();
    } catch (fallbackError) {
      showEmpty("This file could not be read. Paste extracted text into the document box.");
    }
  }
});

renderHistory();
checkApiHealth();
checkCurrentUser();
refreshServerHistory();
updateWordCount();

async function submitAuth(mode) {
  const payload = {
    name: elements.authName.value,
    email: elements.authEmail.value,
    password: elements.authPassword.value
  };
  const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    elements.authStatus.textContent = data.error || "Auth failed";
    return;
  }

  if (data.token) {
    authToken = data.token;
    localStorage.setItem("leashguards-token", authToken);
  }

  elements.authStatus.textContent = data.user ? data.user.email : "Registered";
  refreshServerHistory();
}

async function checkCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      headers: authHeaders(),
      credentials: "include"
    });
    const data = await response.json();
    elements.authStatus.textContent = data.user ? data.user.email : "Guest mode";
  } catch (error) {
    elements.authStatus.textContent = "Guest mode";
  }
}

async function runAnalysis() {
  const text = elements.contractText.value.trim();
  if (!text) {
    showEmpty("Paste or upload contract text before analysis.");
    return;
  }

  const request = {
    text,
    projectName: elements.projectName.value.trim() || "Default project",
    caseName: elements.caseName.value.trim() || "Untitled review",
    versionLabel: elements.versionLabel.value.trim() || "v1",
    contractType: elements.contractType.value,
    perspective: elements.perspective.value,
    counterparty: elements.counterparty.value.trim() || "the other party",
    jurisdiction: elements.jurisdiction.value,
    llmProvider: elements.llmProvider.value
  };

  elements.analyzeButton.disabled = true;
  elements.analyzeButton.textContent = "Analyzing...";

  try {
    latestReport = await analyzeWithServer(request);
  } catch (error) {
    latestReport = analyzeContract(text, request);
    latestReport.caseName = request.caseName;
    latestReport.sourcePreview = text.slice(0, 280);
    latestReport.mode = "browser-fallback";
  } finally {
    elements.analyzeButton.disabled = false;
    elements.analyzeButton.textContent = "Run Intelligence Review";
  }

  saveHistory(latestReport);
  renderReport(latestReport);
}

async function analyzeWithServer(payload) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "Analysis request failed.");
  }

  const data = await response.json();
  return { ...data.report, mode: "server" };
}

async function checkApiHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("API unavailable");
    elements.apiStatus.textContent = "API online";
    elements.apiStatus.className = "api-status online";
  } catch (error) {
    elements.apiStatus.textContent = "Browser mode";
    elements.apiStatus.className = "api-status offline";
  }
}

function renderReport(report) {
  elements.emptyState.classList.add("hidden");
  elements.report.classList.remove("hidden");
  setActionsEnabled(true);

  elements.reportTitle.textContent = `${report.caseName} - ${report.level} Risk`;
  elements.riskScore.textContent = report.score;
  elements.riskLevel.textContent = `${report.level} risk`;
  elements.findingCount.textContent = report.findings.length;
  elements.severeCount.textContent = report.findings.filter((finding) => ["critical", "high"].includes(finding.severity)).length;
  elements.riskDensity.textContent = `${report.documentStats.riskDensity}%`;
  elements.summaryText.textContent = report.summary;

  renderSeverityBars(report.severitySummary || { critical: 0, high: 0, medium: 0, low: 0 });
  renderReadiness(report.readiness || []);
  renderDomains(report.domainSummary || []);
  renderSafeguards(report.missingSafeguards || []);
  renderWarnings(report.analysisWarnings || []);
  renderContradictions(report.contradictions || []);
  renderFilters(report.domainSummary || []);
  renderFindings(report.findings || []);
  renderClauses(report.clauses || []);
  renderBenchmarks(report.benchmarkResults || []);
  renderScenarios(report.scenarios || []);
  renderRecommendations(report.recommendations || []);
  renderObligations(report.obligations || []);
  renderAiInsights(report.aiInsights);
  renderJurisdictionNotes(report.jurisdictionNotes);
  renderHistory();
}

async function parseUploadedDocument(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("document", file));
  formData.append("ocrLanguage", elements.ocrLanguage.value);

  const response = await fetch("/api/parse-document", {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: formData
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "Document parsing failed.");
  }

  const parsed = await response.json();
  const warnings = parsed.warnings?.length ? ` (${parsed.warnings.join(" ")})` : "";
  elements.parseStatus.textContent = `${parsed.metadata.parser} parser complete${warnings}`;
  return parsed.text || "";
}

function renderSeverityBars(summary) {
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0) || 1;
  elements.severityBars.innerHTML = "";

  ["critical", "high", "medium", "low"].forEach((severity) => {
    const row = document.createElement("div");
    row.className = "severity-row";
    row.innerHTML = `
      <span>${capitalize(severity)}</span>
      <div class="bar-track"><div class="bar-fill ${severity}" style="width:${(summary[severity] / total) * 100}%"></div></div>
      <strong>${summary[severity]}</strong>
    `;
    elements.severityBars.append(row);
  });
}

function renderReadiness(items) {
  elements.readinessList.innerHTML = items
    .map(
      (item) => `
        <article class="check-item ${item.status}">
          <strong>${item.label}</strong>
          <span>${item.detail}</span>
        </article>
      `
    )
    .join("");
}

function renderDomains(domains) {
  if (!domains.length) {
    elements.domainList.innerHTML = `<p class="muted">No risk domains were flagged by the current analyzer.</p>`;
    return;
  }

  elements.domainList.innerHTML = domains
    .map(
      (domain) => `
        <article class="domain-item">
          <div>
            <strong>${domain.domain}</strong>
            <span>${domain.count} finding${domain.count === 1 ? "" : "s"}</span>
          </div>
          <span class="pill ${domain.maxSeverity}">${capitalize(domain.maxSeverity)}</span>
        </article>
      `
    )
    .join("");
}

function renderSafeguards(items) {
  if (!items.length) {
    elements.safeguardList.innerHTML = `<article class="compact-item"><strong>Safeguards detected</strong><span>No major missing safeguard from this profile.</span></article>`;
    return;
  }

  elements.safeguardList.innerHTML = items
    .map(
      (item) => `
        <article class="compact-item">
          <span class="pill ${item.severity}">${capitalize(item.severity)}</span>
          <strong>${item.label}</strong>
          <span>${item.reason}</span>
        </article>
      `
    )
    .join("");
}

function renderWarnings(items) {
  if (!items.length) {
    elements.warningList.innerHTML = `<article class="compact-item"><strong>No edge-case warnings.</strong><span>The document passed current local validation checks.</span></article>`;
    return;
  }

  elements.warningList.innerHTML = items
    .map((item) => `<article class="compact-item"><strong>Warning</strong><span>${item}</span></article>`)
    .join("");
}

function renderContradictions(items) {
  if (!items.length) {
    elements.contradictionList.innerHTML = `<article class="compact-item"><strong>No contradiction signals.</strong><span>No distant contradiction pattern was detected.</span></article>`;
    return;
  }

  elements.contradictionList.innerHTML = items
    .map((item) => `<article class="compact-item"><strong>${item.title}</strong><span>${item.detail}</span></article>`)
    .join("");
}

function renderFilters(domains) {
  const selected = elements.domainFilter.value;
  elements.domainFilter.innerHTML = `<option value="all">All domains</option>`;
  domains.forEach((domain) => {
    const option = document.createElement("option");
    option.value = domain.domain;
    option.textContent = domain.domain;
    elements.domainFilter.append(option);
  });
  elements.domainFilter.value = [...elements.domainFilter.options].some((option) => option.value === selected) ? selected : "all";
}

function renderFindings(findings) {
  const severity = elements.severityFilter.value;
  const domain = elements.domainFilter.value;
  const filtered = findings.filter((finding) => {
    const severityMatch = severity === "all" || finding.severity === severity;
    const domainMatch = domain === "all" || finding.domain === domain;
    return severityMatch && domainMatch;
  });

  if (!filtered.length) {
    elements.findingsList.innerHTML = `<article class="finding-card"><h3>No findings match the current filters.</h3><p class="muted">Try another severity or domain filter.</p></article>`;
    return;
  }

  elements.findingsList.innerHTML = filtered.map(renderFindingCard).join("");
}

function renderFindingCard(finding) {
  return `
    <article class="finding-card">
      <div class="finding-top">
        <div>
          <span class="pill ${finding.severity}">${capitalize(finding.severity)}</span>
          <h3>${finding.label}</h3>
          <p>${finding.domain} - Clause ${finding.clauseNumber}</p>
        </div>
        <span class="confidence">${Math.round(finding.confidence * 100)}% confidence</span>
      </div>
      <blockquote>${escapeHtml(finding.excerpt)}</blockquote>
      <dl>
        <div><dt>Why it matters</dt><dd>${finding.why}</dd></div>
        <div><dt>Possible impact</dt><dd>${finding.impact}</dd></div>
        <div><dt>Negotiation angle</dt><dd>${finding.recommendation}</dd></div>
      </dl>
    </article>
  `;
}

function renderClauses(clauses) {
  const filtered = elements.riskyOnlyToggle.checked ? clauses.filter((clause) => clause.hasRisk) : clauses;

  if (!filtered.length) {
    elements.clauseList.innerHTML = `<article class="clause-card"><strong>No clauses to show.</strong><p class="muted">Disable the flagged-only switch to see every extracted clause.</p></article>`;
    return;
  }

  elements.clauseList.innerHTML = filtered
    .map(
      (clause) => `
        <article class="clause-card ${clause.hasRisk ? "flagged" : ""}">
          <div class="clause-meta">
            <span>Clause ${clause.number}</span>
            <span class="pill ${clause.severity}">${capitalize(clause.severity)}</span>
          </div>
          <p>${escapeHtml(clause.text)}</p>
          <div class="tag-row">
            ${clause.domains.map((domain) => `<span>${domain}</span>`).join("") || "<span>No domain flag</span>"}
          </div>
        </article>
      `
    )
    .join("");
}

function renderBenchmarks(benchmarks) {
  elements.benchmarkList.innerHTML = benchmarks
    .map(
      (benchmark) => `
        <article class="benchmark-card ${benchmark.status}">
          <div>
            <span class="benchmark-score">${benchmark.score}/100</span>
            <h3>${benchmark.title}</h3>
            <p>${benchmark.expected}</p>
          </div>
          <div class="benchmark-grid">
            <div>
              <strong>Risk signals</strong>
              <span>${benchmark.riskyMatches.join(", ") || "None detected"}</span>
            </div>
            <div>
              <strong>Protective signals</strong>
              <span>${benchmark.saferMatches.join(", ") || "None detected"}</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderScenarios(scenarios) {
  if (!scenarios.length) {
    elements.scenarioList.innerHTML = `<article class="scenario-card"><strong>No major consequence scenario generated.</strong><p class="muted">The current analyzer did not detect enough risk signals for scenario simulation.</p></article>`;
    return;
  }

  elements.scenarioList.innerHTML = scenarios
    .map(
      (scenario) => `
        <article class="scenario-card">
          <span class="pill ${scenario.severity}">${capitalize(scenario.severity)}</span>
          <strong>${scenario.title}</strong>
          <p>${scenario.outcome}</p>
        </article>
      `
    )
    .join("");
}

function renderRecommendations(recommendations) {
  if (!recommendations.length) {
    elements.recommendations.innerHTML = `<p class="muted">No negotiation recommendations were generated for this text.</p>`;
    return;
  }

  elements.recommendations.innerHTML = recommendations
    .map(
      (item) => `
        <article class="recommendation">
          <span class="pill ${item.severity}">${capitalize(item.severity)}</span>
          <div>
            <strong>${item.domain}</strong>
            <p>${item.text}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderObligations(obligations) {
  if (!obligations.length) {
    elements.obligationList.innerHTML = `<article class="compact-item"><strong>No explicit obligations detected.</strong><span>Try reviewing a longer contract section.</span></article>`;
    return;
  }

  elements.obligationList.innerHTML = obligations
    .map(
      (item) => `
        <article class="obligation-card">
          <span class="pill ${item.severity}">${capitalize(item.severity)}</span>
          <div>
            <strong>${capitalize(item.actor)} - Clause ${item.clauseNumber}</strong>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAiInsights(insights) {
  if (!insights) {
    elements.aiInsightList.innerHTML = `<article class="compact-item"><strong>No AI reasoning result.</strong><span>Run analysis again to generate reasoning output.</span></article>`;
    return;
  }

  const blocks = [
    ["Provider", insights.provider || "offline"],
    ["Summary", insights.plainLanguageSummary || "No summary returned."],
    ["Contradictions", insights.contradictions?.join(" ") || "No contradiction signals found."],
    ["Deeper risks", insights.deeperRisks?.join(" ") || "No deeper risks returned."],
    ["Negotiation script", insights.negotiationScript?.join(" ") || "No script returned."],
    ["Questions for counsel", insights.attorneyQuestions?.join(" ") || "No questions returned."]
  ];

  elements.aiInsightList.innerHTML = blocks
    .map(([title, text]) => `<article class="compact-item"><strong>${title}</strong><span>${text}</span></article>`)
    .join("");
}

function renderJurisdictionNotes(notes = []) {
  if (!notes.length) {
    elements.jurisdictionList.innerHTML = `<article class="compact-item"><strong>No jurisdiction note.</strong><span>Select a jurisdiction for more targeted review prompts.</span></article>`;
    return;
  }

  elements.jurisdictionList.innerHTML = notes
    .map((note) => `<article class="compact-item"><strong>Review note</strong><span>${note}</span></article>`)
    .join("");
}

function renderHistory() {
  if (!history.length) {
    elements.historyList.innerHTML = `<article class="history-card"><strong>No saved reviews yet.</strong><span>Completed reviews appear here during this browser session.</span></article>`;
    return;
  }

  elements.historyList.innerHTML = history
    .map(
      (item, index) => `
        <article class="history-card">
          <div>
            <strong>${item.caseName}</strong>
            <span>${new Date(item.generatedAt).toLocaleString()} - ${item.level} - ${item.score}/100</span>
          </div>
          <button data-history-index="${index}">Load</button>
        </article>
      `
    )
    .join("");

  elements.historyList.querySelectorAll("[data-history-index]").forEach((button) => {
    button.addEventListener("click", () => {
      latestReport = history[Number(button.dataset.historyIndex)];
      renderReport(latestReport);
      activateTab("overview");
    });
  });
}

async function refreshServerHistory() {
  try {
    const response = await fetch("/api/reports", {
      headers: authHeaders(),
      credentials: "include"
    });
    if (!response.ok) return;

    const data = await response.json();
    if (!Array.isArray(data.reports)) return;

    history = mergeHistory(data.reports, history).slice(0, 25);
    localStorage.setItem("leashguards-history", JSON.stringify(history));
    renderHistory();
  } catch (error) {
    renderHistory();
  }
}

async function copyReport() {
  if (!latestReport) return;
  await navigator.clipboard.writeText(formatReport(latestReport));
  flashButton(elements.copyReportButton, "Copied");
}

function downloadReport() {
  if (!latestReport) return;
  const blob = new Blob([formatReport(latestReport)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(latestReport.caseName)}-leashguards-report.txt`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadPdfReport() {
  if (!latestReport) return;

  const response = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ report: latestReport })
  });

  if (!response.ok) return;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(latestReport.caseName)}-leashguards-report.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function compareLatestVersions() {
  const [revised, base] = history.filter((item) => item.projectName === (latestReport?.projectName || elements.projectName.value)).slice(0, 2);

  if (!base || !revised) {
    elements.comparisonList.innerHTML = `<article class="compact-item"><strong>Need two versions.</strong><span>Analyze at least two reports under the same project to compare versions.</span></article>`;
    return;
  }

  const response = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ baseReport: base, revisedReport: revised })
  });

  if (!response.ok) return;
  const data = await response.json();
  const comparison = data.comparison;
  elements.comparisonList.innerHTML = `
    <article class="compact-item">
      <strong>Score delta: ${comparison.scoreDelta >= 0 ? "+" : ""}${comparison.scoreDelta}</strong>
      <span>${comparison.base.caseName} to ${comparison.revised.caseName}</span>
    </article>
    <article class="compact-item"><strong>Added risks</strong><span>${comparison.added.map((item) => item.label).join(", ") || "None"}</span></article>
    <article class="compact-item"><strong>Removed risks</strong><span>${comparison.removed.map((item) => item.label).join(", ") || "None"}</span></article>
    <article class="compact-item"><strong>Persistent risks</strong><span>${comparison.persistent.map((item) => item.label).join(", ") || "None"}</span></article>
  `;
}

function saveHistory(report) {
  const snapshot = JSON.parse(JSON.stringify(report));
  history = [snapshot, ...history.filter((item) => item.caseName !== report.caseName)].slice(0, 25);
  localStorage.setItem("leashguards-history", JSON.stringify(history));
}

function mergeHistory(primary, secondary) {
  const seen = new Set();
  return [...primary, ...secondary].filter((item) => {
    const key = `${item.caseName}:${item.generatedAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadHistory() {
  try {
    return (JSON.parse(localStorage.getItem("leashguards-history")) || []).filter((item) => item && item.documentStats && item.benchmarkResults);
  } catch (error) {
    return [];
  }
}

function activateTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${name}`));
}

function updateWordCount() {
  const words = (elements.contractText.value.match(/\b[\w'-]+\b/g) || []).length;
  elements.wordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;
}

function showEmpty(message) {
  elements.emptyState.classList.remove("hidden");
  elements.report.classList.add("hidden");
  setActionsEnabled(false);
  elements.reportTitle.textContent = "Ready for review";
  elements.emptyState.querySelector("h3").textContent = message;
}

function setActionsEnabled(enabled) {
  elements.copyReportButton.disabled = !enabled;
  elements.downloadButton.disabled = !enabled;
  elements.pdfButton.disabled = !enabled;
  elements.printButton.disabled = !enabled;
}

function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function capitalize(value = "") {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "contract";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
