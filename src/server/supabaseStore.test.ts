import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { databaseMiddleware, validateDatabase } from './supabaseStore.ts';
import { getDb, saveDb } from './mockDb.ts';

const emptyState = () => ({ users: [], patients: [], organizations: [], documents: [], facts: [], conflicts: [], grants: [], auditLogs: [] });

test('Supabase middleware commits before returning success and rolls back failed saves', async () => {
  const previous = process.env.SUPABASE_DATABASE_URL;
  process.env.SUPABASE_DATABASE_URL = 'postgresql://test-only';
  let committed = false;
  let failCommit = false;
  let stored = emptyState();
  const transaction = async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.join('?');
    if (query.startsWith('select payload')) return [{ payload: structuredClone(stored) }];
    if (query.startsWith('update medilink')) {
      if (failCommit) throw Object.assign(new Error('private connection detail must not leak'), { code: '08006' });
      stored = structuredClone(values[0]) as typeof stored;
    }
    return [];
  };
  transaction.json = (value: unknown) => value;
  const pool = { begin: async (callback: (sql: unknown) => Promise<void>) => { await callback(transaction); committed = true; } };
  const app = express();
  app.use(databaseMiddleware(() => {}, (() => pool) as any));
  app.post('/api/write', (_req, res) => {
    assert.equal(committed, false);
    getDb().auditLogs.push({ id: 'test-event' } as any);
    saveDb();
    res.setHeader('Set-Cookie', 'test=session');
    res.json({ success: true });
  });
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const endpoint = `http://127.0.0.1:${address.port}/api/write`;
    const success = await fetch(endpoint, { method: 'POST' });
    assert.equal(success.status, 200);
    assert.equal(committed, true);
    assert.equal(stored.auditLogs.length, 1);
    failCommit = true;
    committed = false;
    const failed = await fetch(endpoint, { method: 'POST' });
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('set-cookie'), null);
    assert.equal(stored.auditLogs.length, 1, 'failed write must not affect committed state');
    assert(!JSON.stringify(await failed.json()).includes('private connection'));
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    if (previous === undefined) delete process.env.SUPABASE_DATABASE_URL; else process.env.SUPABASE_DATABASE_URL = previous;
  }
});

test('incomplete or missing persisted state fails closed', () => {
  assert.throws(() => validateDatabase(null));
  assert.throws(() => validateDatabase({ users: [] }));
  assert.doesNotThrow(() => validateDatabase(emptyState()));
});
