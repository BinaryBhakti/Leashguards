export const jurisdictionProfiles = {
  "not specified": {
    label: "Not specified",
    notes: ["No jurisdiction was selected. Treat enforceability, statutory rights, and venue risk as unresolved."],
    focus: ["governing law", "venue", "statutory rights", "consumer or employment protections"]
  },
  India: {
    label: "India",
    notes: [
      "Review restraint of trade language carefully, especially post-termination employment or client restrictions.",
      "Check arbitration seat, governing law, stamp duty, limitation periods, and dispute venue.",
      "For privacy clauses, review consent, purpose limitation, retention, and sensitive personal data handling."
    ],
    focus: ["arbitration seat", "restraint of trade", "stamp duty", "privacy consent", "data retention"]
  },
  "United States": {
    label: "United States",
    notes: [
      "State law can materially change enforceability for non-competes, arbitration, consumer terms, privacy, and fee shifting.",
      "Check whether federal, state, employment, consumer, or sector-specific rules apply."
    ],
    focus: ["state law", "arbitration", "class waiver", "privacy notices", "fee shifting"]
  },
  "California, United States": {
    label: "California, United States",
    notes: [
      "California strongly scrutinizes employment restraints and broad non-compete language.",
      "Consumer, privacy, automatic renewal, and unfair business practice rules may affect enforceability.",
      "Review IP assignment terms for prior inventions, off-duty inventions, and statutory carve-outs."
    ],
    focus: ["non-compete", "automatic renewal", "CCPA/CPRA", "prior inventions", "class waiver"]
  },
  "New York, United States": {
    label: "New York, United States",
    notes: [
      "Review reasonableness of restraints, governing law, venue, liquidated damages, and arbitration provisions.",
      "Financial service, employment, and consumer terms may trigger additional review."
    ],
    focus: ["reasonableness", "liquidated damages", "venue", "arbitration", "consumer terms"]
  },
  "European Union / GDPR": {
    label: "European Union / GDPR",
    notes: [
      "Review lawful basis, transparency, purpose limitation, retention, data subject rights, and cross-border transfers.",
      "Processor/controller roles and security obligations should be explicit."
    ],
    focus: ["lawful basis", "data minimization", "retention", "DPA", "cross-border transfer"]
  },
  "United Kingdom": {
    label: "United Kingdom",
    notes: [
      "Review restraint reasonableness, consumer fairness, governing law, limitation clauses, and UK GDPR obligations.",
      "Unfair or overly broad standard terms may need closer review."
    ],
    focus: ["consumer fairness", "UK GDPR", "restraint reasonableness", "limitation clause"]
  },
  Singapore: {
    label: "Singapore",
    notes: [
      "Review governing law, dispute forum, restraint of trade reasonableness, and PDPA-related data obligations.",
      "Commercial reasonableness and clarity of remedies are important in negotiated agreements."
    ],
    focus: ["PDPA", "arbitration", "restraint of trade", "governing law"]
  }
};

export function getJurisdictionProfile(jurisdiction) {
  return jurisdictionProfiles[jurisdiction] || jurisdictionProfiles["not specified"];
}

