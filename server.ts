import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { getDb, resetDb, saveDb } from './src/server/mockDb.ts';
import {
  detectConflicts,
  mergeConflictsPreservingReviews,
  applyPatientAffirmation,
  applyClinicianReconciliation
} from './src/utils/discrepancyEngine.ts';
import {
  evaluateGrantStatus,
  canAccessCategory,
  filterRecordsByScopes,
  authorizeClinicianHandoffAccess
} from './src/utils/consentEngine.ts';
import type {
  AccessCategory,
  ClinicalDocument,
  MedicalFact,
  AuditEvent,
  AccessGrant,
  UserSession
} from './src/types/medilink.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

app.use(express.json());

// Helper to log audit events
function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'ipHash'>): AuditEvent {
  const db = getDb();
  const newEvent: AuditEvent = {
    ...event,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ipHash: `ip-${crypto.createHash('sha256').update(event.actorName + Date.now()).digest('hex').substring(0, 8)}`
  };
  db.auditLogs.unshift(newEvent);
  saveDb();
  return newEvent;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 12;
const SEED_CREDENTIALS = [
  { userId: 'user-ananya', envKey: 'DEMO_PATIENT_PASSWORD' },
  { userId: 'user-dr-vance', envKey: 'CLINICIAN_PASSWORD' },
  { userId: 'user-auditor', envKey: 'ADMIN_PASSWORD' }
];

function passwordDigest(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function passwordMatches(password: string, credential: { salt: string; passwordHash: string }): boolean {
  const suppliedHash = Buffer.from(passwordDigest(password, credential.salt), 'hex');
  const storedHash = Buffer.from(credential.passwordHash, 'hex');
  return suppliedHash.length === storedHash.length && crypto.timingSafeEqual(suppliedHash, storedHash);
}

function savePassword(user: UserSession, password: string): void {
  const db = getDb();
  const credentials = db.authCredentials ?? (db.authCredentials = []);
  const existing = credentials.find(item => item.userId === user.id);
  if (existing && passwordMatches(password, existing)) return;
  const salt = crypto.randomBytes(16).toString('hex');
  const credential = { userId: user.id, email: user.email.toLowerCase(), salt, passwordHash: passwordDigest(password, salt) };
  const index = credentials.findIndex(item => item.userId === user.id);
  if (index >= 0) credentials[index] = credential;
  else credentials.push(credential);
  db.authSessions = (db.authSessions ?? []).filter(session => session.userId !== user.id);
  saveDb();
}

function provisionConfiguredSeedCredentials(): void {
  for (const { userId, envKey } of SEED_CREDENTIALS) {
    const password = process.env[envKey];
    if (!password) continue;
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`${envKey} must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    }
    const user = getDb().users.find(candidate => candidate.id === userId);
    const credential = getDb().authCredentials?.find(candidate => candidate.userId === userId);
    if (user && (!credential || !passwordMatches(password, credential))) savePassword(user, password);
  }
}

provisionConfiguredSeedCredentials();

function createSession(user: UserSession): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = db.authSessions ?? (db.authSessions = []);
  const now = Date.now();
  db.authSessions = sessions.filter(session => Date.parse(session.expiresAt) > now);
  db.authSessions.push({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString()
  });
  saveDb();
  return token;
}

function resolveSession(token: string): UserSession | null {
  if (!/^[A-Za-z0-9_-]{40,}$/.test(token)) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = getDb().authSessions?.find(candidate => {
    const storedHash = Buffer.from(candidate.tokenHash, 'hex');
    const suppliedHash = Buffer.from(tokenHash, 'hex');
    return storedHash.length === suppliedHash.length && crypto.timingSafeEqual(storedHash, suppliedHash);
  });
  const expiresAt = session ? Date.parse(session.expiresAt) : NaN;
  if (!session || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  return getDb().users.find(user => user.id === session.userId) ?? null;
}

function readSessionToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const cookieHeader = req.headers.cookie || '';
  const sessionCookie = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith('medilink_session='));
  if (!sessionCookie) return undefined;
  try {
    return decodeURIComponent(sessionCookie.slice('medilink_session='.length));
  } catch {
    return undefined;
  }
}

function setSessionCookie(res: Response, token: string, maxAgeSeconds = SESSION_TTL_MS / 1000): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `medilink_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure}`);
}

// Session authentication middleware
function authenticateSession(req: Request, res: Response, next: () => void) {
  if (!req.path.startsWith('/api/')) return next();
  res.setHeader('Cache-Control', 'no-store');
  if (req.path === '/api/health' || req.path === '/api/auth/login' || req.path === '/api/auth/register') return next();

  const token = readSessionToken(req);
  const user = token ? resolveSession(token) : null;
  if (!user) return res.status(401).json({ error: 'Sign in is required.' });
  (req as any).user = user;
  next();
}

app.use(authenticateSession);

function getRequestUser(req: Request): UserSession {
  return (req as any).user as UserSession;
}

function allowRoles(req: Request, res: Response, roles: UserSession['role'][]): boolean {
  if (!roles.includes(getRequestUser(req).role)) {
    res.status(403).json({ error: 'You do not have permission to perform this action.' });
    return false;
  }
  return true;
}

function canAccessGrant(user: UserSession, grant: AccessGrant): boolean {
  if (user.role === 'admin') return true;
  if (user.role !== 'clinician') return false;
  return grant.requesterUserId === user.id || Boolean(user.organizationId && grant.requestingOrgId === user.organizationId);
}

// ======================== API ROUTES ========================

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'MediLink Continuity Core', version: '1.0.0' });
});

// 2. Auth & Session
app.post('/api/auth/login', (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const db = getDb();
  const credential = db.authCredentials?.find(item => item.email === email);
  const user = credential && db.users.find(item => item.id === credential.userId);
  if (!credential || !user || !password) return res.status(401).json({ error: 'Email or password is incorrect.' });
  if (!passwordMatches(password, credential)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const token = createSession(user);
  setSessionCookie(res, token);
  return res.json({ user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const birthDate = typeof req.body.birthDate === 'string' ? req.body.birthDate : '';
  const gender = typeof req.body.gender === 'string' ? req.body.gender.trim() : '';
  const parsedBirthDate = Date.parse(birthDate);

  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Enter your name (2 to 100 characters).' });
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < PASSWORD_MIN_LENGTH || password.length > 256) {
    return res.status(400).json({ error: `Use a password between ${PASSWORD_MIN_LENGTH} and 256 characters.` });
  }
  if (!birthDate || !Number.isFinite(parsedBirthDate) || parsedBirthDate > Date.now()) {
    return res.status(400).json({ error: 'Enter a valid date of birth.' });
  }
  if (!gender || gender.length > 40) return res.status(400).json({ error: 'Select or enter a gender value.' });

  const db = getDb();
  if (db.users.some(user => user.email.toLowerCase() === email)) {
    return res.status(409).json({ error: 'Unable to create an account with those details. Sign in or contact support.' });
  }

  let patientCode: string;
  do {
    patientCode = `ML-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  } while (db.patients.some(patient => patient.patientCode === patientCode));

  const patientId = `patient-${crypto.randomUUID()}`;
  const user: UserSession = {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    role: 'patient',
    patientId
  };
  db.users.push(user);
  db.patients.push({
    id: patientId,
    patientCode,
    name,
    birthDate: new Date(parsedBirthDate).toISOString().slice(0, 10),
    gender,
    mrn: 'Not provided',
    bloodType: 'Not provided',
    conditions: [],
    allergiesSummary: 'Not provided',
    primaryCarePhysician: 'Not provided'
  });
  savePassword(user, password);
  const token = createSession(user);
  setSessionCookie(res, token);
  return res.status(201).json({ user });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({ user: getRequestUser(req) });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = readSessionToken(req);
  if (token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDb();
    db.authSessions = (db.authSessions ?? []).filter(session => session.tokenHash !== hash);
    saveDb();
  }
  setSessionCookie(res, '', 0);
  res.json({ success: true });
});

