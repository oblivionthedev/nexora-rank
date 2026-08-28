-- Practical community operations modules. Roblox OAuth, billing, custom AI,
-- hosted custom bots, SMS alerts, and automated Open Cloud execution are
-- intentionally outside this migration.

create table public.workspace_roblox_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  group_id text not null,
  group_name text not null,
  purpose text not null default 'community',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint workspace_roblox_groups_group_id check (group_id ~ '^[0-9]{1,20}$'),
  constraint workspace_roblox_groups_name check (char_length(group_name) between 1 and 100),
  constraint workspace_roblox_groups_purpose check (purpose in ('community','department','division','training')),
  constraint workspace_roblox_groups_unique unique (workspace_id, group_id)
);

create unique index workspace_roblox_groups_primary_idx
  on public.workspace_roblox_groups (workspace_id) where is_primary;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  discord_role_id text,
  roblox_group_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_name check (char_length(name) between 2 and 80),
  constraint departments_unique unique (workspace_id, name)
);

create table public.community_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  session_type text not null,
  title text not null,
  status text not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz,
  host_user_id uuid references public.profiles(id) on delete set null,
  discord_channel_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_sessions_type check (session_type in ('training','patrol','shift','event')),
  constraint community_sessions_status check (status in ('scheduled','active','completed','cancelled')),
  constraint community_sessions_title check (char_length(title) between 2 and 120),
  constraint community_sessions_window check (ends_at is null or ends_at >= starts_at)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_user_id uuid references public.profiles(id) on delete set null,
  member_name text not null,
  starts_on date not null,
  ends_on date not null,
  reason text not null,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint leave_requests_status check (status in ('pending','approved','declined','cancelled')),
  constraint leave_requests_dates check (ends_on >= starts_on),
  constraint leave_requests_reason check (char_length(reason) between 2 and 500)
);

create table public.workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'todo',
  priority text not null default 'normal',
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_tasks_title check (char_length(title) between 2 and 160),
  constraint workspace_tasks_status check (status in ('todo','in_progress','blocked','done','cancelled')),
  constraint workspace_tasks_priority check (priority in ('low','normal','high','urgent'))
);

create table public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entry_type text not null default 'article',
  title text not null,
  content text not null,
  visibility text not null default 'staff',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_entries_type check (entry_type in ('article','logbook','resource','procedure')),
  constraint knowledge_entries_visibility check (visibility in ('staff','members','public')),
  constraint knowledge_entries_title check (char_length(title) between 2 and 160),
  constraint knowledge_entries_content check (char_length(content) between 1 and 20000)
);

create table public.announcement_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  announcement_type text not null,
  title_template text not null,
  body_template text not null,
  discord_channel_id text,
  enabled boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcement_templates_type check (announcement_type in ('training','shift','event','welcome','goodbye','milestone','shout')),
  constraint announcement_templates_name check (char_length(name) between 2 and 100),
  constraint announcement_templates_unique unique (workspace_id, name)
);

create table public.community_snapshots (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  roblox_group_id text,
  member_count integer not null,
  online_count integer,
  recorded_at timestamptz not null default now(),
  constraint community_snapshots_members check (member_count >= 0),
  constraint community_snapshots_online check (online_count is null or online_count >= 0)
);

alter table public.workspace_settings
  add column if not exists welcome_enabled boolean not null default false,
  add column if not exists welcome_channel_id text,
  add column if not exists welcome_message text not null default 'Welcome {user} to {server}! You are member #{memberCount}.',
  add column if not exists goodbye_enabled boolean not null default false,
  add column if not exists goodbye_channel_id text,
  add column if not exists goodbye_message text not null default 'Goodbye {user}. Thanks for being part of {server}.',
  add column if not exists nickname_sync_enabled boolean not null default false,
  add column if not exists verification_dm_enabled boolean not null default true,
  add column if not exists role_sync_enabled boolean not null default false,
  add column if not exists member_count_channel_id text;

create index departments_workspace_idx on public.departments (workspace_id, active, name);
create index community_sessions_workspace_idx on public.community_sessions (workspace_id, starts_at desc);
create index leave_requests_workspace_idx on public.leave_requests (workspace_id, status, starts_on desc);
create index workspace_tasks_workspace_idx on public.workspace_tasks (workspace_id, status, due_at);
create index knowledge_entries_workspace_idx on public.knowledge_entries (workspace_id, entry_type, updated_at desc);
create index announcement_templates_workspace_idx on public.announcement_templates (workspace_id, announcement_type);
create index community_snapshots_workspace_idx on public.community_snapshots (workspace_id, recorded_at desc);

alter table public.workspace_roblox_groups enable row level security;
alter table public.departments enable row level security;
alter table public.community_sessions enable row level security;
alter table public.leave_requests enable row level security;
alter table public.workspace_tasks enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.announcement_templates enable row level security;
alter table public.community_snapshots enable row level security;

