import type {
  MedicalFact,
  DiscrepancyConflict,
  ConflictType,
  AllergyAssertion
} from '../types/medilink.ts';

/**
 * Normalizes allergy assertions into strict clinical states:
 * - 'present': active documented hypersensitivity / allergy
 * - 'explicit_none_known': verified negative challenge, NKDA, or negative skin test
 * - 'historical': remote or unconfirmed childhood reaction
 * - 'unknown': missing or unspecified (NEVER assumed negative)
 */
export function normalizeAllergyAssertion(fact: MedicalFact): AllergyAssertion {
  if (fact.allergyAssertion) return fact.allergyAssertion;
  const text = `${fact.assertion} ${fact.value} ${fact.evidenceQuote}`.toLowerCase().trim();

  if (!text || text === 'unknown' || text.includes('unspecified') || text === 'not tested') {
    return 'unknown';
  }

  // Explicit negative / tolerated
  if (
    text.includes('no known') ||
    text.includes('nkda') ||
    text.includes('negative') ||
    text.includes('passed') ||
    text.includes('tolerated') ||
    text.includes('de-labeled') ||
    text.includes('non-allergic') ||
    text.includes('skin prick negative')
  ) {
    return 'explicit_none_known';
  }

  // Explicit positive hypersensitivity
  if (
    text.includes('allergic') ||
    text.includes('allergy') ||
    text.includes('hives') ||
    text.includes('anaphylaxis') ||
    text.includes('angioedema') ||
    text.includes('rash') ||
    text.includes('severe sensitivity')
  ) {
    if (text.includes('childhood') || text.includes('remote') || text.includes('historical')) {
      return 'historical';
    }
    return 'present';
  }

  return 'unknown';
}

export interface MedicationDoseInfo {
  doseMg?: number;
  frequency: string;
}

export function parseMedicationDetails(fact: MedicalFact): MedicationDoseInfo {
  const text = `${fact.assertion} ${fact.value}`.toLowerCase();
  const doseMatch = text.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g)\b/);

  let doseMg: number | undefined;
  if (doseMatch) {
    const rawVal = parseFloat(doseMatch[1]);
    const unit = doseMatch[2];
    doseMg = unit === 'g' ? rawVal * 1000 : unit === 'mcg' ? rawVal * 0.001 : rawVal;
  }

  let frequency = 'as directed';
  if (text.includes('bid') || text.includes('twice daily') || text.includes('twice a day')) {
    frequency = 'BID';
  } else if (text.includes('tid') || text.includes('three times daily')) {
    frequency = 'TID';
  } else if (text.includes('daily') || text.includes('qday') || text.includes('once daily')) {
    frequency = 'Daily';
  } else if (text.includes('weekly') || text.includes('once weekly')) {
    frequency = 'Weekly';
  }

  return { doseMg, frequency };
}

/**
 * Deterministic discrepancy engine comparing documented clinical statements.
 * Never silently guesses clinical accuracy; flags conflicts for verified handoff review.
 */