// 3. Reset DB for repeatable demo testing
app.post('/api/db/reset', (req: Request, res: Response) => {
  if (!allowRoles(req, res, ['admin'])) return;
  resetDb();
  saveDb();
  res.json({ success: true, message: 'Synthetic demo data has been reset. Registered patient accounts were preserved.' });
});

app.use('/api/patients/:patientId', (req: Request, res: Response, next: () => void) => {
  const user = getRequestUser(req);
  if (user.role !== 'patient' || user.patientId !== req.params.patientId) {
    return res.status(403).json({ error: 'You can only access your own patient record.' });
  }
  next();
});

app.use('/api/clinic', (req: Request, res: Response, next: () => void) => {
  if (!allowRoles(req, res, ['clinician', 'admin'])) return;
  next();
});

// 4. Patient Summary & Metrics
app.get('/api/patients/:patientId/summary', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const db = getDb();
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const patientDocs = db.documents.filter(d => d.patientId === patientId);
  const patientFacts = db.facts.filter(f => f.patientId === patientId);
  const patientConflicts = db.conflicts.filter(c => c.patientId === patientId);
  const activeGrants = db.grants.filter(g => g.patientId === patientId && evaluateGrantStatus(g) === 'active');
  const pendingGrants = db.grants.filter(g => g.patientId === patientId && g.status === 'pending');
  const recentEvents = [
    ...patientDocs.map(document => ({
      id: document.id,
      title: document.title,
      description: document.rawTextExcerpt,
      date: document.clinicalDate,
      source: document.sourceOrganizationName,
      category: mapDocTypeToCategory(document.documentType),
      hash: document.sha256Hash
    })),
    ...patientFacts.map(fact => ({
      id: fact.id,
      title: fact.assertion,
      description: fact.value,
      date: fact.clinicalDate,
      source: fact.sourceOrgName,
      category: mapFactTypeToCategory(fact.factType),
      hash: undefined
    }))
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 4);

  const uniqueOrgs = new Set([
    ...patientDocs.map(d => d.sourceOrganizationName),
    ...patientFacts.map(f => f.sourceOrgName)
  ]);

  const consultationsCount = patientDocs.filter(d => d.documentType === 'specialty_consult' || d.documentType === 'discharge_summary' || d.documentType === 'allergy_challenge').length;
  const labsCount = patientDocs.filter(d => d.documentType === 'lab_report').length + patientFacts.filter(f => f.factType === 'lab_value').length;
  const flaggedDiscrepanciesCount = patientConflicts.filter(c => c.status !== 'clinician_reconciled').length;

  res.json({
    patient,
    metrics: {
      connectedHealthSystems: uniqueOrgs.size,
      consultationsCount,
      labsCount,
      flaggedDiscrepanciesCount,
      activeGrantsCount: activeGrants.length,
      pendingGrantsCount: pendingGrants.length,
      totalDocuments: patientDocs.length,
      totalExtractedFacts: patientFacts.length
    },
    activeGrants,
    pendingGrants,
    recentEvents
  });
});

