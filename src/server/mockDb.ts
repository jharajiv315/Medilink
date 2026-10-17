import fs from 'fs';
import path from 'path';
import type {
  Patient,
  Organization,
  ClinicalDocument,
  MedicalFact,
  DiscrepancyConflict,
  AccessGrant,
  AuditEvent,
  UserSession
} from '../types/medilink.ts';
import { detectConflicts } from '../utils/discrepancyEngine.ts';
import { requestStore, usesSupabase } from './requestStore.ts';

export interface MediLinkDatabase {
  users: UserSession[];
  organizations: Organization[];
  patients: Patient[];
  documents: ClinicalDocument[];
  facts: MedicalFact[];
  conflicts: DiscrepancyConflict[];
  grants: AccessGrant[];
  auditLogs: AuditEvent[];
  authCredentials?: AuthCredential[];
  authSessions?: AuthSession[];
}

export interface AuthCredential {
  userId: string;
  email: string;
  salt: string;
  passwordHash: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}

function createInitialDatabase(): MediLinkDatabase {
  const users: UserSession[] = [
    {
      id: 'user-ananya',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      role: 'patient',
      patientId: 'DEMO-P001'
    },
    {
      id: 'user-dr-vance',
      name: 'Dr. Marcus Vance',
      email: 'm.vance@sutterhealth.org',
      role: 'clinician',
      organization: 'Sutter Health',
      organizationId: 'org-sutter',
      title: 'Attending Physician & Clinical Lead',
      badgeNumber: 'MD-84920'
    },
    {
      id: 'user-auditor',
      name: 'Sarah Chen, CISA',
      email: 'compliance@medilink.health',
      role: 'admin',
      organization: 'MediLink Clinical Governance',
      title: 'Chief Compliance & Privacy Officer'
    }
  ];

  const organizations: Organization[] = [
    {
      id: 'org-memorial',
      name: 'Memorial Hospital',
      type: 'hospital',
      location: 'Chicago, IL',
      fhirEndpoint: 'https://fhir.memorialhospital.org/r4'
    },
    {
      id: 'org-allergy',
      name: 'Allergy & Asthma Specialty Center',
      type: 'specialty_clinic',
      location: 'Rochester, MN',
      fhirEndpoint: 'https://fhir.allergyspecialists.org/r4'
    },
    {
      id: 'org-quest',
      name: 'Quest Diagnostics',
      type: 'lab',
      location: 'Regional Central Lab',
      fhirEndpoint: 'https://api.questdiagnostics.com/fhir'
    },
    {
      id: 'org-sutter',
      name: 'Sutter Health Clinical Network',
      type: 'practice',
      location: 'San Francisco, CA',
      fhirEndpoint: 'https://fhir.sutterhealth.org/r4'
    }
  ];

  const patients: Patient[] = [
    {
      id: 'DEMO-P001',
      patientCode: 'ML-89204',
      name: 'Ananya Sharma',
      birthDate: '1988-06-14',
      gender: 'Female',
      mrn: 'MRN-92048-A',
      bloodType: 'O-Positive',
      conditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Seasonal Rhinitis'],
      allergiesSummary: 'Penicillin (Documented Contradiction - Action Required)',
      primaryCarePhysician: 'Dr. Rachel Adams, MD'
    },
    {
      id: 'DEMO-P002',
      patientCode: 'ML-44109',
      name: 'David Kim',
      birthDate: '1974-11-20',
      gender: 'Male',
      mrn: 'MRN-11049-B',
      bloodType: 'A-Positive',
      conditions: ['Hyperlipidemia', 'Mild Asthma'],
      allergiesSummary: 'Sulfa Drugs (Hives)',
      primaryCarePhysician: 'Dr. Joseph Lin, MD'
    }
  ];

  const documents: ClinicalDocument[] = [
    {
      id: 'doc-01',
      patientId: 'DEMO-P001',
      sourceOrganizationId: 'org-memorial',
      sourceOrganizationName: 'Memorial Hospital',
      documentType: 'discharge_summary',
      title: 'Hospital Discharge Summary — Acute Bronchitis',
      clinicalDate: '2021-10-12',
      uploadedAt: '2026-01-05T09:15:00.000Z',
      fileName: 'Discharge_Summary_Oct21.pdf',
      fileSize: '418 KB',
      sha256Hash: 'a87f1c34e892d47f12e0938b8d4f0b99c1e95b078a6311de17cb1209e99a22f1',
      rawTextExcerpt: 'ALLERGIES: Severe Penicillin Allergy. Patient reported childhood rash, widespread hives & mild throat tightness after oral amoxicillin.\nDISCHARGE MEDICATIONS: Metformin 500mg PO daily with evening meal. Albuterol MDI PRN.',
      status: 'verified'
    },
    {
      id: 'doc-02',
      patientId: 'DEMO-P001',
      sourceOrganizationId: 'org-allergy',
      sourceOrganizationName: 'Allergy & Asthma Specialty Center',
      documentType: 'allergy_challenge',
      title: 'Formal IgE Penicillin Skin Prick & Graded Oral Challenge',
      clinicalDate: '2023-04-18',
      uploadedAt: '2026-01-08T11:20:00.000Z',
      fileName: 'Lab_Report_SkinPrick_2023.pdf',
      fileSize: '532 KB',
      sha256Hash: '8b7f21a4f00998cc12d8a901928374aefb388271049281a99efacb12098d1a49',
      rawTextExcerpt: 'PROCEDURE: Skin prick with penicilloyl-polylysine (Pre-Pen) and minor determinant mixture: NEGATIVE at 20 min. Graded oral challenge with Amoxicillin 250mg completed with 60 minute observation: Zero erythema, pruritus, or respiratory distress. CONCLUSION: Patient is NOT penicillin allergic; allergy de-label recommended.',
      status: 'verified'
    },
    {
      id: 'doc-03',
      patientId: 'DEMO-P001',
      sourceOrganizationId: 'org-quest',
      sourceOrganizationName: 'Quest Diagnostics',
      documentType: 'lab_report',
      title: 'Comprehensive Metabolic Panel & Glycated Hemoglobin (HbA1c)',
      clinicalDate: '2026-09-24',
      uploadedAt: '2026-09-25T14:45:00.000Z',
      fileName: 'Quest_CMP_HbA1c_Sep26.pdf',
      fileSize: '312 KB',
      sha256Hash: '4392f8019aeb48271049cbb92837418290eafcb21840291ba8192a8371948291',
      rawTextExcerpt: 'FASTING GLUCOSE: 118 mg/dL [H] (Ref: 70-99 mg/dL)\nHbA1c: 6.8% [H] (Ref: <5.7% Normal, 5.7-6.4% Prediabetes, >=6.5% Diabetes)\neGFR: 92 mL/min/1.73m2 (Ref: >60)\nSerum Creatinine: 0.84 mg/dL (Ref: 0.55-1.02)',
      status: 'verified'
    },
    {
      id: 'doc-04',
      patientId: 'DEMO-P001',
      sourceOrganizationId: 'org-memorial',
      sourceOrganizationName: 'Memorial Hospital Ambulatory Clinic',
      documentType: 'prescription_order',
      title: 'Outpatient Medication Reconciliation Record',
      clinicalDate: '2025-11-04',
      uploadedAt: '2026-01-09T16:00:00.000Z',
      fileName: 'Med_Reconciliation_Nov25.pdf',
      fileSize: '280 KB',
      sha256Hash: 'c90918237192804bba8910293847561029384719203948571029384710293847',
      rawTextExcerpt: 'CURRENT RX:\n1. Metformin HCl 1000mg PO BID with meals (increased from 500mg daily due to A1c elevation).\n2. Lisinopril 10mg PO daily for BP maintenance.\n3. Fluticasone propionate 50mcg nasal spray 1 spray each nostril daily.',
      status: 'verified'
    }
  ];

  const facts: MedicalFact[] = [
    {
      id: 'fact-01',
      patientId: 'DEMO-P001',
      documentId: 'doc-01',
      documentTitle: 'Hospital Discharge Summary — Acute Bronchitis',
      sourceOrgName: 'Memorial Hospital',
      factType: 'allergy',
      conceptKey: 'penicillin',
      assertion: 'Severe Penicillin Allergy (Rash & Angioedema)',
      value: 'Allergic: Severe hives and mild throat swelling upon childhood amoxicillin',
      clinicalDate: '2021-10-12',
      evidenceQuote: 'Patient reported childhood rash, widespread hives & mild throat tightness after oral amoxicillin.',
      sourcePage: 1,
      verificationStatus: 'disputed'
    },
    {
      id: 'fact-02',
      patientId: 'DEMO-P001',
      documentId: 'doc-02',
      documentTitle: 'Formal IgE Penicillin Skin Prick & Graded Oral Challenge',
      sourceOrgName: 'Allergy & Asthma Specialty Center',
      factType: 'allergy',
      conceptKey: 'penicillin',
      assertion: 'Skin Prick & Oral Challenge: Passed (Non-Allergic)',
      value: 'Non-allergic: Full penicilloyl-polylysine skin prick negative. 250mg oral challenge completed with zero reaction',
      clinicalDate: '2023-04-18',
      evidenceQuote: 'Full penicilloyl-polylysine skin prick was negative. 250mg oral challenge completed with zero reaction.',
      sourcePage: 1,
      verificationStatus: 'disputed'
    },
    {
      id: 'fact-03',
      patientId: 'DEMO-P001',
      documentId: 'doc-01',
      documentTitle: 'Hospital Discharge Summary — Acute Bronchitis',
      sourceOrgName: 'Memorial Hospital',
      factType: 'medication',
      conceptKey: 'metformin',
      assertion: 'Metformin 500mg daily',
      value: '500mg daily PO',
      clinicalDate: '2021-10-12',
      evidenceQuote: 'Metformin 500mg PO daily with evening meal.',
      sourcePage: 2,
      verificationStatus: 'unverified'
    },
    {
      id: 'fact-04',
      patientId: 'DEMO-P001',
      documentId: 'doc-04',
      documentTitle: 'Outpatient Medication Reconciliation Record',
      sourceOrgName: 'Memorial Hospital Ambulatory Clinic',
      factType: 'medication',
      conceptKey: 'metformin',
      assertion: 'Metformin 1000mg BID',
      value: '1000mg BID PO',
      clinicalDate: '2025-11-04',
      evidenceQuote: 'Metformin HCl 1000mg PO BID with meals (increased from 500mg daily).',
      sourcePage: 1,
      verificationStatus: 'unverified'
    },
    {
      id: 'fact-05',
      patientId: 'DEMO-P001',
      documentId: 'doc-03',
      documentTitle: 'Comprehensive Metabolic Panel & Glycated Hemoglobin (HbA1c)',
      sourceOrgName: 'Quest Diagnostics',
      factType: 'lab_value',
      conceptKey: 'hba1c',
      assertion: 'HbA1c 6.8% (Target <7.0%)',
      value: '6.8%',
      clinicalDate: '2026-09-24',
      evidenceQuote: 'HbA1c: 6.8% [H] (Ref: <5.7% Normal, >=6.5% Diabetes)',
      sourcePage: 1,
      verificationStatus: 'unverified'
    },
    {
      id: 'fact-06',
      patientId: 'DEMO-P001',
      documentId: 'doc-04',
      documentTitle: 'Outpatient Medication Reconciliation Record',
      sourceOrgName: 'Memorial Hospital Ambulatory Clinic',
      factType: 'medication',
      conceptKey: 'lisinopril',
      assertion: 'Lisinopril 10mg daily',
      value: '10mg daily PO',
      clinicalDate: '2025-11-04',
      evidenceQuote: 'Lisinopril 10mg PO daily for BP maintenance.',
      sourcePage: 1,
      verificationStatus: 'unverified'
    }
  ];

  // Run discrepancy engine across facts
  const conflicts = detectConflicts(facts);
  // Pre-set the signature penicillin discrepancy with patient affirmation note as in the Stitch reference
  const penicillinConflict = conflicts.find(c => c.conceptKey === 'penicillin');
  if (penicillinConflict) {
    penicillinConflict.patientAffirmation = {
      affirmed: true,
      statement: 'No symptoms upon amoxicillin re-challenge.',
      timestamp: '2026-10-02T14:30:00.000Z'
    };
    penicillinConflict.status = 'patient_affirmed';
  }

  const grants: AccessGrant[] = [
    {
      id: 'grant-sutter-01',
      patientId: 'DEMO-P001',
      patientName: 'Ananya Sharma',
      requestingOrgId: 'org-sutter',
      requestingOrgName: 'Sutter Health Clinical Network',
      requesterName: 'Dr. Marcus Vance',
      requesterTitle: 'Chief of Clinical Medicine',
      purpose: 'Incoming Specialty Consultation & Longitudinal Care Continuity',
      requestedCategories: ['Allergies', 'Medications', 'Lab Reports', 'Consultations'],
      approvedCategories: ['Allergies', 'Medications', 'Lab Reports', 'Consultations'],
      status: 'active',
      requestedAt: '2026-10-01T08:30:00.000Z',
      approvedAt: '2026-10-01T09:15:00.000Z',
      expiresAt: '2026-10-31T23:59:59.000Z',
      accessDurationDays: 30
    },
    {
      id: 'grant-memorial-02',
      patientId: 'DEMO-P001',
      patientName: 'Ananya Sharma',
      requestingOrgId: 'org-memorial',
      requestingOrgName: 'Memorial Hospital Endocrine Clinic',
      requesterName: 'Dr. Elena Rostova',
      requesterTitle: 'Endocrinologist',
      purpose: 'Routine Annual Diabetic Review & Lab Trend Analysis',
      requestedCategories: ['Medications', 'Lab Reports'],
      approvedCategories: ['Medications', 'Lab Reports'],
      status: 'pending',
      requestedAt: '2026-10-14T11:00:00.000Z',
      accessDurationDays: 14
    },
    {
      id: 'grant-northwestern-03',
      patientId: 'DEMO-P001',
      patientName: 'Ananya Sharma',
      requestingOrgId: 'org-memorial',
      requestingOrgName: 'Northwestern Medicine Urgent Care',
      requesterName: 'Dr. Thomas Wu',
      requesterTitle: 'Emergency Physician',
      purpose: 'Urgent Care Encounter (Acute Bronchitis Evaluation)',
      requestedCategories: ['Allergies', 'Medications'],
      approvedCategories: ['Allergies', 'Medications'],
      status: 'expired',
      requestedAt: '2026-08-01T09:00:00.000Z',
      approvedAt: '2026-08-01T09:05:00.000Z',
      expiresAt: '2026-08-08T09:05:00.000Z',
      accessDurationDays: 7
    }
  ];

  const auditLogs: AuditEvent[] = [
    {
      id: 'audit-001',
      timestamp: '2026-01-05T09:15:22.000Z',
      actorName: 'Ananya Sharma',
      actorRole: 'patient',
      organization: 'Patient Portal Ingestion',
      patientId: 'DEMO-P001',
      action: 'DOCUMENT_INGESTED',
      outcome: 'SUCCESS',
      details: 'Discharge Summary (Memorial Hospital) ingested and SHA-256 verified.',
      ipHash: 'ip-72b1...38a'
    },
    {
      id: 'audit-002',
      timestamp: '2026-01-08T11:20:15.000Z',
      actorName: 'Ananya Sharma',
      actorRole: 'patient',
      organization: 'Patient Portal Ingestion',
      patientId: 'DEMO-P001',
      action: 'DOCUMENT_INGESTED',
      outcome: 'SUCCESS',
      details: 'Oral Allergy Challenge Lab (Allergy & Asthma Center) ingested. Contradiction flagged.',
      ipHash: 'ip-72b1...38a'
    },
    {
      id: 'audit-003',
      timestamp: '2026-10-01T08:30:10.000Z',
      actorName: 'Dr. Marcus Vance',
      actorRole: 'clinician',
      organization: 'Sutter Health Clinical Network',
      patientId: 'DEMO-P001',
      action: 'ACCESS_REQUESTED',
      outcome: 'SUCCESS',
      details: 'Requested 30-day access to Allergies, Medications, Lab Reports, Consultations.',
      ipHash: 'ip-198a...902'
    },
    {
      id: 'audit-004',
      timestamp: '2026-10-01T09:15:40.000Z',
      actorName: 'Ananya Sharma',
      actorRole: 'patient',
      organization: 'Patient Consent Gateway',
      patientId: 'DEMO-P001',
      action: 'ACCESS_APPROVED',
      outcome: 'SUCCESS',
      details: 'Patient approved 30-day cryptographic access token for Dr. Marcus Vance (Sutter Health).',
      ipHash: 'ip-72b1...38a'
    },
    {
      id: 'audit-005',
      timestamp: '2026-10-02T10:14:00.000Z',
      actorName: 'Dr. Marcus Vance',
      actorRole: 'clinician',
      organization: 'Sutter Health Clinical Network',
      patientId: 'DEMO-P001',
      action: 'RECORD_ACCESSED',
      outcome: 'SUCCESS',
      details: 'Clinician accessed Unified Longitudinal Timeline via grant-sutter-01.',
      ipHash: 'ip-198a...902'
    }
  ];

  return {
    users,
    organizations,
    patients,
    documents,
    facts,
    conflicts,
    grants,
    auditLogs
  };
}

