import postgres from 'postgres';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { supabaseTls } from '../src/server/supabaseTls.ts';

if (!process.env.SUPABASE_DATABASE_URL) throw new Error('SUPABASE_DATABASE_URL is required.');
const sql = postgres(process.env.SUPABASE_DATABASE_URL, { ssl: supabaseTls, prepare: false, connect_timeout: 8, max: 1 });
try {
  if (process.argv[2] === '--check') {
    console.log(JSON.stringify(await sql`select current_user, current_database()`));
  } else {
    const source = process.argv[2];
    if (!source) throw new Error('Supply the private migration-payload.json path.');
    const raw = fs.readFileSync(source, 'utf8');
    const payload = JSON.parse(raw);
    for (const key of ['users', 'patients', 'organizations', 'documents', 'facts', 'conflicts', 'grants', 'auditLogs']) {
      if (!Array.isArray(payload[key])) throw new Error('Invalid import payload.');
    }
    await sql.begin(async transaction => {
      const [existing] = await transaction`select count(*)::int as count from medilink.app_state`;
      if (existing.count !== 0) throw new Error('Database already contains data; refusing to overwrite it.');
      await transaction`insert into medilink.migration_backup (id, payload) values ('initial-json-import', ${transaction.json(payload)})`;
      await transaction`insert into medilink.app_state (id, payload) values ('primary', ${transaction.json(payload)})`;
    });
    const [verified] = await sql`select revision, jsonb_array_length(payload->'users') as users, jsonb_array_length(payload->'patients') as patients, jsonb_array_length(payload->'auditLogs') as audit_events from medilink.app_state where id = 'primary'`;
    console.log(JSON.stringify({ imported: true, sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'), ...verified }));
  }
} catch (error) {
  console.error(JSON.stringify({ error: error.code || error.name, message: error.code ? 'Database operation failed.' : error.message }));
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 2 });
}