// 5. Patient Unified Timeline (Chronological History)
app.get('/api/patients/:patientId/timeline', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const db = getDb();
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const patientDocs = db.documents.filter(d => d.patientId === patientId);
  const patientFacts = db.facts.filter(f => f.patientId === patientId);
  const patientConflicts = db.conflicts.filter(c => c.patientId === patientId);

  // Group facts and documents into a clean chronological stream
  const timelineItems = [
    ...patientDocs.map(doc => ({
      itemType: 'document' as const,
      id: doc.id,
      title: doc.title,
      clinicalDate: doc.clinicalDate,
      category: mapDocTypeToCategory(doc.documentType),
      sourceOrg: doc.sourceOrganizationName,
      documentRef: doc.fileName,
      sha256Hash: doc.sha256Hash,
      details: doc.rawTextExcerpt,
      status: doc.status
    })),
    ...patientFacts.map(fact => ({
      itemType: 'fact' as const,
      id: fact.id,
      title: fact.assertion,
      clinicalDate: fact.clinicalDate,
      category: mapFactTypeToCategory(fact.factType),
      sourceOrg: fact.sourceOrgName,
      documentRef: fact.documentTitle,
      details: fact.value,
      evidenceQuote: fact.evidenceQuote,
      verificationStatus: fact.verificationStatus
    }))
  ].sort((a, b) => new Date(b.clinicalDate).getTime() - new Date(a.clinicalDate).getTime());

  res.json({
    patient,
    timeline: timelineItems,
    conflicts: patientConflicts
  });
});

// Helper mapping
function mapDocTypeToCategory(type: string): AccessCategory {
  if (type === 'discharge_summary') return 'Consultations';
  if (type === 'prescription_order') return 'Medications';
  if (type === 'lab_report') return 'Lab Reports';
  if (type === 'allergy_challenge') return 'Allergies';
  return 'Consultations';
}

