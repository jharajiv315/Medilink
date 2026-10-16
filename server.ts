import 'dotenv/config';
import express, { Request, Response } from 'express';
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

const SESSION_SECRET = process.env.SESSION_SECRET || 'medilink-production-hmac-sha256-key-92841';

function signSessionToken(user: UserSession): string {
  const payload = {
    userId: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    patientId: user.patientId,
    organizationId: user.organizationId,
    organization: user.organization,
    title: user.title,
    badgeNumber: user.badgeNumber,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
  return `mlk_${b64Payload}.${hmac}`;
}

function verifySessionToken(token: string): UserSession | null {
  if (!token || !token.startsWith('mlk_')) return null;
  try {
    const raw = token.slice(4);
    const [b64Payload, signature] = raw.split('.');
    if (!b64Payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return {
      id: payload.userId,
      name: payload.name,
      role: payload.role,
      email: payload.email,
      patientId: payload.patientId,
      organizationId: payload.organizationId,
      organization: payload.organization,
      title: payload.title,
      badgeNumber: payload.badgeNumber
    };
  } catch {
    return null;
  }
}

// Session authentication middleware
function authenticateSession(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-medilink-token'] as string);

  if (token) {
    const session = verifySessionToken(token);
    if (session) {
      (req as any).user = session;
      return next();
    }
  }

  // Fallback for seamless demo testing if userId header is provided
  const demoUserId = req.headers['x-medilink-demo-user'] as string;
  if (demoUserId) {
    const db = getDb();
    const user = db.users.find(u => u.id === demoUserId);
    if (user) {
      (req as any).user = user;
      return next();
    }
  }

  // Default to primary demo patient session if in simulation sandbox
  const db = getDb();
  (req as any).user = db.users[0];
  next();
}

app.use(authenticateSession);

// ======================== API ROUTES ========================

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'MediLink Continuity Core', version: '1.0.0' });
});

// 2. Auth & Session
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found in demo directory' });
  }
  const token = signSessionToken(user);
  return res.json({ user, token });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  const db = getDb();
  res.json({ users: db.users });
});

// 3. Reset DB for repeatable demo testing
app.post('/api/db/reset', (_req: Request, res: Response) => {
  resetDb();
  saveDb();
  res.json({ success: true, message: 'Database reset to initial synthetic dataset' });
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
    }
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
    actorName: 'Ananya Sharma',
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
    actorName: 'Ananya Sharma',
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
    actorName: 'Ananya Sharma',
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
  const {
    patientCode,
    requesterName,
    requesterTitle,
    requestingOrgId,
    requestingOrgName,
    purpose,
    requestedCategories,
    durationDays
  } = req.body;

  const db = getDb();
  const patient = db.patients.find(p => p.patientCode === patientCode || p.id === patientCode);
  if (!patient) {
    return res.status(404).json({ error: `No patient found with code "${patientCode}". Try DEMO-P001 or ML-89204.` });
  }

  const grantId = `grant-${Date.now()}`;
  const newGrant: AccessGrant = {
    id: grantId,
    patientId: patient.id,
    patientName: patient.name,
    requestingOrgId: requestingOrgId || 'org-sutter',
    requestingOrgName: requestingOrgName || 'Sutter Health Clinical Network',
    requesterName: requesterName || 'Dr. Marcus Vance',
    requesterTitle: requesterTitle || 'Attending Physician',
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
  const grantsWithStatus = db.grants.map(g => ({
    ...g,
    effectiveStatus: evaluateGrantStatus(g)
  }));

  const activeGrants = grantsWithStatus.filter(g => g.effectiveStatus === 'active');
  const pendingRequests = grantsWithStatus.filter(g => g.effectiveStatus === 'pending');
  const patient1Conflicts = db.conflicts.filter(c => c.status !== 'clinician_reconciled');

  res.json({
    clinician: db.users.find(u => u.role === 'clinician'),
    organization: db.organizations.find(o => o.id === 'org-sutter'),
    activeGrants,
    pendingRequests,
    unresolvedDiscrepanciesCount: patient1Conflicts.length,
    recentPatients: db.patients
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

  const caller: UserSession = (req as any).user || db.users.find(u => u.role === 'clinician') || db.users[1];
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
    actorName: grant.requesterName,
    actorRole: 'clinician',
    organization: grant.requestingOrgName,
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

  if (!grant || evaluateGrantStatus(grant) !== 'active') {
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
    actorName: grant.requesterName,
    actorRole: 'clinician',
    organization: grant.requestingOrgName,
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
  let logs = db.auditLogs;
  if (patientId) {
    logs = logs.filter(l => l.patientId === patientId);
  }
  res.json({ logs });
});

// ======================== SERVER & VITE INTEGRATION ========================

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
