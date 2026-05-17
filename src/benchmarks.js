export const benchmarkProfiles = {
  employment: [
    {
      id: "employment-non-compete-limit",
      title: "Narrow post-employment restrictions",
      domain: "Employment restrictions",
      expected: "Post-employment limits should be narrow in duration, geography, role, and protected interest.",
      riskySignals: ["non-compete", "restricted period", "competitor", "solicit"],
      saferSignals: ["reasonable duration", "limited geography", "existing clients excluded", "lawful employment"]
    },
    {
      id: "employment-ip-carveout",
      title: "Pre-existing IP carve-out",
      domain: "Intellectual property",
      expected: "Employee-owned prior inventions and general skills should be excluded from assignment.",
      riskySignals: ["all intellectual property", "pre-existing", "whether during working hours", "all inventions"],
      saferSignals: ["prior inventions", "background technology", "excluded materials", "general skills"]
    },
    {
      id: "employment-dispute-access",
      title: "Accessible dispute process",
      domain: "Dispute resolution",
      expected: "Disputes should preserve reasonable access to statutory rights and local remedies.",
      riskySignals: ["binding arbitration", "class action waiver", "jury trial"],
      saferSignals: ["small claims", "statutory rights", "local venue", "mutual arbitration"]
    }
  ],
  freelance: [
    {
      id: "freelance-ip-scope",
      title: "Deliverable-specific IP transfer",
      domain: "Intellectual property",
      expected: "Ownership transfer should cover accepted deliverables, not reusable tools or background methods.",
      riskySignals: ["all rights", "work made for hire", "tools", "templates", "all intellectual property"],
      saferSignals: ["accepted deliverables", "background IP", "portfolio", "license"]
    },
    {
      id: "freelance-payment-acceptance",
      title: "Objective acceptance and payment",
      domain: "Financial obligations",
      expected: "Payment should use objective milestones, review windows, and cure opportunities.",
      riskySignals: ["sole discretion", "forfeiture", "accepted by client", "without liability"],
      saferSignals: ["milestone", "acceptance criteria", "cure period", "kill fee"]
    }
  ],
  subscription: [
    {
      id: "subscription-renewal-notice",
      title: "Clear renewal and cancellation path",
      domain: "Termination and renewal",
      expected: "Renewals should include prominent notice, simple cancellation, and reasonable refund treatment.",
      riskySignals: ["automatically renews", "sixty days", "non-refundable", "early termination fee"],
      saferSignals: ["renewal reminder", "cancel online", "prorated refund", "month-to-month"]
    },
    {
      id: "subscription-change-control",
      title: "Material change notice",
      domain: "Ambiguity and unilateral control",
      expected: "Material changes should require notice and a right to reject or terminate.",
      riskySignals: ["modify", "at any time", "without notice", "continued use"],
      saferSignals: ["advance notice", "material change", "opt out", "terminate"]
    }
  ],
  privacy: [
    {
      id: "privacy-purpose-limits",
      title: "Purpose-limited data use",
      domain: "Privacy and data protection",
      expected: "Collection and sharing should be limited to clear, necessary purposes.",
      riskySignals: ["any purpose", "advertising partners", "precise location", "sensitive"],
      saferSignals: ["specific purpose", "consent", "opt out", "data minimization"]
    },
    {
      id: "privacy-retention-delete",
      title: "Retention and deletion rights",
      domain: "Privacy and data protection",
      expected: "Retention windows and deletion rights should be clear.",
      riskySignals: ["indefinitely", "as long as necessary", "perpetual"],
      saferSignals: ["delete", "retention period", "account closure", "request deletion"]
    }
  ],
  vendor: [
    {
      id: "vendor-security",
      title: "Specific security and breach commitments",
      domain: "Compliance and governance",
      expected: "Vendor agreements should define controls, incident notice, audit support, and data protection duties.",
      riskySignals: ["commercially reasonable security", "not responsible for unauthorized access", "customer is solely responsible"],
      saferSignals: ["breach notice", "security controls", "audit report", "SOC 2", "ISO 27001"]
    },
    {
      id: "vendor-sla-remedies",
      title: "Service levels and meaningful remedies",
      domain: "Liability and indemnity",
      expected: "Critical services should include measurable availability, support duties, credits, and termination rights.",
      riskySignals: ["as is", "without warranties", "not liable", "sole remedy"],
      saferSignals: ["service level", "uptime", "service credit", "termination for service failure"]
    }
  ],
  rental: [
    {
      id: "rental-deposit",
      title: "Fair deposit handling",
      domain: "Financial obligations",
      expected: "Deposit deductions should be itemized, evidence-based, and returned within a defined timeline.",
      riskySignals: ["deposit is non-refundable", "forfeit", "sole discretion", "deduct"],
      saferSignals: ["itemized", "return within", "normal wear", "evidence"]
    },
    {
      id: "rental-entry",
      title: "Reasonable entry and possession rights",
      domain: "Ambiguity and unilateral control",
      expected: "Entry, inspection, and termination rights should require notice and objective grounds.",
      riskySignals: ["inspect premises", "without notice", "terminate at any time"],
      saferSignals: ["reasonable notice", "emergency", "business hours", "written notice"]
    }
  ],
  insurance: [
    {
      id: "insurance-exclusions",
      title: "Clear coverage exclusions",
      domain: "Financial obligations",
      expected: "Policies should make exclusions, claim deadlines, appeal rights, and coverage triggers understandable.",
      riskySignals: ["not covered", "exclusions include", "coverage does not apply", "pre-existing condition"],
      saferSignals: ["appeal", "claim review", "coverage summary", "plain language"]
    }
  ],
  nda: [
    {
      id: "nda-residuals",
      title: "Confidentiality scope and residuals",
      domain: "Intellectual property",
      expected: "NDAs should limit confidential information, exclude public/prior knowledge, and define residual knowledge carefully.",
      riskySignals: ["all information", "perpetual", "residual", "without limitation"],
      saferSignals: ["publicly known", "independently developed", "written notice", "return or destroy"]
    }
  ],
  loan: [
    {
      id: "loan-fees-default",
      title: "Transparent default and fee terms",
      domain: "Financial obligations",
      expected: "Finance agreements should make default triggers, fees, acceleration, and cure rights explicit.",
      riskySignals: ["default interest", "accelerate", "late fee", "immediately due"],
      saferSignals: ["grace period", "cure period", "fee cap", "notice of default"]
    }
  ],
  purchase: [
    {
      id: "purchase-warranty-remedy",
      title: "Warranty and remedy clarity",
      domain: "Liability and indemnity",
      expected: "Purchase terms should clearly state inspection rights, warranties, rejection rights, and remedies.",
      riskySignals: ["as is", "no warranty", "sole remedy", "non-refundable"],
      saferSignals: ["inspection", "return", "repair", "replacement", "refund"]
    }
  ],
  partnership: [
    {
      id: "partnership-control-exit",
      title: "Governance and exit rights",
      domain: "Ambiguity and unilateral control",
      expected: "Partnership terms should define voting, deadlock, transfer, dissolution, and buyout rights.",
      riskySignals: ["sole discretion", "without consent", "unlimited authority", "forfeit"],
      saferSignals: ["deadlock", "buyout", "voting", "reserved matters", "dissolution"]
    }
  ],
  general: [
    {
      id: "general-mutuality",
      title: "Mutual remedies and obligations",
      domain: "Liability and indemnity",
      expected: "Risk allocation should be mutual, proportionate, and tied to controllable conduct.",
      riskySignals: ["indemnify", "hold harmless", "without liability", "sole discretion"],
      saferSignals: ["mutual", "direct damages", "proportionate", "gross negligence"]
    }
  ]
};

