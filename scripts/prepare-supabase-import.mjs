import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Writes only into an explicitly supplied private backup directory. Never
// prints clinical data, password hashes, session tokens, or the connection URL.
const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory)) throw new Error('Supply an absolute private backup directory.');
fs.mkdirSync(directory, { recursive: true });
const working = JSON.parse(fs.readFileSync('data/medilink_store.json', 'utf8'));
let source = working;
if (process.argv.includes('--include-stash')) {
  const raw = execFileSync('git', ['show', 'stash@{0}:data/medilink_store.json'], { encoding: 'utf8', maxBuffer: 50_000_000 });
  source = JSON.parse(raw);
  fs.writeFileSync(path.join(directory, 'original-stash.json'), raw, { flag: 'wx' });
}
const keys = ['users', 'organizations', 'patients', 'documents', 'facts', 'conflicts', 'grants', 'auditLogs', 'authCredentials', 'authSessions'];
const merged = {};
for (const key of keys) {
  const identity = item => key === 'authCredentials' ? item.userId : item.id;
  const records = new Map((working[key] || []).map(item => [identity(item), item]));
  for (const item of source[key] || []) records.set(identity(item), item);
  merged[key] = [...records.values()];
}
fs.copyFileSync('data/medilink_store.json', path.join(directory, 'original-working.json'), fs.constants.COPYFILE_EXCL);
const payload = JSON.stringify(merged);
fs.writeFileSync(path.join(directory, 'migration-payload.json'), payload, { flag: 'wx' });
const manifest = { sha256: crypto.createHash('sha256').update(payload).digest('hex'), counts: Object.fromEntries(keys.map(key => [key, merged[key].length])) };
fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ backupDirectory: directory, ...manifest }));
