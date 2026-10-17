-- Compatibility migration: preserve the application's existing clinical and
-- identity records while moving storage into transactional Postgres.
-- The runtime role receives no access to auth, public, or other applications.
create schema if not exists medilink;
revoke all on schema medilink from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'medilink_runtime') then
    create role medilink_runtime nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end;
$$;

create table if not exists medilink.app_state (
  id text primary key check (id = 'primary'),
  payload jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint valid_application_payload check (
    jsonb_typeof(payload) = 'object'
    and payload ?& array['users', 'patients', 'organizations', 'documents', 'facts', 'conflicts', 'grants', 'auditLogs']
    and jsonb_typeof(payload -> 'users') = 'array'
    and jsonb_typeof(payload -> 'patients') = 'array'
    and jsonb_typeof(payload -> 'organizations') = 'array'
    and jsonb_typeof(payload -> 'documents') = 'array'
    and jsonb_typeof(payload -> 'facts') = 'array'
    and jsonb_typeof(payload -> 'conflicts') = 'array'
    and jsonb_typeof(payload -> 'grants') = 'array'
    and jsonb_typeof(payload -> 'auditLogs') = 'array'
  )
);

alter table medilink.app_state enable row level security;
alter table medilink.app_state force row level security;
revoke all on medilink.app_state from public, anon, authenticated;
grant usage on schema medilink to medilink_runtime;
grant select, update on medilink.app_state to medilink_runtime;
create policy runtime_read on medilink.app_state for select to medilink_runtime using (id = 'primary');
create policy runtime_update on medilink.app_state for update to medilink_runtime using (id = 'primary') with check (id = 'primary');

-- An immutable copy of the initial import is retained for recovery. The
-- application role cannot read, overwrite, or delete this backup.
create table if not exists medilink.migration_backup (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table medilink.migration_backup enable row level security;
alter table medilink.migration_backup force row level security;
revoke all on medilink.migration_backup from public, anon, authenticated, medilink_runtime;
