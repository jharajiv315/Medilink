import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectConflicts,
  applyPatientAffirmation,
  applyClinicianReconciliation
} from './discrepancyEngine.ts';
import {
  evaluateGrantStatus,
  canAccessCategory,
  filterRecordsByScopes
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
