import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('API preserves role boundaries and scoped clinician counts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'medilink-api-test-'));
  const dbPath = join(directory, 'store.json');
  copyFileSync(new URL('../../data/medilink_store.json', import.meta.url), dbPath);
  const keys = ['VERCEL', 'MEDILINK_DB_PATH', 'CLINICIAN_PASSWORD', 'DEMO_PATIENT_PASSWORD', 'DEMO_CLINICIAN_PASSWORD'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.VERCEL = '1';
  process.env.MEDILINK_DB_PATH = dbPath;
  process.env.CLINICIAN_PASSWORD = 'Isolated-test-doctor-2026';
  process.env.DEMO_PATIENT_PASSWORD = 'Isolated-test-patient-2026';
  delete process.env.DEMO_CLINICIAN_PASSWORD;
  let server: ReturnType<(typeof import('../../server.ts'))['app']['listen']> | undefined;
  try {
    const { app } = await import('../../server.ts');
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const login = async (email: string, password: string) => {
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      assert.equal(response.status, 200);
      return response.headers.get('set-cookie')!.split(';')[0];
    };
    assert.equal((await fetch(`${base}/api/clinic/dashboard`)).status, 401);
    const patientCookie = await login('ananya.sharma@example.com', 'Isolated-test-patient-2026');
    assert.equal((await fetch(`${base}/api/clinic/dashboard`, { headers: { Cookie: patientCookie } })).status, 403);
    const doctorCookie = await login('m.vance@sutterhealth.org', 'Isolated-test-doctor-2026');
    const headers = { Cookie: doctorCookie };
    assert.equal((await fetch(`${base}/api/audit`, { headers })).status, 403);
    assert.equal((await fetch(`${base}/api/clinic/handoff/does-not-exist`, { headers })).status, 404);
    const response = await fetch(`${base}/api/clinic/dashboard`, { headers });
    assert.equal(response.status, 200);
    const dashboard = await response.json();
    const unresolved = new Set<string>();
    for (const grant of dashboard.activeGrants) {
      const handoffResponse = await fetch(`${base}/api/clinic/handoff/${grant.id}`, { headers });
      assert.equal(handoffResponse.status, 200);
      const handoff = await handoffResponse.json();
      for (const conflict of handoff.conflicts) if (conflict.status !== 'clinician_reconciled') unresolved.add(conflict.id);
    }
    assert.equal(dashboard.unresolvedDiscrepanciesCount, unresolved.size);
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
    // Only remove the isolated directory created by mkdtemp above.
    rmSync(directory, { recursive: true, force: true });
  }
});
