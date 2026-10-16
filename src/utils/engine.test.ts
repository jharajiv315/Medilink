import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectConflicts,
  applyPatientAffirmation,
  applyClinicianReconciliation,
  normalizeAllergyAssertion,
  mergeConflictsPreservingReviews
} from './discrepancyEngine.ts';
import {
  evaluateGrantStatus,
  canAccessCategory,
  filterRecordsByScopes,
  authorizeClinicianHandoffAccess
} from './consentEngine.ts';
import type { MedicalFact, AccessGrant } from '../types/medilink.ts';

test('detectConflicts identifies allergy conflict between positive and negative records', () => {
  const facts: MedicalFact[] = [
    {
      id: 'f1',
      patientId: 'P1',
      documentId: 'd1',
      documentTitle: 'Memorial Hospital Discharge',
      sourceOrgName: 'Memorial Hospital',
      factType: 'allergy',
      conceptKey: 'penicillin',
      assertion: 'Severe Penicillin Allergy',
      value: 'Allergic: severe hives & mild angioedema',
      clinicalDate: '2021-10-12',
      evidenceQuote: 'Patient reported hives and throat swelling after amoxicillin',
      verificationStatus: 'unverified'
    },
    {
      id: 'f2',
      patientId: 'P1',
      documentId: 'd2',
      documentTitle: 'Allergy & Asthma Center Challenge',
      sourceOrgName: 'Allergy & Asthma Center',
      factType: 'allergy',
      conceptKey: 'penicillin',
      assertion: 'Skin Prick & Oral Challenge: Passed',
      value: 'Negative: full skin prick negative, 250mg oral challenge tolerated',
      clinicalDate: '2023-04-18',
      evidenceQuote: 'Skin prick negative, oral challenge tolerated with zero reaction',
      verificationStatus: 'unverified'
    }
  ];

  const conflicts = detectConflicts(facts);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].conflictType, 'allergy_conflict');
  assert.equal(conflicts[0].clinicalSignificance, 'high');
  assert.equal(conflicts[0].status, 'action_required');
});

test('applyPatientAffirmation updates conflict state correctly', () => {
  const dummyConflict = {
    id: 'c1',
    patientId: 'P1',
    conflictType: 'allergy_conflict' as const,
    title: 'Penicillin Discrepancy',
    conceptKey: 'penicillin',
    factAId: 'f1',
    factBId: 'f2',
    factA: {} as any,
    factB: {} as any,
    explanation: 'Test',
    clinicalSignificance: 'high' as const,
    status: 'action_required' as const
  };

  const updated = applyPatientAffirmation(dummyConflict, 'I took amoxicillin with no symptoms');
  assert.equal(updated.status, 'patient_affirmed');
  assert.equal(updated.patientAffirmation?.affirmed, true);
  assert.match(updated.patientAffirmation?.statement || '', /no symptoms/);
});

test('applyClinicianReconciliation marks conflict reconciled and attaches provider signature', () => {
  const dummyConflict = {
    id: 'c1',
    patientId: 'P1',
    conflictType: 'allergy_conflict' as const,
    title: 'Penicillin Discrepancy',
    conceptKey: 'penicillin',
    factAId: 'f1',
    factBId: 'f2',
    factA: {} as any,
    factB: {} as any,
    explanation: 'Test',
    clinicalSignificance: 'high' as const,
    status: 'action_required' as const
  };

  const reconciled = applyClinicianReconciliation(
    dummyConflict,
    { name: 'Dr. Marcus Vance', role: 'Attending Physician', org: 'Sutter Health' },
    'De-labeled Penicillin Allergy',
    'Patient passed confirmed oral challenge at Allergy Center.'
  );

  assert.equal(reconciled.status, 'clinician_reconciled');
  assert.equal(reconciled.clinicianReview?.reviewerName, 'Dr. Marcus Vance');
  assert.equal(reconciled.clinicianReview?.clinicalResolution, 'De-labeled Penicillin Allergy');
});

