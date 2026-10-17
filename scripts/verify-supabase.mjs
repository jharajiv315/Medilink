import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getSupabasePool } from '../src/server/supabaseStore.ts';

const a = process.argv[2];
const b = process.argv[3] || a;
if (!a || !process.env.ADMIN_PASSWORD) throw new Error('Supply API base URLs and ADMIN_PASSWORD.');
const stamp = crypto.randomUUID();
const password = crypto.randomBytes(24).toString('base64url');
const fixtureUsers = [];
const fixturePatients = [];
let adminCookie;
async function request(base, route, cookie, data, expected = 200) {
  const response = await fetch(base + route, { method: data === undefined ? 'GET' : 'POST', headers: { ...(cookie ? { Cookie: cookie } : {}), 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  assert.equal(response.status, expected, `${route}: expected ${expected}, got ${response.status}`);
  return { data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
try {
  assert.equal((await request(a, '/api/health')).data.storage, 'supabase');
  adminCookie = (await request(a, '/api/auth/login', null, { email: 'compliance@medilink.health', password: process.env.ADMIN_PASSWORD })).cookie;
  const registrations = await Promise.all([0, 1].map(index => request(a, '/api/auth/register', null, { name: `Storage verification ${index}`, email: `storage-${stamp}-${index}@example.test`, password, birthDate: '1990-01-01', gender: 'Prefer not to say' }, 201)));
  for (const registration of registrations) { fixtureUsers.push(registration.data.user.id); fixturePatients.push(registration.data.user.patientId); }
  const patient = registrations[0].data.user;
  const patientCookie = registrations[0].cookie;
  assert.equal((await request(b, '/api/auth/me', patientCookie)).data.user.id, patient.id);
  assert.equal((await request(b, '/api/auth/me', registrations[1].cookie)).data.user.id, registrations[1].data.user.id);
  const provision = await request(a, '/api/admin/clinicians', adminCookie, { name: 'Dr. Storage Verification', email: `doctor-${stamp}@example.test`, password, organizationId: 'org-sutter', title: 'Verification clinician' }, 201);
  fixtureUsers.push(provision.data.clinician.id);
  const doctorCookie = (await request(b, '/api/auth/login', null, { email: provision.data.clinician.email, password })).cookie;
  const route = `/api/patients/${patient.patientId}`;
  for (const [index, text] of ['Penicillin allergy with hives', 'Penicillin challenge negative; non-allergic'].entries()) {
    await request(a, route + '/ingest', patientCookie, { title: `Synthetic source ${index}`, rawText: text + stamp, clinicalDate: '2026-10-17', documentType: 'allergy_challenge', sourceOrgName: 'Synthetic Verification Source', extractedItems: [{ factType: 'allergy', conceptKey: 'penicillin', assertion: text, value: text, evidenceQuote: text }] });
  }
  assert.equal((await request(b, route + '/timeline', patientCookie)).data.timeline.length, 4);
  const summary = (await request(b, route + '/summary', patientCookie)).data;
  const requested = await request(b, '/api/clinic/requests', doctorCookie, { patientCode: summary.patient.patientCode, purpose: 'Synthetic persistence verification', requestedCategories: ['Allergies'], durationDays: 7 });
  const grantId = requested.data.grant.id;
  await request(a, `${route}/consents/${grantId}/approve`, patientCookie, { approvedCategories: ['Allergies'], durationDays: 7 });
  const handoff = (await request(b, `/api/clinic/handoff/${grantId}`, doctorCookie)).data;
  assert(handoff.conflicts.length > 0);
  await request(a, `/api/clinic/handoff/${grantId}/reconcile`, doctorCookie, { conflictId: handoff.conflicts[0].id, clinicalResolution: 'Synthetic verification completed', rationale: 'Automated storage test using fictional data.' });
  const reviewed = (await request(b, `/api/clinic/handoff/${grantId}`, doctorCookie)).data;
  assert.equal(reviewed.conflicts[0].status, 'clinician_reconciled');
  await request(b, `${route}/consents/${grantId}/revoke`, patientCookie, { reason: 'Synthetic verification complete' });
  await request(a, `/api/clinic/handoff/${grantId}`, doctorCookie, undefined, 403);
  await request(a, '/api/auth/logout', patientCookie, {});
  await request(b, '/api/auth/me', patientCookie, undefined, 401);
  console.log('PASS: concurrent registrations, provisioned doctor, cross-instance sessions, imports, approval, reconciliation, revocation and logout persist in Supabase.');
} finally {
  // Remove only synthetic fixtures created by THIS invocation, under the same
  // row lock used by the API. Existing accounts, records, and audits stay intact.
  const sql = getSupabasePool();
  try {
    if (fixtureUsers.length) await sql.begin(async transaction => {
      const [row] = await transaction`select payload from medilink.app_state where id = 'primary' for update`;
      const state = row.payload;
      state.users = state.users.filter(item => !fixtureUsers.includes(item.id));
      state.patients = state.patients.filter(item => !fixturePatients.includes(item.id));
      state.authCredentials = state.authCredentials.filter(item => !fixtureUsers.includes(item.userId));
      state.authSessions = state.authSessions.filter(item => !fixtureUsers.includes(item.userId));
      for (const key of ['documents', 'facts', 'conflicts', 'grants']) state[key] = state[key].filter(item => !fixturePatients.includes(item.patientId));
      await transaction`update medilink.app_state set payload = ${transaction.json(state)}, revision = revision + 1, updated_at = now() where id = 'primary'`;
    });
  } finally { await sql.end({ timeout: 2 }); }
}
