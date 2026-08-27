-- Developer API foundation. Raw API keys are never stored: the server keeps
-- only a SHA-256 digest and a short, non-secret prefix for identification.

alter table public.workspaces
  add column if not exists public_id text not null
  default ('wrk_' || encode(extensions.gen_random_bytes(9), 'hex'));

create unique index if not exists workspaces_public_id_unique
  on public.workspaces(public_id);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default array['activity:write']::text[],
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  constraint api_keys_name_length check (char_length(name) between 2 and 64),
  constraint api_keys_prefix_format check (key_prefix ~ '^nx_(live|test)_[A-Za-z0-9]{6,16}$'),
  constraint api_keys_hash_format check (key_hash ~ '^[a-f0-9]{64}$'),
  constraint api_keys_scopes_allowed check (
    scopes <@ array['activity:write','members:read','ranks:read','ranks:write','audit:read','webhooks:write']::text[]
    and cardinality(scopes) > 0
  ),
  constraint api_keys_expiry_future check (expires_at is null or expires_at > created_at)
);

create index if not exists api_keys_workspace_active_idx
  on public.api_keys(workspace_id, created_at desc)
  where revoked_at is null;

create unique index if not exists api_keys_hash_unique on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

create policy "api_keys_select_manager"
  on public.api_keys for select to authenticated
  using (nexora_private.can_manage_workspace(workspace_id));

create policy "api_keys_insert_manager"
  on public.api_keys for insert to authenticated
  with check (
    nexora_private.can_manage_workspace(workspace_id)
    and created_by = (select auth.uid())
  );

create policy "api_keys_update_manager"
  on public.api_keys for update to authenticated
  using (nexora_private.can_manage_workspace(workspace_id))
  with check (nexora_private.can_manage_workspace(workspace_id));

grant select (id, workspace_id, name, key_prefix, scopes, created_by, created_at, last_used_at, expires_at, revoked_at)
  on public.api_keys to authenticated;
grant insert (workspace_id, name, key_prefix, key_hash, scopes, created_by, expires_at)
  on public.api_keys to authenticated;
grant update (name, scopes, expires_at, revoked_at)
  on public.api_keys to authenticated;

comment on column public.workspaces.public_id is 'Stable public identifier used by SDKs and API requests.';
comment on column public.api_keys.key_hash is 'Lowercase SHA-256 hex digest. Never store the raw nx_live_/nx_test_ key.';