test('consentEngine verifies active, expired, and revoked states', () => {
  const baseGrant: AccessGrant = {
    id: 'g1',
    patientId: 'P1',
    patientName: 'Ananya Sharma',
    requestingOrgId: 'org-sutter',
    requestingOrgName: 'Sutter Health',
    requesterName: 'Dr. Marcus Vance',
    requesterTitle: 'Chief of Medicine',
    purpose: 'Specialty Consultation & Pre-op Clearance',
    requestedCategories: ['Allergies', 'Medications', 'Lab Reports'],
    approvedCategories: ['Allergies', 'Medications'],
    status: 'active',
    requestedAt: '2026-10-01T10:00:00.000Z',
    expiresAt: '2026-11-01T10:00:00.000Z',
    accessDurationDays: 30
  };

  // Test active grant with approved scope
  const accessAllergies = canAccessCategory(baseGrant, 'Allergies', new Date('2026-10-15T12:00:00.000Z'));
  assert.equal(accessAllergies.allowed, true);

  // Test active grant with unapproved scope ('Lab Reports')
  const accessLabs = canAccessCategory(baseGrant, 'Lab Reports', new Date('2026-10-15T12:00:00.000Z'));
  assert.equal(accessLabs.allowed, false);
  assert.match(accessLabs.reason || '', /not authorized/);

  // Test expired grant
  const accessExpired = canAccessCategory(baseGrant, 'Allergies', new Date('2026-11-15T12:00:00.000Z'));
  assert.equal(accessExpired.allowed, false);
  assert.match(accessExpired.reason || '', /expired/);

  // Test revoked grant
  const revokedGrant: AccessGrant = { ...baseGrant, status: 'revoked', revokedAt: '2026-10-12T08:00:00.000Z' };
  const accessRevoked = canAccessCategory(revokedGrant, 'Allergies', new Date('2026-10-15T12:00:00.000Z'));
  assert.equal(accessRevoked.allowed, false);
  assert.match(accessRevoked.reason || '', /revoked/);
});

test('filterRecordsByScopes filters out non-approved categories and enforces revocation', () => {
  const grant: AccessGrant = {
    id: 'g1',
    patientId: 'P1',
    patientName: 'Ananya Sharma',
    requestingOrgId: 'org-sutter',
    requestingOrgName: 'Sutter Health',
    requesterName: 'Dr. Marcus Vance',
    requesterTitle: 'Chief of Medicine',
    purpose: 'Consult',
    requestedCategories: ['Allergies', 'Medications', 'Lab Reports'],
    approvedCategories: ['Allergies', 'Medications'],
    status: 'active',
    requestedAt: '2026-10-01T10:00:00.000Z',
    expiresAt: '2026-11-01T10:00:00.000Z',
    accessDurationDays: 30
  };

  const sampleRecords = [
    { id: '1', name: 'Penicillin Note', category: 'Allergies' as const },
    { id: '2', name: 'Metformin Rx', category: 'Medications' as const },
    { id: '3', name: 'HbA1c Lab', category: 'Lab Reports' as const }
  ];

  const result = filterRecordsByScopes(sampleRecords, grant, new Date('2026-10-15T10:00:00.000Z'));
  assert.equal(result.isAuthorized, true);
  assert.equal(result.allowedRecords.length, 2);
  assert.equal(result.deniedCount, 1);

  // Now test with revoked grant
  const revokedResult = filterRecordsByScopes(sampleRecords, { ...grant, status: 'revoked' });
  assert.equal(revokedResult.isAuthorized, false);
  assert.equal(revokedResult.allowedRecords.length, 0);
  assert.equal(revokedResult.deniedCount, 3);
});

