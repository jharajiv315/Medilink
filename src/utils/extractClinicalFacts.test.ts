import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractClinicalFacts } from './extractClinicalFacts.ts';
import { evaluateGrantStatus } from './consentEngine.ts';
import { detectConflicts } from './discrepancyEngine.ts';

test('demo source extraction preserves original statements and detects the source contradiction', () => {
  const sources = ['ALLERGIES: Penicillin allergy — rash and hives reported following childhood amoxicillin.', 'FINDINGS: Full skin prick test negative. Oral amoxicillin 250mg challenge tolerated without reaction.\nCONCLUSION: No known drug allergies.'];
  const facts = sources.flatMap((source, index) => extractClinicalFacts(source).map((fact, i) => {
    assert(source.includes(fact.evidenceQuote));
    return { ...fact, id: `fact-${index}-${i}`, patientId: 'test', documentId: `doc-${index}`, documentTitle: `Source ${index}`, sourceOrgName: `Source ${index}`, clinicalDate: `2026-0${index + 1}-01`, verificationStatus: 'unverified' as const };
  }));
  assert(detectConflicts(facts).some(conflict => conflict.conceptKey === 'penicillin'));
});

test('medication extraction never supplies an absent dose or replaces the supplied dose', () => {
  for (const source of ['Lisinopril dose not provided.', 'Metformin 500mg once daily.', 'Cefdinir 150mg prescribed.']) {
    const [fact] = extractClinicalFacts(source);
    assert.equal(fact.value, source);
    assert.equal(fact.evidenceQuote, source);
  }
});

test('consent expires at the exact boundary and invalid timestamps fail closed', () => {
  const now = new Date('2026-10-17T12:00:00Z');
  assert.equal(evaluateGrantStatus({ status: 'active', expiresAt: now.toISOString() } as any, now), 'expired');
  assert.equal(evaluateGrantStatus({ status: 'active', expiresAt: 'invalid' } as any, now), 'expired');
});
