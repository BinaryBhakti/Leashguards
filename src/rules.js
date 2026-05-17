export const severityWeights = {
  low: 1,
  medium: 2,
  high: 4,
  critical: 6
};

export const riskRules = [
  {
    id: "non-compete",
    domain: "Employment restrictions",
    label: "Restrictive non-compete",
    severity: "high",
    confidence: 0.88,
    patterns: [/non[-\s]?compete/i, /not\s+work\s+for\s+(a\s+)?competitor/i, /restricted\s+period/i],
    why: "This can limit where the affected party may work or do business after the relationship ends.",
    impact: "The user could lose job mobility, client access, or bargaining power for months or years.",
    recommendation: "Request a narrower scope, shorter duration, smaller geography, and carve-outs for existing clients or roles."
  },
  {
    id: "non-solicit",
    domain: "Employment restrictions",
    label: "Broad non-solicitation",
    severity: "medium",
    confidence: 0.82,
    patterns: [/non[-\s]?solicit/i, /solicit\s+(any\s+)?(employee|client|customer)/i],
    why: "Non-solicitation terms can block ordinary professional relationships after the contract ends.",
    impact: "The user may be unable to contact former clients, colleagues, or business leads even when contact is unrelated.",
    recommendation: "Ask for a definition of restricted contacts and limit the restriction to relationships created during the engagement."
  },
  {
    id: "ip-assignment",
    domain: "Intellectual property",
    label: "Broad intellectual property transfer",
    severity: "critical",
    confidence: 0.9,
    patterns: [/assigns?\s+all\s+(right|rights|title|interest)/i, /work\s+made\s+for\s+hire/i, /all\s+intellectual\s+property/i, /including\s+pre[-\s]?existing/i],
    why: "Broad IP language may transfer ownership of work, inventions, methods, or pre-existing materials.",
    impact: "The affected party could lose ownership of portfolio work, reusable tools, inventions, or background know-how.",
    recommendation: "Carve out pre-existing IP, reusable tools, general skills, and materials not specifically created for the contract."
  },
  {
    id: "unilateral-change",
    domain: "Ambiguity and unilateral control",
    label: "Unilateral modification right",
    severity: "high",
    confidence: 0.86,
    patterns: [/may\s+(modify|change|amend|update)\s+.*(at\s+any\s+time|without\s+notice)/i, /sole\s+discretion/i],
    why: "One party can change important terms without meaningful consent.",
    impact: "Fees, obligations, privacy terms, or service rights may shift after acceptance.",
    recommendation: "Require advance notice, a clear opt-out or termination right, and written consent for material changes."
  },
  {
    id: "auto-renewal",
    domain: "Termination and renewal",
    label: "Automatic renewal",
    severity: "medium",
    confidence: 0.84,
    patterns: [/automatically\s+renew/i, /auto[-\s]?renew/i, /renewal\s+term/i, /unless\s+.*notice\s+.*(30|60|90)\s+days/i],
    why: "Automatic renewal can lock the user into another term unless cancellation happens within a specific window.",
    impact: "The user may owe additional fees even if they stop using the service.",
    recommendation: "Ask for renewal reminders, month-to-month renewal, and cancellation rights until the renewal date."
  },
  {
    id: "cancellation-penalty",
    domain: "Financial obligations",
    label: "Cancellation penalty or early termination fee",
    severity: "high",
    confidence: 0.88,
    patterns: [/early\s+termination\s+fee/i, /cancellation\s+(fee|penalty)/i, /liquidated\s+damages/i, /non[-\s]?refundable/i],
    why: "Penalty language can create unexpected cost for leaving the agreement.",
    impact: "The user may have to pay even when the service is poor, unused, or no longer needed.",
    recommendation: "Cap fees, add cure periods, and allow termination without penalty for service failures or material changes."
  },
  {
    id: "indemnity",
    domain: "Liability and indemnity",
    label: "Broad indemnity obligation",
    severity: "critical",
    confidence: 0.91,
    patterns: [/indemnif(y|ication|ies)/i, /hold\s+harmless/i, /defend\s+.*against\s+all\s+claims/i],
    why: "Indemnity can make the user responsible for another party's losses, claims, legal fees, or third-party disputes.",
    impact: "The user could face costs larger than the contract value, including legal defense expenses.",
    recommendation: "Limit indemnity to direct breaches, proven misconduct, and amounts proportionate to the contract value."
  },
  {
    id: "liability-cap",
    domain: "Liability and indemnity",
    label: "One-sided liability limitation",
    severity: "high",
    confidence: 0.8,
    patterns: [/limitation\s+of\s+liability/i, /not\s+liable\s+for\s+(any\s+)?(indirect|incidental|consequential)/i, /liability\s+.*shall\s+not\s+exceed/i],
    why: "Liability caps and exclusions can remove remedies when harm occurs.",
    impact: "The user may have limited recovery even for serious business interruption, data loss, or financial damage.",
    recommendation: "Ask for mutual caps and exceptions for confidentiality, data misuse, IP infringement, gross negligence, and unpaid fees."
  },
  {
    id: "arbitration",
    domain: "Dispute resolution",
    label: "Mandatory arbitration or class action waiver",
    severity: "high",
    confidence: 0.87,
    patterns: [/binding\s+arbitration/i, /mandatory\s+arbitration/i, /class\s+action\s+waiver/i, /waive\s+.*jury\s+trial/i],
    why: "Dispute terms can limit court access, collective claims, and procedural rights.",
    impact: "The user may have to pursue claims individually in a private forum with limited appeal options.",
    recommendation: "Request small-claims carve-outs, local venue, mutual procedures, and removal of class action waivers where appropriate."
  },
  {
    id: "venue",
    domain: "Dispute resolution",
    label: "Distant or one-sided venue",
    severity: "medium",
    confidence: 0.78,
    patterns: [/exclusive\s+jurisdiction/i, /governed\s+by\s+the\s+laws\s+of/i, /venue\s+shall\s+be/i],
    why: "Forum and governing law terms can make disputes expensive or inconvenient.",
    impact: "The user may need to travel or hire local counsel in a distant location.",
    recommendation: "Seek a neutral or local venue and clarify whether consumer or employment protections still apply."
  },
  {
    id: "data-sharing",
    domain: "Privacy and data protection",
    label: "Broad data collection or sharing",
    severity: "high",
    confidence: 0.86,
    patterns: [/collect\s+.*(personal|sensitive|biometric|location)/i, /share\s+.*(third[-\s]?part(y|ies)|partners|affiliates)/i, /sell\s+.*personal\s+information/i],
    why: "Broad data rights can expose sensitive information beyond the expected transaction.",
    impact: "The user may lose control over personal data, location history, usage behavior, or sensitive identifiers.",
    recommendation: "Ask for purpose limits, opt-outs, retention limits, and a list of third-party recipients."
  },
  {
    id: "data-retention",
    domain: "Privacy and data protection",
    label: "Indefinite data retention",
    severity: "medium",
    confidence: 0.8,
    patterns: [/retain\s+.*(indefinitely|as\s+long\s+as\s+necessary)/i, /for\s+any\s+purpose/i, /perpetual\s+license\s+.*data/i],
    why: "Vague retention language can keep user data longer than needed.",
    impact: "Old information may remain exposed to future breaches, analytics, or secondary use.",
    recommendation: "Request fixed retention windows, deletion rights, and purpose-specific retention limits."
  },
  {
    id: "termination-for-convenience",
    domain: "Termination and renewal",
    label: "One-sided termination right",
    severity: "medium",
    confidence: 0.78,
    patterns: [/terminate\s+.*(at\s+any\s+time|for\s+convenience)/i, /without\s+cause/i, /without\s+liability/i],
    why: "One-sided termination rights can leave the affected party without continuity or compensation.",
    impact: "The user may lose income, access, housing, or services with limited warning.",
    recommendation: "Request mutual termination rights, notice periods, transition support, and payment for completed work."
  },
  {
    id: "payment-risk",
    domain: "Financial obligations",
    label: "Unfavorable payment or fee terms",
    severity: "medium",
    confidence: 0.76,
    patterns: [/late\s+fee/i, /interest\s+.*per\s+month/i, /payment\s+is\s+due\s+immediately/i, /fees\s+may\s+increase/i],
    why: "Payment terms may create hidden or escalating financial exposure.",
    impact: "The user could face compounding fees, surprise increases, or cash-flow pressure.",
    recommendation: "Ask for fee caps, notice before increases, grace periods, and clear invoicing requirements."
  },
  {
    id: "ambiguity",
    domain: "Ambiguity and unilateral control",
    label: "Ambiguous or undefined obligation",
    severity: "medium",
    confidence: 0.72,
    patterns: [/reasonable\s+.*discretion/i, /as\s+determined\s+by/i, /from\s+time\s+to\s+time/i, /including\s+but\s+not\s+limited\s+to/i, /material\s+breach\s+.*sole/i],
    why: "Ambiguous language can be interpreted broadly by the stronger party.",
    impact: "The affected party may not know what behavior triggers breach, fees, suspension, or termination.",
    recommendation: "Define key terms, objective standards, notice requirements, and examples of covered conduct."
  },
  {
    id: "warranty-disclaimer",
    domain: "Liability and indemnity",
    label: "Broad warranty disclaimer",
    severity: "medium",
    confidence: 0.82,
    patterns: [/as\s+is/i, /without\s+warrant(y|ies)/i, /disclaims?\s+all\s+warranties/i],
    why: "Warranty disclaimers reduce promises about service quality, condition, reliability, or fitness.",
    impact: "The user may have fewer remedies if the product, service, or property fails expectations.",
    recommendation: "Request minimum service commitments, express warranties, repair duties, or refund rights."
  },
  {
    id: "security-compliance",
    domain: "Compliance and governance",
    label: "Weak security or compliance commitment",
    severity: "medium",
    confidence: 0.74,
    patterns: [/commercially\s+reasonable\s+security/i, /no\s+guarantee\s+.*security/i, /not\s+responsible\s+for\s+unauthorized\s+access/i, /customer\s+is\s+solely\s+responsible\s+for\s+compliance/i],
    why: "Soft security and compliance language may leave important duties undefined.",
    impact: "The user may carry regulatory or operational exposure without clear commitments from the counterparty.",
    recommendation: "Ask for specific security controls, audit rights, breach notice timelines, and shared compliance responsibilities."
  },
  {
    id: "audit-access",
    domain: "Compliance and governance",
    label: "Broad audit or inspection right",
    severity: "medium",
    confidence: 0.76,
    patterns: [/audit\s+.*(records|books|systems)/i, /inspect\s+.*premises/i, /access\s+.*systems\s+.*upon\s+request/i],
    why: "Audit rights can expose sensitive records or disrupt operations if not limited.",
    impact: "The affected party may need to provide records, systems access, or on-site inspection with little control.",
    recommendation: "Limit audits to reasonable notice, business hours, confidentiality, frequency caps, and relevant records."
  },
  {
    id: "deposit-forfeiture",
    domain: "Financial obligations",
    label: "Deposit forfeiture or excessive deduction",
    severity: "high",
    confidence: 0.82,
    patterns: [/security\s+deposit\s+.*forfeit/i, /deposit\s+.*non[-\s]?refundable/i, /deduct\s+.*at\s+.*sole\s+discretion/i],
    why: "Deposit language can transfer financial control to the stronger party.",
    impact: "The user may lose prepaid funds without clear proof of damage or breach.",
    recommendation: "Require itemized deductions, evidence of damage, return deadlines, and dispute rights."
  },
  {
    id: "coverage-exclusion",
    domain: "Financial obligations",
    label: "Broad coverage exclusion",
    severity: "high",
    confidence: 0.8,
    patterns: [/exclusions?\s+include/i, /not\s+covered/i, /coverage\s+does\s+not\s+apply/i, /pre[-\s]?existing\s+condition/i],
    why: "Exclusions can remove the protection the user expects from the agreement.",
    impact: "The affected party may pay premiums or fees but receive no benefit in common loss scenarios.",
    recommendation: "Ask for a plain-language exclusion schedule, examples, appeal rights, and explicit coverage for key risks."
  },
  {
    id: "assignment-transfer",
    domain: "Ambiguity and unilateral control",
    label: "Unrestricted assignment or transfer",
    severity: "medium",
    confidence: 0.72,
    patterns: [/may\s+assign\s+.*without\s+consent/i, /transfer\s+this\s+agreement\s+.*without\s+notice/i, /successors\s+and\s+assigns/i],
    why: "Assignment rights can move the contract to a party the user did not choose.",
    impact: "The user may be bound to a new provider, landlord, employer, or buyer with different practices.",
    recommendation: "Require notice, consent for material transfers, and termination rights after assignment."
  }
];
