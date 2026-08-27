-- Nexora Rank: secure multi-workspace foundation.
-- This migration intentionally stores no Discord, Roblox, or payment secrets in
-- public tables. Provider tokens belong in Vault/server-side secrets only.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists nexora_private;
revoke all on schema nexora_private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 80)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  roblox_group_id text,
  discord_guild_id text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length check (char_length(name) between 2 and 64),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  constraint workspaces_roblox_group_unique unique (roblox_group_id),
  constraint workspaces_discord_guild_unique unique (discord_guild_id)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint workspace_members_role check (role in ('owner', 'admin', 'reviewer', 'operator', 'viewer'))
);

create table public.account_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  username text not null,
  display_name text,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  refreshed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint account_links_provider check (provider in ('discord', 'roblox')),
  constraint account_links_one_provider_per_user unique (user_id, provider),
  constraint account_links_provider_identity unique (provider, provider_user_id),
  constraint account_links_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  external_id text,
  status text not null default 'disconnected',
  settings jsonb not null default '{}'::jsonb,
  connected_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_provider check (provider in ('discord', 'roblox', 'lemon_squeezy')),
  constraint integrations_status check (status in ('disconnected', 'pending', 'connected', 'degraded', 'error')),
  constraint integrations_settings_object check (jsonb_typeof(settings) = 'object'),
  constraint integrations_workspace_provider unique (workspace_id, provider)
);

create table public.rank_bindings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  roblox_role_id text not null,
  roblox_role_name text not null,
  discord_role_id text,
  discord_role_name text,
  minimum_activity_minutes integer not null default 0,
  requires_approval boolean not null default false,
  cooldown_minutes integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rank_bindings_minimum_activity check (minimum_activity_minutes between 0 and 525600),
  constraint rank_bindings_cooldown check (cooldown_minutes between 0 and 525600),
  constraint rank_bindings_workspace_role unique (workspace_id, roblox_role_id)
);

create table public.rank_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_roblox_user_id text not null,
  target_username text not null,
  requested_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  from_role_id text,
  from_role_name text,
  to_role_id text not null,
  to_role_name text not null,
  reason text not null,
  status text not null default 'pending',
  policy_snapshot jsonb not null default '{}'::jsonb,
  request_key uuid not null default gen_random_uuid() unique,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz,
  error_code text,
  constraint rank_actions_status check (status in ('pending', 'approved', 'processing', 'succeeded', 'failed', 'cancelled')),
  constraint rank_actions_reason_length check (char_length(reason) between 2 and 500),
  constraint rank_actions_policy_object check (jsonb_typeof(policy_snapshot) = 'object')
);

create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  roblox_user_id text not null,
  roblox_username text not null,
  place_id text,
  server_id text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  source text not null default 'game',
  created_at timestamptz not null default now(),
  constraint activity_sessions_source check (source in ('game', 'manual', 'import')),
  constraint activity_sessions_duration check (duration_seconds is null or duration_seconds between 0 and 604800),
  constraint activity_sessions_end_after_start check (ended_at is null or ended_at >= started_at)
);

create table public.activity_quotas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  roblox_role_id text not null,
  minutes_required integer not null,
  period text not null default 'weekly',
  grace_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_quotas_period check (period in ('daily', 'weekly', 'monthly')),
  constraint activity_quotas_minutes check (minutes_required between 0 and 44640 and grace_minutes between 0 and 10080),
  constraint activity_quotas_workspace_role unique (workspace_id, roblox_role_id, period)
);

create table public.application_forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  target_role_id text,
  target_role_name text,
  description text,
  fields jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_forms_status check (status in ('draft', 'open', 'paused', 'closed', 'archived')),
  constraint application_forms_fields_array check (jsonb_typeof(fields) = 'array'),
  constraint application_forms_window check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table public.application_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.application_forms(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  applicant_roblox_user_id text,
  responses jsonb not null default '{}'::jsonb,
  score numeric(5,2),
  status text not null default 'submitted',
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint application_submissions_status check (status in ('submitted', 'in_review', 'approved', 'declined', 'withdrawn')),
  constraint application_submissions_responses_object check (jsonb_typeof(responses) = 'object'),
  constraint application_submissions_score check (score is null or score between 0 and 100),
  constraint application_submissions_once unique (form_id, applicant_id)
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  definition jsonb not null,
  enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automations_trigger check (trigger_type in ('rank_changed', 'quota_missed', 'application_decided', 'member_joined', 'schedule', 'webhook')),
  constraint automations_definition_object check (jsonb_typeof(definition) = 'object')
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint automation_runs_status check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  constraint automation_runs_input_object check (jsonb_typeof(input) = 'object')
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  request_key uuid,
  ip_hash text,
  created_at timestamptz not null default now(),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  provider text not null default 'lemon_squeezy',
  external_customer_id text,
  external_subscription_id text unique,
  variant_id text,
  plan_key text not null default 'free',
  status text not null default 'free',
  renews_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_provider check (provider = 'lemon_squeezy'),
  constraint subscriptions_status check (status in ('free', 'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'))
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint webhook_events_provider check (provider in ('discord', 'roblox', 'lemon_squeezy')),
  constraint webhook_events_status check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  constraint webhook_events_idempotency unique (provider, external_event_id)
);

