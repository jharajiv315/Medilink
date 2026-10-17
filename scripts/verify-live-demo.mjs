// Explicit integration command; deliberately excluded from unit-test discovery.
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { getSupabasePool } from '../src/server/supabaseStore.ts';

const base = process.argv[2];
if (!base || !process.env.CLINICIAN_PASSWORD || !process.env.SUPABASE_DATABASE_URL) throw new Error('Supply the test deployment URL and server-only verification environment.');
const artifacts = '.artifacts/live-demo';
fs.mkdirSync(artifacts, { recursive: true });
const stamp = crypto.randomUUID();
const email = `demo-loop-${stamp}@example.test`;
const password = crypto.randomBytes(24).toString('base64url');
const browser = await chromium.launch();
const patient = await browser.newContext({ viewport: { width: 390, height: 844 } });
const doctor = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const pt = await patient.newPage();
const dr = await doctor.newPage();
const errors = [];
for (const page of [pt, dr]) page.on('pageerror', error => errors.push(error.message));
let user;
const steps = [];
const check = (name, details = '') => { steps.push({ name, status: 'passed', details }); console.log('PASS: ' + name); };
const screenshot = async (page, name) => {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, name + ' horizontal overflow');
  return page.screenshot({ path: `${artifacts}/${name}.png` });
};
async function json(context, route, data, status = 200) {
  const response = data === undefined ? await context.request.get(base + route) : await context.request.post(base + route, { data });
  assert.equal(response.status(), status, route);
  return response.json();
}
async function login(page, path, account, secret) {
  await page.goto(base + path);
  await page.getByLabel('Email address', { exact: true }).fill(account);
  await page.getByLabel('Password', { exact: true }).fill(secret);
  await page.locator('button[type=submit]').click();
  await page.getByRole('heading', { level: 1, name: /Import Clinical Records|Welcome back/ }).waitFor();
}
async function requestGrant() {
  const summary = await json(patient, `/api/patients/${user.patientId}/summary`);
  return (await json(doctor, '/api/clinic/requests', { patientCode: summary.patient.patientCode, purpose: 'Synthetic six-step demo verification', requestedCategories: ['Allergies', 'Medications', 'Lab Reports', 'Consultations'], durationDays: 7 })).grant;
}
async function approve(grant, minutes) {
  await pt.goto(base + '/patient/consents');
  await pt.getByRole('button', { name: /pending grants|pending requests/i }).click();
  await pt.getByRole('button', { name: /^(Review & Approve|Approve)$/ }).last().click();
  const dialog = pt.getByRole('dialog', { name: 'Review sharing request' });
  for (const category of ['Medications', 'Lab Reports', 'Consultations']) await dialog.getByLabel(category, { exact: true }).uncheck();
  await dialog.getByRole('button', { name: new RegExp(`${minutes} Minutes`) }).click();
  const response = pt.waitForResponse(r => r.url().endsWith(`/consents/${grant.id}/approve`) && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Sign & Grant Access', exact: true }).click();
  const result = await (await response).json();
  await pt.getByRole('dialog', { name: 'Share handoff link' }).waitFor();
  return result.grant;
}
try {
  user = (await json(patient, '/api/auth/register', { name: 'Synthetic Demo Rehearsal', email, password, birthDate: '1990-01-01', gender: 'Prefer not to say' }, 201)).user;
  console.log('SETUP: isolated patient registered');
  await json(patient, '/api/auth/logout', {});
  await login(pt, '/patient/import', email, password);
  console.log('SETUP: mobile patient signed in');
  await login(dr, '/clinic/dashboard', 'm.vance@sutterhealth.org', process.env.CLINICIAN_PASSWORD);
  console.log('SETUP: desktop doctor signed in');
  await json(patient, '/api/clinic/dashboard', undefined, 403);
  await json(patient, '/api/auth/login', { email, password: 'deliberately-incorrect-password' }, 401);
  for (const name of ['Hospital A: Discharge Record', 'Clinic B: Negative Challenge']) {
    console.log('IMPORT: ' + name);
    await pt.getByRole('button', { name: new RegExp(name) }).click();
    const invalid = await pt.locator('form').evaluate(form => Array.from(form.elements).filter(input => input.validity && !input.validity.valid).map(input => ({ name: input.getAttribute('aria-label'), message: input.validationMessage })));
    assert.deepEqual(invalid, []);
    await screenshot(pt, 'import-filled');
    const [imported] = await Promise.all([pt.waitForResponse(r => r.url().endsWith('/ingest') && r.request().method() === 'POST'), pt.getByRole('button', { name: /^Ingest & Run Discrepancy Check/ }).click()]);
    assert.equal(imported.status(), 200);
  }
  const route = `/api/patients/${user.patientId}`;
  const timeline = await json(patient, route + '/timeline');
  assert.equal(timeline.timeline.filter(item => item.itemType === 'document').length, 2);
  for (const item of timeline.timeline) assert.match(item.sha256Hash, /^[a-f0-9]{64}$/);
  const original = timeline.timeline.find(item => item.itemType === 'document');
  assert.equal(crypto.createHash('sha256').update(original.details).digest('hex'), original.sha256Hash);
  await json(patient, route + '/ingest', { title: original.title, rawText: original.details, documentType: 'allergy_challenge' }, 409);
  await pt.goto(base + '/patient/history');
  await pt.getByRole('heading', { name: /^Medical History(?: Timeline)?$/ }).waitFor();
  await screenshot(pt, '01-source-timeline-mobile');
  check('1. Hospital A and Clinic B import with real source fingerprints');
  const conflict = (await json(patient, route + '/conflicts')).conflicts.find(item => item.conceptKey === 'penicillin');
  assert(conflict);
  await pt.goto(base + '/patient/conflicts');
  await pt.getByRole('heading', { level: 1 }).waitFor();
  const note = pt.getByPlaceholder('Enter your symptom confirmation or recollection...').first();
  await note.fill('Synthetic rehearsal: no symptoms on the documented re-challenge.');
  await pt.getByRole('button', { name: 'Affirm for Clinician', exact: true }).first().click();
  await pt.getByText('Patient Affirmed', { exact: true }).first().waitFor();
  await screenshot(pt, '02-discrepancy-mobile');
  check('2. Evidence-linked discrepancy and patient affirmation');
  const grant = await requestGrant();
  await approve(grant, 15);
  const image = pt.getByRole('img', { name: 'QR code for the doctor handoff link' });
  await image.waitFor();
  const pixels = await image.evaluate(async img => { await img.decode(); const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0); return { width: canvas.width, height: canvas.height, data: Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data) }; });
  const decoded = jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height);
  assert.equal(decoded?.data, `${base}/clinic/handoff/${grant.id}`);
  await screenshot(pt, '03-qr-mobile');
  await pt.getByRole('button', { name: 'Done', exact: true }).click();
  check('3. Allergies-only consent and scannable locally generated QR');
  const handoff = await json(doctor, `/api/clinic/handoff/${grant.id}`);
  assert.equal(handoff.patient.conditions, undefined);
  assert.equal(handoff.patient.primaryCarePhysician, undefined);
  assert(handoff.facts.every(item => item.category === 'Allergies'));
  assert(handoff.documents.every(item => item.category === 'Allergies'));
  await dr.goto(decoded.data);
  await dr.getByRole('heading', { name: user.name, exact: true }).waitFor();
  await dr.getByText('Not available (Excluded from grant)', { exact: true }).waitFor();
  await dr.getByRole('textbox', { name: /Clinical determination for/ }).first().fill('Synthetic review: the source discrepancy has been reviewed.');
  await dr.getByRole('textbox', { name: /Rationale for/ }).first().fill('Synthetic demonstration only; both original source statements were inspected.');
  await dr.getByRole('button', { name: 'Sign & Mark Reconciled', exact: true }).first().click();
  await dr.getByText('Reconciled & Signed', { exact: true }).first().waitFor();
  await screenshot(dr, '04-reconciled-desktop');
  await dr.reload();
  await dr.getByText('Reconciled & Signed', { exact: true }).first().waitFor();
  check('4. Authenticated doctor handoff, payload-level scope enforcement, persisted reconciliation');
  const updated = await json(patient, route + '/timeline');
  assert(updated.timeline.some(item => item.title.includes('Synthetic review')));
  await pt.goto(base + '/patient/access-history');
  await pt.getByRole('heading', { name: 'Transparent Access & Audit Trail' }).waitFor();
  const audit = (await json(patient, '/api/audit')).logs;
  for (const action of ['ACCESS_APPROVED', 'RECORD_ACCESSED', 'CLINICAL_REVIEW_RECORDED']) {
    const event = audit.find(item => item.action === action);
    assert(event); assert.match(event.sha256Hash, /^[a-f0-9]{64}$/);
    const { sha256Hash, ...original } = event;
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(original, Object.keys(original).sort())).digest('hex'), sha256Hash);
  }
  await screenshot(pt, '05-audit-mobile');
  check('5. Patient timeline, audit actions, timestamps and verified event fingerprints');
  await pt.goto(base + '/patient/consents');
  const activeTab = pt.getByRole('button', { name: /^Active Access/ });
  if (await activeTab.count()) await activeTab.click();
  await pt.getByRole('button', { name: /^Revoke Access(?: Immediately)?$/ }).last().click();
  await pt.getByRole('button', { name: 'Confirm revocation', exact: true }).click();
  await pt.getByRole('dialog').waitFor({ state: 'detached' });
  await dr.reload();
  await dr.getByRole('heading', { name: 'Clinical Access Terminated by Patient' }).waitFor();
  await screenshot(dr, '06-revoked-desktop');
  await json(doctor, `/api/clinic/handoff/${grant.id}`, undefined, 403);
  assert((await json(patient, '/api/audit')).logs.some(item => item.action === 'ACCESS_DENIED' && item.outcome === 'DENIED'));
  check('6. Immediate revocation, dedicated 403 screen and denied-access audit event');
  if (process.env.SKIP_EXPIRY_WAIT !== '1') {
    const expiryGrant = await requestGrant();
    const approved = await approve(expiryGrant, 2);
    await dr.goto(base + '/clinic/handoff/' + expiryGrant.id);
    await dr.getByRole('heading', { name: user.name, exact: true }).waitFor();
    console.log('WAIT: exercising the real 2-minute expiry boundary');
    await new Promise(resolve => setTimeout(resolve, Math.max(0, Date.parse(approved.expiresAt) - Date.now() + 300)));
    await json(doctor, `/api/clinic/handoff/${expiryGrant.id}`, undefined, 403);
    await dr.reload();
    await dr.getByRole('heading', { name: 'Clinical Access Has Expired' }).waitFor();
    await screenshot(dr, '07-expired-desktop');
    check('7. Actual two-minute expiry and dedicated expired-access screen');
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${artifacts}/results.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), viewports: ['390x844', '1440x1000'], steps, pageErrors: errors }, null, 2));
  console.log('PASS: all requested live demonstration checks completed');
} catch (error) {
  await screenshot(pt, 'failure-patient').catch(() => {});
  await screenshot(dr, 'failure-doctor').catch(() => {});
  throw error;
} finally {
  await browser.close();
  const sql = getSupabasePool();
  try {
    if (user) await sql.begin(async tx => {
      const [row] = await tx`select payload from medilink.app_state where id = 'primary' for update`;
      const state = row.payload;
      state.users = state.users.filter(item => item.id !== user.id);
      state.patients = state.patients.filter(item => item.id !== user.patientId);
      state.authCredentials = state.authCredentials.filter(item => item.userId !== user.id);
      state.authSessions = state.authSessions.filter(item => item.userId !== user.id);
      for (const key of ['documents', 'facts', 'conflicts', 'grants']) state[key] = state[key].filter(item => item.patientId !== user.patientId);
      await tx`update medilink.app_state set payload = ${tx.json(state)}, revision = revision + 1, updated_at = now() where id = 'primary'`;
    });
  } finally { await sql.end({ timeout: 2 }); }
}
