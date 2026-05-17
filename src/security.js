import { createHash } from "node:crypto";

const piiPatterns = [
  { name: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[redacted-email]" },
  { name: "phone", pattern: /\+?\d[\d\s().-]{7,}\d/g, replacement: "[redacted-phone]" },
  { name: "long-number", pattern: /\b\d{10,}\b/g, replacement: "[redacted-number]" },
  { name: "tax-id", pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/gi, replacement: "[redacted-id]" }
];

export function redactSensitiveText(value) {
  let text = String(value || "");
  piiPatterns.forEach((item) => {
    text = text.replace(item.pattern, item.replacement);
  });
  return text;
}

export function redactReport(report) {
  const clone = JSON.parse(JSON.stringify(report));
  clone.sourcePreview = redactSensitiveText(clone.sourcePreview);
  clone.summary = redactSensitiveText(clone.summary);
  clone.clauses = (clone.clauses || []).map((clause) => ({
    ...clause,
    text: redactSensitiveText(clause.text)
  }));
  clone.findings = (clone.findings || []).map((finding) => ({
    ...finding,
    excerpt: redactSensitiveText(finding.excerpt),
    impact: redactSensitiveText(finding.impact)
  }));
  clone.obligations = (clone.obligations || []).map((item) => ({
    ...item,
    text: redactSensitiveText(item.text)
  }));
  return clone;
}

export function documentFingerprint(text) {
  return createHash("sha256").update(String(text || "")).digest("hex");
}

export function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
  const buckets = new Map();

  return function rateLimit(request, response) {
    const ip = request.socket.remoteAddress || "unknown";
    const key = `${ip}:${request.url?.split("?")[0] || "/"}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    response.setHeader("X-RateLimit-Limit", String(max));
    response.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));

    return bucket.count <= max;
  };
}