export function detectConflicts(facts: MedicalFact[]): DiscrepancyConflict[] {
  const conflicts: DiscrepancyConflict[] = [];

  // Group facts by conceptKey (e.g. 'penicillin', 'metformin')
  const conceptMap = new Map<string, MedicalFact[]>();
  for (const fact of facts) {
    const key = fact.conceptKey.toLowerCase().trim();
    if (!conceptMap.has(key)) {
      conceptMap.set(key, []);
    }
    conceptMap.get(key)!.push(fact);
  }

  for (const [conceptKey, factGroup] of conceptMap.entries()) {
    if (factGroup.length < 2) continue;

    // Check Allergy Conflicts
    if (factGroup[0].factType === 'allergy') {
      for (let i = 0; i < factGroup.length; i++) {
        for (let j = i + 1; j < factGroup.length; j++) {
          const a = factGroup[i];
          const b = factGroup[j];
          const stateA = normalizeAllergyAssertion(a);
          const stateB = normalizeAllergyAssertion(b);

          // Rule: Unknown is never assumed negative; only flag explicit contradiction
          const hasContradiction =
            (stateA === 'present' && stateB === 'explicit_none_known') ||
            (stateB === 'present' && stateA === 'explicit_none_known') ||
            (stateA === 'historical' && stateB === 'explicit_none_known') ||
            (stateB === 'historical' && stateA === 'explicit_none_known');

          if (hasContradiction) {
            const sortedIds = [a.id, b.id].sort();
            conflicts.push({
              id: `conflict-${sortedIds[0]}-${sortedIds[1]}`,
              patientId: a.patientId,
              conflictType: 'allergy_conflict',
              title: `Documentation Discrepancy: ${capitalize(conceptKey)} Hypersensitivity`,
              conceptKey,
              factAId: a.id,
              factBId: b.id,
              factA: a,
              factB: b,
              explanation: `Documented clinical contradiction between ${a.sourceOrgName} (${a.clinicalDate}) and ${b.sourceOrgName} (${b.clinicalDate}). One source records hypersensitivity (${a.value}) while the other documents non-allergic status or negative challenge (${b.value}). Clinical review required before administration.`,
              clinicalSignificance: 'high',
              status: 'action_required'
            });
          }
        }
      }
    }

    // Check Medication Conflicts / Dosage Changes
    if (factGroup[0].factType === 'medication') {
      for (let i = 0; i < factGroup.length; i++) {
        for (let j = i + 1; j < factGroup.length; j++) {
          const a = factGroup[i];
          const b = factGroup[j];

          if (a.value.toLowerCase().trim() === b.value.toLowerCase().trim()) continue;

          const doseA = parseMedicationDetails(a);
          const doseB = parseMedicationDetails(b);

          const timeA = new Date(a.clinicalDate).getTime();
          const timeB = new Date(b.clinicalDate).getTime();
          const dayDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60 * 24);

          // If chronological difference (> 14 days), it represents documented dosage escalation/titration
          const isChronologicalChange = dayDiff > 14;
          const sortedIds = [a.id, b.id].sort();

          if (isChronologicalChange) {
            const earlier = timeA <= timeB ? a : b;
            const later = timeA <= timeB ? b : a;
            conflicts.push({
              id: `conflict-med-${sortedIds[0]}-${sortedIds[1]}`,
              patientId: a.patientId,
              conflictType: 'dosage_escalation',
              title: `Dosage Titration History: ${capitalize(conceptKey)}`,
              conceptKey,
              factAId: earlier.id,
              factBId: later.id,
              factA: earlier,
              factB: later,
              explanation: `Sequential dosage progression recorded across encounters: ${earlier.sourceOrgName} noted "${earlier.value}" on ${earlier.clinicalDate}, followed by ${later.sourceOrgName} recording "${later.value}" on ${later.clinicalDate}. Confirm current active adherence before prescribing.`,
              clinicalSignificance: 'moderate',
              status: 'action_required'
            });
          } else {
            // Overlapping concurrent records with differing doses
            conflicts.push({
              id: `conflict-med-${sortedIds[0]}-${sortedIds[1]}`,
              patientId: a.patientId,
              conflictType: 'redundant_therapy',
              title: `Contradictory Active Regimen: ${capitalize(conceptKey)}`,
              conceptKey,
              factAId: a.id,
              factBId: b.id,
              factA: a,
              factB: b,
              explanation: `Overlapping concurrent prescriptions documented with differing dosages: ${a.sourceOrgName} notes "${a.value}" on ${a.clinicalDate}, while ${b.sourceOrgName} recorded "${b.value}" on ${b.clinicalDate}. Immediate reconciliation recommended.`,
              clinicalSignificance: 'high',
              status: 'action_required'
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Merges freshly detected conflicts with existing conflicts, preserving prior
 * patient affirmations and clinician reviews so historical work is never lost.
 */
export function mergeConflictsPreservingReviews(
  existingConflicts: DiscrepancyConflict[],
  freshConflicts: DiscrepancyConflict[]
): DiscrepancyConflict[] {
  const existingMap = new Map<string, DiscrepancyConflict>();

  for (const c of existingConflicts) {
    existingMap.set(c.id, c);
    const sortedFacts = [c.factAId, c.factBId].sort().join(':');
    existingMap.set(`${c.conceptKey}:${sortedFacts}`, c);
  }

  return freshConflicts.map(fresh => {
    const sortedFacts = [fresh.factAId, fresh.factBId].sort().join(':');
    const compositeKey = `${fresh.conceptKey}:${sortedFacts}`;
    const prior = existingMap.get(fresh.id) || existingMap.get(compositeKey);

    if (prior && (prior.status === 'clinician_reconciled' || prior.status === 'patient_affirmed')) {
      return {
        ...fresh,
        id: prior.id,
        status: prior.status,
        patientAffirmation: prior.patientAffirmation,
        clinicianReview: prior.clinicianReview
      };
    }
    return fresh;
  });
}

export function applyPatientAffirmation(
  conflict: DiscrepancyConflict,
  affirmationStatement: string
): DiscrepancyConflict {
  return {
    ...conflict,
    status: conflict.status === 'clinician_reconciled' ? 'clinician_reconciled' : 'patient_affirmed',
    patientAffirmation: {
      affirmed: true,
      statement: affirmationStatement,
      timestamp: new Date().toISOString()
    }
  };
}

export function applyClinicianReconciliation(
  conflict: DiscrepancyConflict,
  clinician: { name: string; role: string; org: string },
  clinicalResolution: string,
  rationale: string
): DiscrepancyConflict {
  return {
    ...conflict,
    status: 'clinician_reconciled',
    clinicianReview: {
      reviewerName: clinician.name,
      reviewerRole: clinician.role,
      reviewerOrg: clinician.org,
      clinicalResolution,
      rationale,
      timestamp: new Date().toISOString()
    }
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
