export function formatReport(report) {
  const lines = [
    "Leashguards Risk Intelligence Report",
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    `Agreement: ${report.context.contractType}`,
    `Perspective: ${report.context.perspective}`,
    `Jurisdiction: ${report.context.jurisdiction || "Not specified"}`,
    `Project: ${report.projectName || report.context.projectName || "General project"}`,
    `Version: ${report.versionLabel || report.context.versionLabel || "v1"}`,
    `Overall risk: ${report.level} (${report.score}/100)`,
    `Clauses analyzed: ${report.clausesAnalyzed}`,
    "",
    "Executive summary",
    report.summary,
    "",
    "Priority findings"
  ];

  if (!report.findings.length) {
    lines.push("No major risk patterns detected by the current analyzer.");
  } else {
    report.findings.forEach((finding, index) => {
      lines.push(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.label}`);
      lines.push(`   Domain: ${finding.domain}`);
      lines.push(`   Excerpt: ${finding.excerpt}`);
      lines.push(`   Impact: ${finding.impact}`);
      lines.push(`   Recommendation: ${finding.recommendation}`);
    });
  }

  lines.push("", "Missing safeguards");
  report.missingSafeguards.forEach((item) => {
    lines.push(`- ${item.label}: ${item.reason}`);
  });

  lines.push("", "Scenario consequences");
  report.scenarios.forEach((scenario) => {
    lines.push(`- ${scenario.title}: ${scenario.outcome}`);
  });

  lines.push("", "Jurisdiction notes");
  (report.jurisdictionNotes || []).forEach((note) => {
    lines.push(`- ${note}`);
  });

  if (report.aiInsights) {
    lines.push("", "AI reasoning layer");
    lines.push(`Provider: ${report.aiInsights.provider}`);
    lines.push(report.aiInsights.plainLanguageSummary || "");
    (report.aiInsights.contradictions || []).forEach((item) => lines.push(`- Potential contradiction: ${item}`));
    (report.aiInsights.attorneyQuestions || []).forEach((item) => lines.push(`- Counsel question: ${item}`));
  }

  lines.push("", "Negotiation moves");
  report.recommendations.forEach((item) => {
    lines.push(`- ${item.text}`);
  });

  lines.push("", "Disclaimer");
  lines.push("This report is for legal awareness only and is not legal advice.");

  return lines.join("\n");
}
