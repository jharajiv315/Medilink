import postgres from 'postgres';
import { supabaseTls } from './supabaseTls.ts';
import type { Request, Response, NextFunction } from 'express';
import type { MediLinkDatabase } from './mockDb.ts';
import { requestStore, usesSupabase, type RequestStore } from './requestStore.ts';

let pool: ReturnType<typeof postgres> | undefined;

export function getSupabasePool() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) throw new Error('Supabase database is not configured.');
  pool ??= postgres(url, {
    ssl: supabaseTls,
    prepare: false, // Supavisor transaction pooling does not support prepared statements.
    max: 3,
    connect_timeout: 10,
    idle_timeout: 15,
    max_lifetime: 300,
    onnotice: () => {},
  });
  return pool;
}

export function validateDatabase(value: unknown): asserts value is MediLinkDatabase {
  if (!value || typeof value !== 'object') throw new Error('Database state is invalid.');
  for (const key of ['users', 'patients', 'organizations', 'documents', 'facts', 'conflicts', 'grants', 'auditLogs']) {
    if (!Array.isArray((value as Record<string, unknown>)[key])) throw new Error('Database state is incomplete.');
  }
}

// Existing route handlers stay synchronous. Their response is held until the
// transaction commits, so a failed save can never be reported as a success.
export function databaseMiddleware(initializeCredentials: () => void, getPool = getSupabasePool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) return next();
    if (!usesSupabase()) {
      if (process.env.VERCEL === '1' && !process.env.MEDILINK_DB_PATH) {
        return res.status(503).json({ error: 'Persistent database is not configured. Please contact support.' });
      }
      return next();
    }

    const sendJson = res.json.bind(res);
    let responseBody: unknown;
    let captured = false;
    try {
      const sql = getPool();
      const includeAudit = req.path === '/api/audit' || req.path === '/api/db/reset';
      const readOnly = req.method === 'GET' && !req.path.startsWith('/api/clinic/handoff/');
      await sql.begin(async transaction => {
        await transaction`set local lock_timeout = '8s'`;
        await transaction`set local statement_timeout = '12s'`;
        // Serializes the short, synchronous legacy mutations across ALL Vercel
        // instances, preventing read/modify/write races and lost updates.
        const rows = readOnly
          ? includeAudit
            ? await transaction`select payload from medilink.app_state where id = 'primary'`
            : await transaction`select payload - 'auditLogs' as payload from medilink.app_state where id = 'primary'`
          : includeAudit
            ? await transaction`select payload from medilink.app_state where id = 'primary' for update`
            : await transaction`select payload - 'auditLogs' as payload from medilink.app_state where id = 'primary' for update`;
        const [row] = rows;
        if (!row) throw new Error('Database has not been initialized.');
        if (!includeAudit) row.payload.auditLogs = [];
        validateDatabase(row.payload);
        const store: RequestStore = { data: row.payload, dirty: false };
        await requestStore.run(store, async () => {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('API response timed out.')), 15000);
            res.json = ((body: unknown) => {
              if (!captured) {
                responseBody = body;
                captured = true;
                clearTimeout(timeout);
                resolve();
              }
              return res;
            }) as Response['json'];
            try {
              if (req.path === '/api/auth/login') initializeCredentials();
              next();
            } catch (error) {
              clearTimeout(timeout);
              reject(error);
            }
          });
          if (res.destroyed) throw new Error('Client disconnected.');
          if (res.statusCode >= 500) throw new Error('API handler failed; rolling back changes.');
          if (store.dirty) {
            if (readOnly) throw new Error('Read-only API attempted to mutate state.');
            validateDatabase(store.data);
            if (includeAudit) {
              await transaction`update medilink.app_state set payload = ${transaction.json(store.data as any)}, revision = revision + 1, updated_at = now() where id = 'primary'`;
            } else {
              // Most routes only append audit events. Preserve the existing
              // history in Postgres instead of retransmitting it per request.
              await transaction`update medilink.app_state set payload = jsonb_set(${transaction.json(store.data as any)}::jsonb, '{auditLogs}', ${transaction.json(store.data.auditLogs as any)}::jsonb || (payload->'auditLogs')), revision = revision + 1, updated_at = now() where id = 'primary'`;
            }
          }
        });
      });
      res.json = sendJson;
      if (!res.destroyed) sendJson(responseBody);
    } catch (error) {
      res.json = sendJson;
      // Do not log SQL text, parameters, connection URLs, or clinical payloads.
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'STORAGE_UNAVAILABLE';
      console.error('[MediLink storage]', code);
      if (!res.headersSent && !res.destroyed) {
        res.removeHeader('Set-Cookie');
        res.status(503).json({ error: req.method === 'GET' ? 'Your records could not be loaded. Please try again in a moment.' : 'Your changes could not be saved. Please try again in a moment.' });
      }
    }
  };
}