create index workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index account_links_provider_user_idx on public.account_links(provider, provider_user_id);
create index rank_actions_workspace_requested_idx on public.rank_actions(workspace_id, requested_at desc);
create index rank_actions_workspace_status_idx on public.rank_actions(workspace_id, status);
create index activity_sessions_workspace_started_idx on public.activity_sessions(workspace_id, started_at desc);
create index activity_sessions_user_started_idx on public.activity_sessions(user_id, started_at desc) where user_id is not null;
create index application_forms_workspace_status_idx on public.application_forms(workspace_id, status);
create index application_submissions_workspace_status_idx on public.application_submissions(workspace_id, status, submitted_at desc);
create index application_submissions_applicant_idx on public.application_submissions(applicant_id, submitted_at desc);
create index automations_workspace_idx on public.automations(workspace_id, enabled);
create index automation_runs_workspace_created_idx on public.automation_runs(workspace_id, created_at desc);
create index audit_events_workspace_created_idx on public.audit_events(workspace_id, created_at desc);
create index audit_events_request_key_idx on public.audit_events(request_key) where request_key is not null;
create index webhook_events_status_created_idx on public.webhook_events(status, created_at) where status <> 'processed';

create or replace function nexora_private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function nexora_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function nexora_private.guard_last_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role = 'owner' then
    return new;
  end if;

  if not exists (
    select 1
    from public.workspace_members other_owner
    where other_owner.workspace_id = old.workspace_id
      and other_owner.user_id <> old.user_id
      and other_owner.role = 'owner'
  ) then
    raise exception 'A workspace must keep at least one owner';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function nexora_private.handle_new_user();

create trigger workspace_members_guard_last_owner
before update of role or delete on public.workspace_members
for each row execute function nexora_private.guard_last_workspace_owner();

create or replace function nexora_private.workspace_role(target_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function nexora_private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select nexora_private.workspace_role(target_workspace_id) is not null;
$$;

create or replace function nexora_private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nexora_private.workspace_role(target_workspace_id) in ('owner', 'admin'), false);
$$;

create or replace function public.create_workspace(workspace_name text, workspace_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_workspace_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id)
  values (actor_id)
  on conflict (id) do nothing;

  insert into public.workspaces (name, slug, created_by)
  values (trim(workspace_name), lower(trim(workspace_slug)), actor_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, actor_id, 'owner');

  insert into public.subscriptions (workspace_id)
  values (new_workspace_id);

  return new_workspace_id;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function nexora_private.touch_updated_at();
create trigger workspaces_touch_updated_at before update on public.workspaces for each row execute function nexora_private.touch_updated_at();
create trigger integrations_touch_updated_at before update on public.integrations for each row execute function nexora_private.touch_updated_at();
create trigger rank_bindings_touch_updated_at before update on public.rank_bindings for each row execute function nexora_private.touch_updated_at();
create trigger activity_quotas_touch_updated_at before update on public.activity_quotas for each row execute function nexora_private.touch_updated_at();
create trigger application_forms_touch_updated_at before update on public.application_forms for each row execute function nexora_private.touch_updated_at();
create trigger application_submissions_touch_updated_at before update on public.application_submissions for each row execute function nexora_private.touch_updated_at();
create trigger automations_touch_updated_at before update on public.automations for each row execute function nexora_private.touch_updated_at();
create trigger subscriptions_touch_updated_at before update on public.subscriptions for each row execute function nexora_private.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.account_links enable row level security;
alter table public.integrations enable row level security;
alter table public.rank_bindings enable row level security;
alter table public.rank_actions enable row level security;
alter table public.activity_sessions enable row level security;
alter table public.activity_quotas enable row level security;
alter table public.application_forms enable row level security;
alter table public.application_submissions enable row level security;
alter table public.automations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.audit_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "workspaces_select_member" on public.workspaces for select to authenticated using (nexora_private.is_workspace_member(id));
create policy "workspaces_update_manager" on public.workspaces for update to authenticated using (nexora_private.can_manage_workspace(id)) with check (nexora_private.can_manage_workspace(id));
create policy "workspaces_delete_owner" on public.workspaces for delete to authenticated using (nexora_private.workspace_role(id) = 'owner');

