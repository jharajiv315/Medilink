export type UserRole = 'patient' | 'clinician' | 'admin';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  organization?: string;
  organizationId?: string;
  patientId?: string;
  title?: string;
  badgeNumber?: string;
  token?: string;
}

export type AllergyAssertion =
  | 'present'
  | 'explicit_none_known'
  | 'historical'
  | 'unknown';

export interface Organization {
  id: string;
  name: string;
  type: 'hospital' | 'specialty_clinic' | 'lab' | 'practice';
  location: string;
  fhirEndpoint?: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  name: string;
  birthDate: string;
  gender: string;
  mrn: string;
  bloodType: string;
  conditions: string[];
  allergiesSummary: string;
  primaryCarePhysician: string;
}

export type DocumentType =
  | 'discharge_summary'
  | 'specialty_consult'
  | 'lab_report'
  | 'prescription_order'
  | 'allergy_challenge';

export interface ClinicalDocument {
  id: string;
  patientId: string;
  sourceOrganizationId: string;
  sourceOrganizationName: string;
  documentType: DocumentType;
  title: string;
  clinicalDate: string;
  uploadedAt: string;
  fileName: string;
  fileSize: string;
  sha256Hash: string;
  rawTextExcerpt: string;
  status: 'indexed' | 'verified';
}

export type FactType = 'allergy' | 'medication' | 'lab_value' | 'condition' | 'encounter';

export interface MedicalFact {
  id: string;
  patientId: string;
  documentId: string;
  documentTitle: string;
  sourceOrgName: string;
  factType: FactType;
  conceptKey: string; // e.g., 'penicillin', 'metformin', 'hba1c'
  assertion: string; // e.g. "Severe Penicillin Allergy (Rash & Angioedema)" vs "No Penicillin Allergy / Skin Prick Negative"
  value: string;
  clinicalDate: string;
  evidenceQuote: string;
  sourcePage?: number;
  verificationStatus: 'unverified' | 'disputed' | 'patient_affirmed' | 'clinician_reconciled';
  allergyAssertion?: AllergyAssertion;
  doseMg?: number;
  frequency?: string;
}

export type ConflictType =
  | 'allergy_conflict'
  | 'dosage_escalation'
  | 'redundant_therapy'
  | 'contraindication';

export interface DiscrepancyConflict {
  id: string;
  patientId: string;
  conflictType: ConflictType;
  title: string;
  conceptKey: string;
  factAId: string;
  factBId: string;
  factA: MedicalFact;
  factB: MedicalFact;
  explanation: string;
  clinicalSignificance: 'high' | 'moderate' | 'low';
  status: 'action_required' | 'patient_affirmed' | 'clinician_reconciled';
  patientAffirmation?: {
    affirmed: boolean;
    statement: string;
    timestamp: string;
  };
  clinicianReview?: {
    reviewerName: string;
    reviewerRole: string;
    reviewerOrg: string;
    clinicalResolution: string;
    rationale: string;
    timestamp: string;
  };
}

export type AccessCategory =
  | 'Allergies'
  | 'Medications'
  | 'Lab Reports'
  | 'Consultations'
  | 'Cardiology'
  | 'Behavioral Health';

export type GrantStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'rejected';

export interface AccessGrant {
  id: string;
  requesterUserId?: string;
  patientId: string;
  patientName: string;
  requestingOrgId: string;
  requestingOrgName: string;
  requesterName: string;
  requesterTitle: string;
  purpose: string;
  requestedCategories: AccessCategory[];
  approvedCategories: AccessCategory[];
  status: GrantStatus;
  requestedAt: string;
  approvedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  accessDurationDays: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  organization: string;
  patientId?: string;
  action:
    | 'DOCUMENT_INGESTED'
    | 'ACCESS_REQUESTED'
    | 'ACCESS_APPROVED'
    | 'ACCESS_REVOKED'
    | 'RECORD_ACCESSED'
    | 'CLINICAL_REVIEW_RECORDED'
    | 'CLINICIAN_ACCOUNT_PROVISIONED'
    | 'ACCESS_DENIED';
  outcome: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  details: string;
  ipHash: string;
}
