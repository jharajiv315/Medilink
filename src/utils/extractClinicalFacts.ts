import type { FactType } from '../types/medilink.ts';

export function extractClinicalFacts(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const facts: Array<{ factType: FactType; conceptKey: string; assertion: string; value: string; evidenceQuote: string }> = [];
  const add = (factType: FactType, conceptKey: string, source: string) => facts.push({ factType, conceptKey, assertion: source, value: source, evidenceQuote: source });
  // Preserve the supplied statement verbatim: never manufacture a dose,
  // challenge result, symptom, or source quote from a medication name alone.
  for (const line of lines) {
    if (/penicillin|amoxicillin/i.test(line) && /rash|hives|angioedema|anaphylaxis/i.test(line) && !/no\s+(rash|hives)|without\s+(rash|hives)/i.test(line)) add('allergy', 'penicillin', line);
    else if (/no known drug allergies|skin prick.*negative|amoxicillin.*(?:tolerated|negative)|penicillin.*non-allergic/i.test(line)) add('allergy', 'penicillin', line);
    for (const drug of ['metformin', 'lisinopril', 'cefdinir']) {
      if (new RegExp(`\\b${drug}\\b`, 'i').test(line)) add('medication', drug, line);
    }
  }
  return facts;
}