create policy "workspace_members_select_member" on public.workspace_members for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "workspace_members_insert_manager" on public.workspace_members for insert to authenticated with check (
  nexora_private.can_manage_workspace(workspace_id)
  and (role <> 'owner' or nexora_private.workspace_role(workspace_id) = 'owner')
);
create policy "workspace_members_update_manager" on public.workspace_members for update to authenticated using (
  nexora_private.can_manage_workspace(workspace_id)
  and (role <> 'owner' or nexora_private.workspace_role(workspace_id) = 'owner')
) with check (
  nexora_private.can_manage_workspace(workspace_id)
  and (role <> 'owner' or nexora_private.workspace_role(workspace_id) = 'owner')
);
create policy "workspace_members_delete_manager" on public.workspace_members for delete to authenticated using (
  nexora_private.can_manage_workspace(workspace_id)
  and (role <> 'owner' or nexora_private.workspace_role(workspace_id) = 'owner')
);

create policy "account_links_select_self" on public.account_links for select to authenticated using (user_id = (select auth.uid()));

create policy "integrations_select_member" on public.integrations for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "integrations_manage_admin" on public.integrations for all to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));

create policy "rank_bindings_select_member" on public.rank_bindings for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "rank_bindings_manage_admin" on public.rank_bindings for all to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));

create policy "rank_actions_select_member" on public.rank_actions for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "rank_actions_insert_operator" on public.rank_actions for insert to authenticated with check (
  nexora_private.workspace_role(workspace_id) in ('owner', 'admin', 'operator')
  and requested_by = (select auth.uid())
  and status = 'pending'
);
create policy "rank_actions_update_manager" on public.rank_actions for update to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));

create policy "activity_sessions_select_member" on public.activity_sessions for select to authenticated using (nexora_private.is_workspace_member(workspace_id));

create policy "activity_quotas_select_member" on public.activity_quotas for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "activity_quotas_manage_admin" on public.activity_quotas for all to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));

create policy "application_forms_select_member" on public.application_forms for select to authenticated using (nexora_private.is_workspace_member(workspace_id) or status = 'open');
create policy "application_forms_manage_admin" on public.application_forms for all to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));

create policy "application_submissions_select_related" on public.application_submissions for select to authenticated using (applicant_id = (select auth.uid()) or nexora_private.is_workspace_member(workspace_id));
create policy "application_submissions_insert_self" on public.application_submissions for insert to authenticated with check (applicant_id = (select auth.uid()) and status = 'submitted');
create policy "application_submissions_update_related" on public.application_submissions for update to authenticated using (applicant_id = (select auth.uid()) or nexora_private.workspace_role(workspace_id) in ('owner', 'admin', 'reviewer')) with check (
  (applicant_id = (select auth.uid()) and status = 'withdrawn')
  or nexora_private.workspace_role(workspace_id) in ('owner', 'admin', 'reviewer')
);

create policy "automations_select_member" on public.automations for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "automations_manage_admin" on public.automations for all to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));
create policy "automation_runs_select_member" on public.automation_runs for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "audit_events_select_member" on public.audit_events for select to authenticated using (nexora_private.is_workspace_member(workspace_id));
create policy "subscriptions_select_owner" on public.subscriptions for select to authenticated using (nexora_private.workspace_role(workspace_id) = 'owner');

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select on public.account_links to authenticated;
grant select, insert, update, delete on public.integrations to authenticated;
grant select, insert, update, delete on public.rank_bindings to authenticated;
grant select, insert, update on public.rank_actions to authenticated;
grant select on public.activity_sessions to authenticated;
grant select, insert, update, delete on public.activity_quotas to authenticated;
grant select, insert, update, delete on public.application_forms to authenticated;
grant select, insert, update on public.application_submissions to authenticated;
grant select, insert, update, delete on public.automations to authenticated;
grant select on public.automation_runs, public.audit_events, public.subscriptions to authenticated;

grant usage on schema nexora_private to authenticated;
grant execute on function nexora_private.workspace_role(uuid) to authenticated;
grant execute on function nexora_private.is_workspace_member(uuid) to authenticated;
grant execute on function nexora_private.can_manage_workspace(uuid) to authenticated;
revoke all on function public.create_workspace(text, text) from public, anon;
grant execute on function public.create_workspace(text, text) to authenticated;

comment on table public.account_links is 'Server-written verified provider identities only. OAuth tokens must never be stored here.';
comment on table public.activity_sessions is 'Server-written activity evidence. Browser roles receive SELECT only.';
comment on column public.integrations.settings is 'Non-secret integration settings. Store credentials in Vault/server-only secrets.';
comment on table public.audit_events is 'Append-only product audit history. Client roles receive SELECT only.';
comment on table public.webhook_events is 'Server-only idempotency ledger; no anon/authenticated grants or RLS policies.';
