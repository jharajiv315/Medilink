import type { MedicalFact, DiscrepancyConflict, ConflictType } from '../types/medilink.ts';

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
          const valA = a.value.toLowerCase();
          const valB = b.value.toLowerCase();

          const aIsAllergic = valA.includes('allergic') || valA.includes('positive') || valA.includes('hives') || valA.includes('severe');
          const bIsNonAllergic = valB.includes('no known') || valB.includes('negative') || valB.includes('passed') || valB.includes('tolerated');

          const bIsAllergic = valB.includes('allergic') || valB.includes('positive') || valB.includes('hives') || valB.includes('severe');
          const aIsNonAllergic = valA.includes('no known') || valA.includes('negative') || valA.includes('passed') || valA.includes('tolerated');

          if ((aIsAllergic && bIsNonAllergic) || (bIsAllergic && aIsNonAllergic)) {
            conflicts.push({
              id: `conflict-${a.id}-${b.id}`,
              patientId: a.patientId,
              conflictType: 'allergy_conflict',
              title: `Discrepancy Flag: ${capitalize(conceptKey)} Sensitivity`,
              conceptKey,
              factAId: a.id,
              factBId: b.id,
              factA: a,
              factB: b,
              explanation: `Documented clinical contradiction between ${a.sourceOrgName} (${a.clinicalDate}) and ${b.sourceOrgName} (${b.clinicalDate}). One source records active hypersensitivity while the other documents negative challenge or non-allergic status.`,
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
          if (a.value.toLowerCase() !== b.value.toLowerCase()) {
            conflicts.push({
              id: `conflict-med-${a.id}-${b.id}`,
              patientId: a.patientId,
              conflictType: 'dosage_escalation',
              title: `Dosage Variation: ${capitalize(conceptKey)}`,
              conceptKey,
              factAId: a.id,
              factBId: b.id,
              factA: a,
              factB: b,
              explanation: `Different dosing protocols recorded across encounters: ${a.sourceOrgName} notes "${a.value}" on ${a.clinicalDate}, whereas ${b.sourceOrgName} recorded "${b.value}" on ${b.clinicalDate}. Confirm current active adherence before prescribing.`,
              clinicalSignificance: 'moderate',
              status: 'action_required'
            });
          }
        }
      }
    }
  }

  return conflicts;
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