test('normalizeAllergyAssertion never assumes missing allergy field is negative', () => {
  const unknownFact: MedicalFact = {
    id: 'f-unk',
    patientId: 'P1',
    documentId: 'd-unk',
    documentTitle: 'Unspecified consult',
    sourceOrgName: 'Clinic X',
    factType: 'allergy',
    conceptKey: 'penicillin',
    assertion: 'Allergy status unknown',
    value: 'Unspecified',
    clinicalDate: '2026-01-01',
    evidenceQuote: 'Patient was unresponsive, allergy status unconfirmed',
    verificationStatus: 'unverified'
  };

  assert.equal(normalizeAllergyAssertion(unknownFact), 'unknown');

  // Ensure an unknown fact does not create a conflict with a known positive fact
  const positiveFact: MedicalFact = {
    id: 'f-pos',
    patientId: 'P1',
    documentId: 'd-pos',
    documentTitle: 'Hospital Note',
    sourceOrgName: 'Hospital Y',
    factType: 'allergy',
    conceptKey: 'penicillin',
    assertion: 'Penicillin Allergy',
    value: 'Anaphylaxis to amoxicillin',
    clinicalDate: '2026-02-01',
    evidenceQuote: 'Hives and respiratory distress after amoxicillin',
    verificationStatus: 'unverified'
  };

  const conflicts = detectConflicts([unknownFact, positiveFact]);
  assert.equal(conflicts.length, 0, 'Unknown allergy status must NOT be assumed negative or trigger false conflict');
});

test('detectConflicts classifies chronological dosage changes as dosage_escalation vs redundant_therapy', () => {
  // Chronological change (e.g. 500mg in Jan -> 1000mg in Jun)
  const janRx: MedicalFact = {
    id: 'rx1',
    patientId: 'P1',
    documentId: 'd1',
    documentTitle: 'Jan Rx',
    sourceOrgName: 'Primary Clinic',
    factType: 'medication',
    conceptKey: 'metformin',
    assertion: 'Metformin 500mg daily',
    value: '500mg daily PO',
    clinicalDate: '2026-01-15',
    evidenceQuote: 'Start Metformin 500mg daily for glucose control',
    verificationStatus: 'unverified'
  };

  const junRx: MedicalFact = {
    id: 'rx2',
    patientId: 'P1',
    documentId: 'd2',
    documentTitle: 'Jun Rx',
    sourceOrgName: 'Endocrine Specialist',
    factType: 'medication',
    conceptKey: 'metformin',
    assertion: 'Metformin 1000mg BID',
    value: '1000mg BID PO',
    clinicalDate: '2026-06-20',
    evidenceQuote: 'Escalate to Metformin 1000mg BID with meals',
    verificationStatus: 'unverified'
  };

  const titrationConflicts = detectConflicts([janRx, junRx]);
  assert.equal(titrationConflicts.length, 1);
  assert.equal(titrationConflicts[0].conflictType, 'dosage_escalation');
  assert.equal(titrationConflicts[0].clinicalSignificance, 'moderate');

  // Concurrent contradictory prescriptions (e.g. same week)
  const concurrentRx: MedicalFact = {
    id: 'rx3',
    patientId: 'P1',
    documentId: 'd3',
    documentTitle: 'Urgent Care Rx',
    sourceOrgName: 'Urgent Care B',
    factType: 'medication',
    conceptKey: 'metformin',
    assertion: 'Metformin 850mg daily',
    value: '850mg daily PO',
    clinicalDate: '2026-06-22',
    evidenceQuote: 'Prescribed Metformin 850mg daily',
    verificationStatus: 'unverified'
  };

  const concurrentConflicts = detectConflicts([junRx, concurrentRx]);
  assert.equal(concurrentConflicts.length, 1);
  assert.equal(concurrentConflicts[0].conflictType, 'redundant_therapy');
  assert.equal(concurrentConflicts[0].clinicalSignificance, 'high');
});