const DB_FILE_PATH = process.env.MEDILINK_DB_PATH
  ? path.resolve(process.env.MEDILINK_DB_PATH)
  : path.resolve(process.cwd(), 'data', 'medilink_store.json');

function loadPersistedDatabase(): MediLinkDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.patients)) {
        return {
          ...parsed,
          authCredentials: Array.isArray(parsed.authCredentials) ? parsed.authCredentials : [],
          authSessions: Array.isArray(parsed.authSessions) ? parsed.authSessions : []
        };
      }
    }
  } catch (err) {
    console.warn('[MediLink DB] Could not load persisted database, initializing fresh seed:', err);
  }
  const initial = createInitialDatabase();
  persistDatabase(initial);
  return initial;
}

function persistDatabase(data: MediLinkDatabase): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE_PATH);
  } catch (err) {
    console.error('[MediLink DB] Failed to persist database:', err);
  }
}

let db: MediLinkDatabase = usesSupabase() ? createInitialDatabase() : loadPersistedDatabase();

export const getDb = (): MediLinkDatabase => {
  const store = requestStore.getStore();
  if (store) return store.data;
  if (usesSupabase()) throw new Error('Database access requires a request transaction.');
  return db;
};

export const saveDb = (): void => {
  const store = requestStore.getStore();
  if (store) { store.dirty = true; return; }
  if (usesSupabase()) throw new Error('Database writes require a request transaction.');
  persistDatabase(db);
};