export const requiredSafeguards = {
  employment: [
    { label: "Pre-existing IP carve-out", signals: ["prior inventions", "pre-existing intellectual property", "background IP"] },
    { label: "Reasonable notice or severance", signals: ["notice period", "severance", "garden leave"] },
    { label: "Local or accessible dispute venue", signals: ["local venue", "small claims", "statutory rights"] }
  ],
  freelance: [
    { label: "Payment for completed work", signals: ["payment for completed work", "kill fee", "milestone payment"] },
    { label: "Portfolio or background IP rights", signals: ["portfolio", "background IP", "reusable tools"] },
    { label: "Objective acceptance criteria", signals: ["acceptance criteria", "review period", "deemed accepted"] }
  ],
  subscription: [
    { label: "Renewal reminder", signals: ["renewal reminder", "notice before renewal", "advance notice"] },
    { label: "Simple cancellation", signals: ["cancel online", "self-service cancellation", "cancel anytime"] },
    { label: "Refund or service failure right", signals: ["prorated refund", "service failure", "refund"] }
  ],
  privacy: [
    { label: "Deletion rights", signals: ["delete", "deletion", "erase"] },
    { label: "Opt-out controls", signals: ["opt out", "withdraw consent", "privacy choices"] },
    { label: "Purpose limitation", signals: ["specific purpose", "limited purpose", "data minimization"] }
  ],
  vendor: [
    { label: "Breach notice timeline", signals: ["breach notice", "security incident", "incident notice"] },
    { label: "Audit or compliance evidence", signals: ["SOC 2", "ISO 27001", "audit report"] },
    { label: "Service level remedy", signals: ["service credit", "uptime", "service level"] }
  ],
  rental: [
    { label: "Deposit return deadline", signals: ["return deposit", "within", "itemized"] },
    { label: "Notice before entry", signals: ["reasonable notice", "written notice", "emergency"] },
    { label: "Habitability or repair duty", signals: ["repair", "habitability", "maintenance"] }
  ],
  insurance: [
    { label: "Appeal rights", signals: ["appeal", "review", "reconsideration"] },
    { label: "Claim deadline clarity", signals: ["claim deadline", "notice of claim", "proof of loss"] },
    { label: "Plain-language exclusions", signals: ["coverage summary", "exclusion schedule", "plain language"] }
  ],
  nda: [
    { label: "Public knowledge carve-out", signals: ["publicly known", "public domain", "independently developed"] },
    { label: "Return or destroy procedure", signals: ["return or destroy", "certify destruction", "upon request"] },
    { label: "Limited confidentiality term", signals: ["for a period", "survive for", "years"] }
  ],
  loan: [
    { label: "Default cure period", signals: ["cure period", "grace period", "notice of default"] },
    { label: "Fee cap", signals: ["fee cap", "maximum fee", "not exceed"] },
    { label: "Prepayment right", signals: ["prepay", "prepayment", "without penalty"] }
  ],
  purchase: [
    { label: "Inspection rights", signals: ["inspection", "reject", "acceptance period"] },
    { label: "Refund or replacement remedy", signals: ["refund", "replacement", "repair"] },
    { label: "Delivery risk allocation", signals: ["delivery", "risk of loss", "title passes"] }
  ],
  partnership: [
    { label: "Deadlock process", signals: ["deadlock", "mediation", "tie-break"] },
    { label: "Buyout rights", signals: ["buyout", "valuation", "purchase option"] },
    { label: "Reserved matters", signals: ["reserved matters", "unanimous consent", "approval"] }
  ],
  general: [
    { label: "Mutual obligations", signals: ["mutual", "both parties", "reciprocal"] },
    { label: "Notice and cure period", signals: ["notice", "cure period", "opportunity to cure"] },
    { label: "Liability cap exceptions", signals: ["gross negligence", "willful misconduct", "confidentiality breach"] }
  ]
};
