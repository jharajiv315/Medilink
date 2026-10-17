# Supabase persistence

MediLink keeps its existing patient and provisioned-doctor authentication and
clinical authorization. Supabase Postgres replaces the local JSON file; this
is not a migration to Supabase Auth. Existing password hashes remain valid.

## Runtime

Set the **server-only** `SUPABASE_DATABASE_URL` to the Supavisor transaction
pooler URL for the restricted `medilink_runtime` role. No Supabase service-role
key, database password, or connection URL belongs in a `VITE_` variable.
The runtime role can only select/update `medilink.app_state`, protected by RLS.
The schema is not exposed to the Supabase Data API. Public/anonymous Supabase
clients have no clinical data access.

The API loads fresh state inside a transaction with a row lock. Each request
uses AsyncLocalStorage to isolate its state. Changes commit before JSON or
session cookies are sent. A save failure rolls back the request and returns
503, so it cannot silently succeed against an ephemeral Vercel filesystem.

The compatibility store uses one JSONB row. It deliberately preserves the
existing record format and is suitable for the current demonstration workload.
Transactions serialize against this row; a larger deployment should normalize
clinical/identity entities and use per-record queries and transactions.

## Migration and recovery

1. Create a dedicated MediLink Supabase project and apply the migration.
2. Prepare a private backup using
   `node scripts/prepare-supabase-import.mjs <absolute-private-directory> --include-stash`.
   The stash is read without applying or dropping it. Records are merged by ID;
   stashed values take precedence and registered users/credentials are retained.
3. Insert the merged payload only if `app_state` is empty. Also retain it in
   `medilink.migration_backup`, inaccessible to the application role.
4. Configure the runtime role's password outside migrations, test its limited
   privileges, then set the Vercel Production secret and deploy.
5. Confirm `/api/health` reports `storage: "supabase"`, then verify login,
   refresh, registration, import, approvals, reconciliation and revocation.

The original JSON, original stash, merged import and SHA-256 manifest remain
in the private backup directory. Do not commit them. A database owner can
restore the immutable migration backup in a transaction after taking a fresh
backup of current state. Restoring the original import would discard later
writes, so never restore automatically during a deployment rollback.

Local development/tests can keep using an isolated `MEDILINK_DB_PATH`. A
Vercel deployment without `SUPABASE_DATABASE_URL` fails closed unless an
explicit local/test file path was supplied. Temporary doctor demo tokens are
not used when Supabase is configured: the normal persisted session is used.