function mapFactTypeToCategory(type: string): AccessCategory {
  if (type === 'allergy') return 'Allergies';
  if (type === 'medication') return 'Medications';
  if (type === 'lab_value') return 'Lab Reports';
  return 'Consultations';
}

// 6. Ingest New Medical Record
app.post('/api/patients/:patientId/ingest', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const {
    title,
    documentType,
    sourceOrgId,
    sourceOrgName,
    clinicalDate,
    rawText,
    fileName,
    extractedItems
  } = req.body;

  const db = getDb();
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const docId = `doc-${Date.now()}`;
  const sha256Hash = crypto.createHash('sha256').update(rawText).digest('hex');

  // Verify document deduplication via content hash
  const existingDoc = db.documents.find(d => d.patientId === patientId && d.sha256Hash === sha256Hash);
  if (existingDoc) {
    return res.status(409).json({
      error: 'DUPLICATE_DOCUMENT',
      message: `Document "${existingDoc.title}" with identical cryptographic digest (${sha256Hash.substring(0, 8)}...) has already been ingested.`,
      document: existingDoc
    });
  }

  const newDoc: ClinicalDocument = {
    id: docId,
    patientId,
    sourceOrganizationId: sourceOrgId || 'org-custom',
    sourceOrganizationName: sourceOrgName || 'Integrated Health Network',
    documentType: documentType || 'specialty_consult',
    title: title || 'Clinical Document',
    clinicalDate: clinicalDate || new Date().toISOString().split('T')[0],
    uploadedAt: new Date().toISOString(),
    fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
    fileSize: `${Math.floor(rawText.length / 10 + 120)} KB`,
    sha256Hash,
    rawTextExcerpt: rawText,
    status: 'indexed'
  };

  db.documents.push(newDoc);

  // Ingest facts
  const newFacts: MedicalFact[] = [];
  if (Array.isArray(extractedItems) && extractedItems.length > 0) {
    for (const item of extractedItems) {
      const factId = `fact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const fact: MedicalFact = {
        id: factId,
        patientId,
        documentId: docId,
        documentTitle: newDoc.title,
        sourceOrgName: newDoc.sourceOrganizationName,
        factType: item.factType || 'encounter',
        conceptKey: item.conceptKey || 'general',
        assertion: item.assertion || item.value,
        value: item.value,
        clinicalDate: newDoc.clinicalDate,
        evidenceQuote: item.evidenceQuote || rawText.substring(0, 100),
        verificationStatus: 'unverified'
      };
      db.facts.push(fact);
      newFacts.push(fact);
    }
  }

  // Re-run discrepancy detection while strictly preserving prior clinician reconciliations
  const patientFacts = db.facts.filter(f => f.patientId === patientId);
  const freshConflicts = detectConflicts(patientFacts);
  const preservedConflicts = mergeConflictsPreservingReviews(
    db.conflicts.filter(c => c.patientId === patientId),
    freshConflicts
  );

  db.conflicts = [
    ...db.conflicts.filter(c => c.patientId !== patientId),
    ...preservedConflicts
  ];

  logAuditEvent({
    actorName: patient.name,
    actorRole: 'patient',
    organization: newDoc.sourceOrganizationName,
    patientId,
    action: 'DOCUMENT_INGESTED',
    outcome: 'SUCCESS',
    details: `Ingested ${newDoc.title} (${newDoc.fileName}) with ${newFacts.length} clinical facts.`
  });

  saveDb();

  res.json({
    document: newDoc,
    factsExtracted: newFacts,
    conflicts: db.conflicts.filter(c => c.patientId === patientId)
  });
});

// 7. Patient Discrepancies & Affirmation
app.get('/api/patients/:patientId/conflicts', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const db = getDb();
  const conflicts = db.conflicts.filter(c => c.patientId === patientId);
  res.json({ conflicts });
});

app.post('/api/patients/:patientId/conflicts/:conflictId/affirm', (req: Request, res: Response) => {
  const { patientId, conflictId } = req.params;
  const { affirmationStatement } = req.body;
  const db = getDb();
  const conflict = db.conflicts.find(c => c.id === conflictId && c.patientId === patientId);
  if (!conflict) {
    return res.status(404).json({ error: 'Conflict not found' });
  }

  const updated = applyPatientAffirmation(conflict, affirmationStatement || 'Patient clarified symptoms.');
  const index = db.conflicts.findIndex(c => c.id === conflictId);
  db.conflicts[index] = updated;

  logAuditEvent({
    actorName: getRequestUser(req).name,
    actorRole: 'patient',
    organization: 'Patient Record Continuity',
    patientId,
    action: 'CLINICAL_REVIEW_RECORDED',
    outcome: 'SUCCESS',
    details: `Patient affirmation recorded on ${conflict.title}: "${affirmationStatement}"`
  });

  saveDb();

  res.json({ conflict: updated });
});

// 8. Consent & Access Grants
app.get('/api/patients/:patientId/consents', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const db = getDb();
  const patientGrants = db.grants.filter(g => g.patientId === patientId).map(g => ({
    ...g,
    effectiveStatus: evaluateGrantStatus(g)
  }));
  res.json({ grants: patientGrants });
});

app.post('/api/patients/:patientId/consents/:grantId/approve', (req: Request, res: Response) => {
  const { patientId, grantId } = req.params;
  const { approvedCategories, durationDays, durationMinutes } = req.body;
  const db = getDb();
  const grant = db.grants.find(g => g.id === grantId && g.patientId === patientId);
  if (!grant) {
    return res.status(404).json({ error: 'Grant request not found' });
  }

  let expiresAt: string;
  let durationDesc: string;
  if (durationMinutes && typeof durationMinutes === 'number') {
    expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    durationDesc = `${durationMinutes}-minute`;
  } else {
    const days = durationDays || grant.accessDurationDays || 30;
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    durationDesc = `${days}-day`;
  }

  grant.status = 'active';
  grant.approvedCategories = approvedCategories || grant.requestedCategories;
  grant.approvedAt = new Date().toISOString();
  grant.expiresAt = expiresAt;

  logAuditEvent({
    actorName: getRequestUser(req).name,
    actorRole: 'patient',
    organization: 'Patient Consent Gateway',
    patientId,
    action: 'ACCESS_APPROVED',
    outcome: 'SUCCESS',
    details: `Approved ${durationDesc} access for ${grant.requesterName} (${grant.requestingOrgName}) for scopes: ${grant.approvedCategories.join(', ')}`
  });

  saveDb();

  res.json({ grant, effectiveStatus: 'active' });
});

app.post('/api/patients/:patientId/consents/:grantId/revoke', (req: Request, res: Response) => {
  const { patientId, grantId } = req.params;
  const { reason } = req.body;
  const db = getDb();
  const grant = db.grants.find(g => g.id === grantId && g.patientId === patientId);
  if (!grant) {
    return res.status(404).json({ error: 'Grant not found' });
  }

  grant.status = 'revoked';
  grant.revokedAt = new Date().toISOString();
  grant.revocationReason = reason || 'Patient revoked authorization.';

  logAuditEvent({
    actorName: getRequestUser(req).name,
    actorRole: 'patient',
    organization: 'Patient Consent Gateway',
    patientId,
    action: 'ACCESS_REVOKED',
    outcome: 'SUCCESS',
    details: `Revoked access grant for ${grant.requesterName} (${grant.requestingOrgName}). Reason: ${grant.revocationReason}`
  });

  saveDb();

  res.json({ grant, effectiveStatus: 'revoked' });
});

// 9. Clinician Access Requests
app.post('/api/clinic/requests', (req: Request, res: Response) => {
  const { patientCode, purpose, requestedCategories, durationDays } = req.body;
  const clinician = getRequestUser(req);

  const db = getDb();
  const patient = db.patients.find(p => p.patientCode === patientCode || p.id === patientCode);
  if (!patient) {
    return res.status(404).json({ error: 'No patient was found for that patient code.' });
  }

  const grantId = `grant-${Date.now()}`;
  const newGrant: AccessGrant = {
    id: grantId,
    requesterUserId: clinician.id,
    patientId: patient.id,
    patientName: patient.name,
    requestingOrgId: clinician.organizationId || '',
    requestingOrgName: clinician.organization || '',
    requesterName: clinician.name,
    requesterTitle: clinician.title || 'Attending Physician',
    purpose: purpose || 'Specialty Clinical Consultation',
    requestedCategories: requestedCategories || ['Allergies', 'Medications', 'Lab Reports'],
    approvedCategories: [],
    status: 'pending',
    requestedAt: new Date().toISOString(),
    accessDurationDays: durationDays || 30
  };

  db.grants.push(newGrant);

  logAuditEvent({
    actorName: newGrant.requesterName,
    actorRole: 'clinician',
    organization: newGrant.requestingOrgName,
    patientId: patient.id,
    action: 'ACCESS_REQUESTED',
    outcome: 'SUCCESS',
    details: `Clinician submitted access request for ${patient.name} (${patient.patientCode}) for scopes: ${newGrant.requestedCategories.join(', ')}`
  });

  saveDb();

  res.json({ grant: newGrant });
});

// 10. Clinician Dashboard Data
app.get('/api/clinic/dashboard', (_req: Request, res: Response) => {
  const db = getDb();
  const clinician = getRequestUser(_req);
  const grantsWithStatus = db.grants.map(g => ({
    ...g,
    effectiveStatus: evaluateGrantStatus(g)
  })).filter(grant => canAccessGrant(clinician, grant));

  const activeGrants = grantsWithStatus.filter(g => g.effectiveStatus === 'active');
  const pendingRequests = grantsWithStatus.filter(g => g.effectiveStatus === 'pending');
  const visiblePatientIds = new Set(activeGrants.map(grant => grant.patientId));
  const visiblePatients = db.patients.filter(patient => visiblePatientIds.has(patient.id));
  const visibleConflicts = db.conflicts.filter(conflict => visiblePatientIds.has(conflict.patientId));

  res.json({
    clinician,
    organization: db.organizations.find(o => o.id === clinician.organizationId),
    activeGrants,
    pendingRequests,
    unresolvedDiscrepanciesCount: visibleConflicts.filter(c => c.status !== 'clinician_reconciled').length,
    recentPatients: visiblePatients
  });
});

// 11. CLINICAL HANDOFF WORKSPACE (PROTECTED RBAC & ACL ENGINE)
app.get('/api/clinic/handoff/:grantId', (req: Request, res: Response) => {
  const { grantId } = req.params;
  const db = getDb();
  const grant = db.grants.find(g => g.id === grantId);

  if (!grant) {
    return res.status(404).json({ error: 'Access grant not found' });
  }

  const caller = getRequestUser(req);
  if (!canAccessGrant(caller, grant)) {
    return res.status(403).json({ error: 'This clinical grant is not assigned to your account or organization.' });
  }
  const authCheck = authorizeClinicianHandoffAccess(grant, {
    userId: caller.id,
    role: caller.role,
    organizationId: caller.organizationId,
    organizationName: caller.organization,
    patientId: caller.patientId
  });

  if (!authCheck.authorized) {
    logAuditEvent({
      actorName: caller.name || grant.requesterName || 'Clinician',
      actorRole: (caller.role as any) || 'clinician',
      organization: caller.organization || grant.requestingOrgName,
      patientId: grant.patientId,
      action: 'ACCESS_DENIED',
      outcome: 'DENIED',
      details: `Attempted handoff retrieval blocked: ${authCheck.message}`
    });

    return res.status(authCheck.httpStatus).json({
      error: authCheck.errorCode,
      status: evaluateGrantStatus(grant),
      message: authCheck.message
    });
  }

  const patient = db.patients.find(p => p.id === grant.patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Filter clinical documents & facts by approvedCategories
  const allDocs = db.documents.filter(d => d.patientId === patient.id);
  const allFacts = db.facts.filter(f => f.patientId === patient.id);

  // Transform into categories
  const mappedDocs = allDocs.map(d => ({ ...d, category: mapDocTypeToCategory(d.documentType) }));
  const mappedFacts = allFacts.map(f => ({ ...f, category: mapFactTypeToCategory(f.factType) }));

  const docsResult = filterRecordsByScopes(mappedDocs, grant);
  const factsResult = filterRecordsByScopes(mappedFacts, grant);

  // Conflicts: only include if category permitted
  const allConflicts = db.conflicts.filter(c => c.patientId === patient.id);
  const allowedConflicts = allConflicts.filter(c => {
    if (c.conceptKey === 'penicillin' && grant.approvedCategories.includes('Allergies')) return true;
    if (c.conceptKey === 'metformin' && grant.approvedCategories.includes('Medications')) return true;
    return false;
  });

  logAuditEvent({
    actorName: caller.name,
    actorRole: 'clinician',
    organization: caller.organization || grant.requestingOrgName,
    patientId: patient.id,
    action: 'RECORD_ACCESSED',
    outcome: 'SUCCESS',
    details: `Clinician opened Clinical Handoff via grant ${grant.id}. Scopes authorized: ${grant.approvedCategories.join(', ')}`
  });

  res.json({
    grant,
    patient,
    approvedCategories: grant.approvedCategories,
    documents: docsResult.allowedRecords,
    facts: factsResult.allowedRecords,
    conflicts: allowedConflicts,
    filteredStats: {
      docsGranted: docsResult.allowedRecords.length,
      docsRestricted: docsResult.deniedCount,
      factsGranted: factsResult.allowedRecords.length,
      factsRestricted: factsResult.deniedCount
    }
  });
});

// 12. Clinician Reconciliation Action
app.post('/api/clinic/handoff/:grantId/reconcile', (req: Request, res: Response) => {
  const { grantId } = req.params;
  const { conflictId, clinicalResolution, rationale } = req.body;
  const db = getDb();
  const grant = db.grants.find(g => g.id === grantId);

  if (!grant || !canAccessGrant(getRequestUser(req), grant) || evaluateGrantStatus(grant) !== 'active') {
    return res.status(403).json({ error: 'Access Denied: Grant is not active' });
  }

  const conflict = db.conflicts.find(c => c.id === conflictId && c.patientId === grant.patientId);
  if (!conflict) {
    return res.status(404).json({ error: 'Conflict not found' });
  }

  const reconciled = applyClinicianReconciliation(
    conflict,
    {
      name: grant.requesterName,
      role: grant.requesterTitle || 'Attending Physician',
      org: grant.requestingOrgName
    },
    clinicalResolution || 'Reconciled upon direct clinical review and negative challenge.',
    rationale || 'Patient confirmed negative challenge without adverse reaction.'
  );

  const idx = db.conflicts.findIndex(c => c.id === conflictId);
  db.conflicts[idx] = reconciled;

  // Add verified clinical reconciliation fact
  const reconciledFact: MedicalFact = {
    id: `fact-reconciled-${Date.now()}`,
    patientId: grant.patientId,
    documentId: 'doc-reconciliation',
    documentTitle: `Clinician Reconciliation — ${reconciled.title}`,
    sourceOrgName: grant.requestingOrgName,
    factType: conflict.conceptKey === 'penicillin' ? 'allergy' : 'medication',
    conceptKey: conflict.conceptKey,
    assertion: clinicalResolution || `Reconciled: ${conflict.title}`,
    value: clinicalResolution || 'Verified',
    clinicalDate: new Date().toISOString().split('T')[0],
    evidenceQuote: `Clinician note: ${rationale} (Signed by ${grant.requesterName}, ${grant.requestingOrgName})`,
    verificationStatus: 'clinician_reconciled'
  };
  db.facts.unshift(reconciledFact);

  logAuditEvent({
    actorName: getRequestUser(req).name,
    actorRole: 'clinician',
    organization: getRequestUser(req).organization || grant.requestingOrgName,
    patientId: grant.patientId,
    action: 'CLINICAL_REVIEW_RECORDED',
    outcome: 'SUCCESS',
    details: `Clinician marked ${conflict.title} as Reconciled: "${clinicalResolution}"`
  });

  saveDb();

  res.json({ success: true, conflict: reconciled, newFact: reconciledFact });
});

// 13. Audit Log Access
app.get('/api/audit', (req: Request, res: Response) => {
  const { patientId } = req.query;
  const db = getDb();
  const user = getRequestUser(req);
  let logs = db.auditLogs;
  if (user.role === 'patient') {
    if (patientId && patientId !== user.patientId) return res.status(403).json({ error: 'You can only view your own audit history.' });
    logs = logs.filter(log => log.patientId === user.patientId);
  } else if (user.role === 'clinician') {
    return res.status(403).json({ error: 'Audit history is not available to clinician accounts.' });
  } else if (patientId) {
    logs = logs.filter(log => log.patientId === patientId);
  }
  res.json({ logs });
});

// ======================== SERVER & VITE INTEGRATION ========================

// The development server serves the app from the project root. Keep the
// persisted JSON database out of Vite's static file handling.
app.use('/data', (_req: Request, res: Response) => {
  res.status(404).end();
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MediLink Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