export const resetDb = (): MediLinkDatabase => {
  const current = getDb();
  const initial = createInitialDatabase();
  const seededUserIds = new Set(initial.users.map(user => user.id));
  const seededPatientIds = new Set(initial.patients.map(patient => patient.id));
  const registeredUsers = current.users.filter(user => !seededUserIds.has(user.id));
  const registeredPatients = current.patients.filter(patient => !seededPatientIds.has(patient.id));
  const registeredPatientIds = new Set(registeredPatients.map(patient => patient.id));
  const updated = {
    ...initial,
    users: [...initial.users, ...registeredUsers],
    patients: [...initial.patients, ...registeredPatients],
    authCredentials: current.authCredentials ?? [],
    authSessions: (current.authSessions ?? []).filter(session =>
      seededUserIds.has(session.userId) || registeredUsers.some(user => user.id === session.userId)
    ),
    documents: [...initial.documents, ...current.documents.filter(document => registeredPatientIds.has(document.patientId))],
    facts: [...initial.facts, ...current.facts.filter(fact => registeredPatientIds.has(fact.patientId))],
    conflicts: [...initial.conflicts, ...current.conflicts.filter(conflict => registeredPatientIds.has(conflict.patientId))],
    grants: [...initial.grants, ...current.grants.filter(grant => registeredPatientIds.has(grant.patientId))],
    auditLogs: [...initial.auditLogs, ...current.auditLogs.filter(event => event.patientId && registeredPatientIds.has(event.patientId))]
  };
  const store = requestStore.getStore();
  if (store) { store.data = updated; store.dirty = true; }
  else { db = updated; saveDb(); }
  return updated;
};