create policy workspace_roblox_groups_read on public.workspace_roblox_groups for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy workspace_roblox_groups_manage on public.workspace_roblox_groups for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy departments_read on public.departments for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy departments_manage on public.departments for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_sessions_read on public.community_sessions for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy community_sessions_manage on public.community_sessions for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy leave_requests_read on public.leave_requests for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy leave_requests_manage on public.leave_requests for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy workspace_tasks_read on public.workspace_tasks for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy workspace_tasks_manage on public.workspace_tasks for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy knowledge_entries_read on public.knowledge_entries for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy knowledge_entries_manage on public.knowledge_entries for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy announcement_templates_read on public.announcement_templates for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy announcement_templates_manage on public.announcement_templates for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_snapshots_read on public.community_snapshots for select to authenticated using ((select nexora_private.is_workspace_member(workspace_id)));
create policy community_snapshots_manage on public.community_snapshots for all to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));

grant select, insert, update, delete on public.workspace_roblox_groups, public.departments, public.community_sessions,
  public.leave_requests, public.workspace_tasks, public.knowledge_entries, public.announcement_templates, public.community_snapshots to authenticated;
grant usage, select on sequence public.community_snapshots_id_seq to authenticated;

create trigger departments_touch_updated_at before update on public.departments for each row execute function nexora_private.touch_updated_at();
create trigger community_sessions_touch_updated_at before update on public.community_sessions for each row execute function nexora_private.touch_updated_at();
create trigger workspace_tasks_touch_updated_at before update on public.workspace_tasks for each row execute function nexora_private.touch_updated_at();
create trigger knowledge_entries_touch_updated_at before update on public.knowledge_entries for each row execute function nexora_private.touch_updated_at();
create trigger announcement_templates_touch_updated_at before update on public.announcement_templates for each row execute function nexora_private.touch_updated_at();

create or replace function nexora_private.save_community_messaging(
  target_workspace_id uuid,
  requested_welcome_enabled boolean,
  requested_welcome_channel_id text,
  requested_welcome_message text,
  requested_goodbye_enabled boolean,
  requested_goodbye_channel_id text,
  requested_goodbye_message text,
  requested_nickname_sync_enabled boolean,
  requested_verification_dm_enabled boolean,
  requested_role_sync_enabled boolean,
  requested_member_count_channel_id text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid();
begin
  if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then
    raise exception using errcode = '42501', message = 'manager_required';
  end if;
  if char_length(trim(requested_welcome_message)) not between 1 and 2000
     or char_length(trim(requested_goodbye_message)) not between 1 and 2000 then
    raise exception using errcode = '22023', message = 'invalid_message';
  end if;
  if coalesce(requested_welcome_channel_id, '') !~ '^([0-9]{5,22})?$'
     or coalesce(requested_goodbye_channel_id, '') !~ '^([0-9]{5,22})?$'
     or coalesce(requested_member_count_channel_id, '') !~ '^([0-9]{5,22})?$' then
    raise exception using errcode = '22023', message = 'invalid_channel';
  end if;
  update public.workspace_settings set
    welcome_enabled = requested_welcome_enabled,
    welcome_channel_id = nullif(requested_welcome_channel_id, ''),
    welcome_message = trim(requested_welcome_message),
    goodbye_enabled = requested_goodbye_enabled,
    goodbye_channel_id = nullif(requested_goodbye_channel_id, ''),
    goodbye_message = trim(requested_goodbye_message),
    nickname_sync_enabled = requested_nickname_sync_enabled,
    verification_dm_enabled = requested_verification_dm_enabled,
    role_sync_enabled = requested_role_sync_enabled,
    member_count_channel_id = nullif(requested_member_count_channel_id, ''),
    updated_by = actor_id,
    updated_at = now()
  where workspace_id = target_workspace_id;
  insert into public.workspace_logs(workspace_id, source, event_type, summary, actor_user_id)
  values(target_workspace_id, 'workspace', 'communications.updated', 'Community messaging settings updated', actor_id);
  return true;
end $$;

create or replace function public.save_community_messaging(
  target_workspace_id uuid,
  requested_welcome_enabled boolean,
  requested_welcome_channel_id text,
  requested_welcome_message text,
  requested_goodbye_enabled boolean,
  requested_goodbye_channel_id text,
  requested_goodbye_message text,
  requested_nickname_sync_enabled boolean,
  requested_verification_dm_enabled boolean,
  requested_role_sync_enabled boolean,
  requested_member_count_channel_id text
) returns boolean language sql security invoker set search_path = '' as $$
  select nexora_private.save_community_messaging(target_workspace_id, requested_welcome_enabled,
    requested_welcome_channel_id, requested_welcome_message, requested_goodbye_enabled,
    requested_goodbye_channel_id, requested_goodbye_message, requested_nickname_sync_enabled,
    requested_verification_dm_enabled, requested_role_sync_enabled, requested_member_count_channel_id)
$$;

revoke all on function nexora_private.save_community_messaging(uuid,boolean,text,text,boolean,text,text,boolean,boolean,boolean,text) from public, anon;
grant execute on function nexora_private.save_community_messaging(uuid,boolean,text,text,boolean,text,text,boolean,boolean,boolean,text) to authenticated;
revoke all on function public.save_community_messaging(uuid,boolean,text,text,boolean,text,text,boolean,boolean,boolean,text) from public, anon;
grant execute on function public.save_community_messaging(uuid,boolean,text,text,boolean,text,text,boolean,boolean,boolean,text) to authenticated;
