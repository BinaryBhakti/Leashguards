import PDFDocument from "pdfkit";

export function createProfessionalPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, report);
    addSummary(doc, report);
    addFindings(doc, report);
    addSafeguards(doc, report);
    addScenarios(doc, report);
    addAiInsights(doc, report);
    addDisclaimer(doc);
    doc.end();
  });
}

function addHeader(doc, report) {
  doc.fillColor("#093d35").fontSize(24).text("Leashguards Risk Intelligence Report");
  doc.moveDown(0.4);
  doc.fillColor("#17211d").fontSize(12).text(report.caseName || "Untitled review");
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  doc.text(`Agreement: ${report.context.contractType} | Perspective: ${report.context.perspective} | Jurisdiction: ${report.context.jurisdiction || "Not specified"}`);
  doc.moveDown();
  doc.fontSize(18).fillColor("#b72d2d").text(`${report.level} Risk - ${report.score}/100`);
  doc.moveDown();
}

function addSummary(doc, report) {
  section(doc, "Executive Summary");
  paragraph(doc, report.summary);
}

function addFindings(doc, report) {
  section(doc, "Priority Findings");
  if (!report.findings.length) {
    paragraph(doc, "No major risk patterns were detected by the current analyzer.");
    return;
  }

  report.findings.slice(0, 10).forEach((finding, index) => {
    doc.fillColor("#17211d").fontSize(11).text(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.label}`, { continued: false });
    paragraph(doc, `Domain: ${finding.domain}`);
    paragraph(doc, `Impact: ${finding.impact}`);
    paragraph(doc, `Recommendation: ${finding.recommendation}`);
    doc.moveDown(0.3);
  });
}

function addSafeguards(doc, report) {
  section(doc, "Missing Safeguards");
  if (!report.missingSafeguards.length) {
    paragraph(doc, "No major missing safeguard was detected for this agreement profile.");
    return;
  }

  report.missingSafeguards.forEach((item) => paragraph(doc, `${item.label}: ${item.recommendation}`));
}

function addScenarios(doc, report) {
  section(doc, "Scenario Consequences");
  report.scenarios.forEach((scenario) => paragraph(doc, `${scenario.title}: ${scenario.outcome}`));
}

function addAiInsights(doc, report) {
  if (!report.aiInsights) return;

  section(doc, "AI Reasoning Layer");
  paragraph(doc, `Provider: ${report.aiInsights.provider}`);
  paragraph(doc, report.aiInsights.plainLanguageSummary || "");

  if (report.aiInsights.contradictions?.length) {
    doc.fontSize(11).fillColor("#093d35").text("Potential contradictions");
    report.aiInsights.contradictions.forEach((item) => paragraph(doc, item));
  }

  if (report.aiInsights.attorneyQuestions?.length) {
    doc.fontSize(11).fillColor("#093d35").text("Questions for counsel");
    report.aiInsights.attorneyQuestions.forEach((item) => paragraph(doc, item));
  }
}

function addDisclaimer(doc) {
  section(doc, "Disclaimer");
  paragraph(doc, "Leashguards provides legal awareness and contract intelligence. It does not replace a qualified legal professional and does not provide legally binding advice.");
}

function section(doc, title) {
  doc.moveDown(0.7);
  doc.fillColor("#093d35").fontSize(15).text(title);
  doc.moveDown(0.25);
}

function paragraph(doc, text) {
  if (!text) return;
  doc.fillColor("#34403b").fontSize(10).text(text, { lineGap: 2 });
  doc.moveDown(0.2);
}