test('mergeConflictsPreservingReviews preserves clinician reconciliations when new facts arrive', () => {
  const fact1: MedicalFact = {
    id: 'f1',
    patientId: 'P1',
    documentId: 'd1',
    documentTitle: 'Hospital',
    sourceOrgName: 'Hospital',
    factType: 'allergy',
    conceptKey: 'penicillin',
    assertion: 'Penicillin allergy',
    value: 'Allergic - rash',
    clinicalDate: '2021-01-01',
    evidenceQuote: 'Rash reported',
    verificationStatus: 'unverified'
  };

  const fact2: MedicalFact = {
    id: 'f2',
    patientId: 'P1',
    documentId: 'd2',
    documentTitle: 'Clinic',
    sourceOrgName: 'Clinic',
    factType: 'allergy',
    conceptKey: 'penicillin',
    assertion: 'Negative skin test',
    value: 'No known drug allergies',
    clinicalDate: '2023-01-01',
    evidenceQuote: 'Skin test negative',
    verificationStatus: 'unverified'
  };

  const initialConflicts = detectConflicts([fact1, fact2]);
  assert.equal(initialConflicts.length, 1);

  // Clinician reconciles the conflict
  const reconciled = applyClinicianReconciliation(
    initialConflicts[0],
    { name: 'Dr. Vance', role: 'Attending', org: 'Sutter Health' },
    'De-labeled Penicillin Allergy',
    'Oral challenge confirmed safe'
  );

  // Now a new unrelated fact is ingested
  const fact3: MedicalFact = {
    id: 'f3',
    patientId: 'P1',
    documentId: 'd3',
    documentTitle: 'Cardiology',
    sourceOrgName: 'Cardio Clinic',
    factType: 'medication',
    conceptKey: 'lisinopril',
    assertion: 'Lisinopril 10mg',
    value: '10mg daily',
    clinicalDate: '2026-03-01',
    evidenceQuote: 'Prescribed lisinopril',
    verificationStatus: 'unverified'
  };

  const freshDetected = detectConflicts([fact1, fact2, fact3]);
  const preserved = mergeConflictsPreservingReviews([reconciled], freshDetected);

  assert.equal(preserved.length, 1);
  assert.equal(preserved[0].status, 'clinician_reconciled');
  assert.equal(preserved[0].clinicianReview?.reviewerName, 'Dr. Vance');
  assert.equal(preserved[0].clinicianReview?.clinicalResolution, 'De-labeled Penicillin Allergy');
});

test('authorizeClinicianHandoffAccess strictly validates roles, organizations, and grant states', () => {
  const baseGrant: AccessGrant = {
    id: 'grant-01',
    patientId: 'P1',
    patientName: 'Ananya Sharma',
    requestingOrgId: 'org-sutter',
    requestingOrgName: 'Sutter Health',
    requesterName: 'Dr. Marcus Vance',
    requesterTitle: 'Chief of Medicine',
    purpose: 'Specialty Consultation',
    requestedCategories: ['Allergies', 'Medications'],
    approvedCategories: ['Allergies'],
    status: 'active',
    requestedAt: '2026-10-01T10:00:00.000Z',
    expiresAt: '2026-11-01T10:00:00.000Z',
    accessDurationDays: 30
  };

  // Valid clinician from Sutter Health
  const validCheck = authorizeClinicianHandoffAccess(
    baseGrant,
    { userId: 'u1', role: 'clinician', organizationId: 'org-sutter' },
    new Date('2026-10-15T10:00:00.000Z')
  );
  assert.equal(validCheck.authorized, true);
  assert.equal(validCheck.httpStatus, 200);

  // Patient attempting to access clinician handoff endpoint
  const patientCheck = authorizeClinicianHandoffAccess(
    baseGrant,
    { userId: 'u2', role: 'patient' },
    new Date('2026-10-15T10:00:00.000Z')
  );
  assert.equal(patientCheck.authorized, false);
  assert.equal(patientCheck.errorCode, 'ROLE_UNAUTHORIZED');

  // Clinician from different hospital trying to use Sutter's grant ID
  const wrongOrgCheck = authorizeClinicianHandoffAccess(
    baseGrant,
    { userId: 'u3', role: 'clinician', organizationId: 'org-kaiser' },
    new Date('2026-10-15T10:00:00.000Z')
  );
  assert.equal(wrongOrgCheck.authorized, false);
  assert.equal(wrongOrgCheck.errorCode, 'ORG_MISMATCH');

  // Revoked grant check
  const revokedGrant: AccessGrant = { ...baseGrant, status: 'revoked', revokedAt: '2026-10-10T10:00:00.000Z' };
  const revokedCheck = authorizeClinicianHandoffAccess(
    revokedGrant,
    { userId: 'u1', role: 'clinician', organizationId: 'org-sutter' },
    new Date('2026-10-15T10:00:00.000Z')
  );
  assert.equal(revokedCheck.authorized, false);
  assert.equal(revokedCheck.errorCode, 'GRANT_REVOKED');
});
