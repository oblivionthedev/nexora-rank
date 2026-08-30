create table public.nexora_groups (
  id bigint generated always as identity primary key,
  roblox_group_id text not null unique,
  roblox_group_name text not null,
  roblox_group_logo_url text,
  roblox_member_count integer not null default 0,
  roblox_owner_user_id text,
  roblox_owner_username text,
  roblox_owner_display_name text,
  discord_invite_url text,
  published boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nexora_groups_group_id_format check (roblox_group_id ~ '^[0-9]{1,20}$'),
  constraint nexora_groups_group_name_length check (char_length(roblox_group_name) between 1 and 120),
  constraint nexora_groups_member_count_nonnegative check (roblox_member_count >= 0),
  constraint nexora_groups_discord_invite_https check (
    discord_invite_url is null or
    discord_invite_url ~ '^https://(www\.)?(discord\.gg|discord\.com/invite)/[A-Za-z0-9_-]+/?$'
  )
);

create index nexora_groups_published_created_idx
  on public.nexora_groups (published, created_at desc);
create index nexora_groups_created_by_idx
  on public.nexora_groups (created_by);

alter table public.nexora_groups enable row level security;
create policy nexora_groups_public_read
  on public.nexora_groups for select
  to anon, authenticated
  using (published = true);

revoke all on table public.nexora_groups from public, anon, authenticated;
grant select on table public.nexora_groups to anon, authenticated;
grant select, insert, update, delete on table public.nexora_groups to service_role;
grant usage, select on sequence public.nexora_groups_id_seq to service_role;

create table nexora_private.security_incidents (
  id bigint generated always as identity primary key,
  dedupe_key text not null unique,
  actor_user_id uuid references auth.users(id) on delete set null,
  scope text not null check (scope in ('staff_login', 'staff_access', 'workspace_access', 'dashboard_access')),
  target_ref text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_alerted_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null
);

create index security_incidents_due_idx
  on nexora_private.security_incidents (last_alerted_at, last_seen_at)
  where resolved_at is null;
create index security_incidents_actor_idx
  on nexora_private.security_incidents (actor_user_id, last_seen_at desc);

alter table nexora_private.security_incidents enable row level security;
alter table nexora_private.security_incidents force row level security;
revoke all on table nexora_private.security_incidents from public, anon, authenticated;
grant select, insert, update, delete on table nexora_private.security_incidents to service_role;
grant usage, select on sequence nexora_private.security_incidents_id_seq to service_role;

alter table nexora_private.beta_applications
  add column archived_at timestamptz,
  add column archived_by uuid references public.profiles(id) on delete set null;
create index beta_applications_staff_queue_idx
  on nexora_private.beta_applications (archived_at, created_at desc);

create or replace function nexora_private.dashboard_access_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  staff_role text;
  beta_selected boolean := false;
begin
  if actor is null then
    return jsonb_build_object('allowed', false, 'reason', 'sign_in_required');
  end if;
  staff_role := nexora_private.current_staff_role(actor);
  select exists (
    select 1
    from public.account_links link
    join nexora_private.beta_applications application
      on application.discord_user_id = link.provider_user_id
    where link.user_id = actor
      and link.provider = 'discord'
      and application.status = 'selected'
      and application.archived_at is null
  ) into beta_selected;
  return jsonb_build_object(
    'allowed', staff_role is not null or beta_selected,
    'staff', staff_role is not null,
    'staff_role', staff_role,
    'beta_selected', beta_selected,
    'reason', case
      when staff_role is not null then 'staff'
      when beta_selected then 'beta_selected'
      else 'beta_selection_required'
    end
  );
end
$$;

create or replace function public.dashboard_access_state()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.dashboard_access_state() $$;

create or replace function nexora_private.guard_beta_workspace_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((nexora_private.dashboard_access_state()->>'allowed')::boolean, false) then
    raise exception using errcode = '42501', message = 'beta_selection_required';
  end if;
  return new;
end
$$;

drop trigger if exists guard_beta_workspace_creation on public.workspaces;
create trigger guard_beta_workspace_creation
before insert on public.workspaces
for each row execute function nexora_private.guard_beta_workspace_creation();

create or replace function nexora_private.report_security_incident(
  requested_scope text,
  requested_target text default null,
  requested_details jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  clean_target text := left(nullif(trim(coalesce(requested_target, '')), ''), 160);
  incident_key text;
  incident_id bigint;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if requested_scope not in ('staff_login', 'staff_access', 'workspace_access', 'dashboard_access')
     or jsonb_typeof(coalesce(requested_details, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_security_incident';
  end if;
  incident_key := actor::text || ':' || requested_scope || ':' || coalesce(clean_target, '');
  insert into nexora_private.security_incidents (
    dedupe_key, actor_user_id, scope, target_ref, details
  ) values (
    incident_key, actor, requested_scope, clean_target, coalesce(requested_details, '{}'::jsonb)
  )
  on conflict (dedupe_key) do update set
    details = excluded.details,
    occurrence_count = nexora_private.security_incidents.occurrence_count + 1,
    last_seen_at = now(),
    last_alerted_at = case
      when nexora_private.security_incidents.resolved_at is not null then null
      else nexora_private.security_incidents.last_alerted_at
    end,
    resolved_at = null,
    resolved_by = null
  returning id into incident_id;
  return incident_id;
end
$$;

create or replace function public.report_security_incident(
  requested_scope text,
  requested_target text default null,
  requested_details jsonb default '{}'::jsonb
)
returns bigint language sql security invoker set search_path = ''
as $$ select nexora_private.report_security_incident(requested_scope, requested_target, requested_details) $$;

create or replace function nexora_private.staff_security_incidents()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', incident.id,
      'scope', incident.scope,
      'target_ref', incident.target_ref,
      'details', incident.details,
      'occurrence_count', incident.occurrence_count,
      'first_seen_at', incident.first_seen_at,
      'last_seen_at', incident.last_seen_at,
      'last_alerted_at', incident.last_alerted_at,
      'resolved_at', incident.resolved_at,
      'actor_user_id', incident.actor_user_id,
      'actor_email', users.email
    ) order by incident.resolved_at nulls first, incident.last_seen_at desc)
    from nexora_private.security_incidents incident
    left join auth.users users on users.id = incident.actor_user_id
  ), '[]'::jsonb);
end
$$;

create or replace function public.staff_security_incidents()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.staff_security_incidents() $$;

create or replace function nexora_private.staff_resolve_security_incident(incident_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor);
begin
  if actor_role is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  update nexora_private.security_incidents
  set resolved_at = now(), resolved_by = actor
  where id = incident_id and resolved_at is null;
  if found then
    insert into public.staff_action_log (actor_user_id, action_type, reason)
    values (actor, 'security_incident_resolved', 'Resolved security incident ' || incident_id);
    return true;
  end if;
  return false;
end
$$;

create or replace function public.staff_resolve_security_incident(incident_id bigint)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_resolve_security_incident(incident_id) $$;

create or replace function nexora_private.bot_claim_security_incidents()
returns table (
  id bigint,
  scope text,
  target_ref text,
  actor_user_id uuid,
  actor_email text,
  details jsonb,
  occurrence_count integer,
  first_seen_at timestamptz,
  last_seen_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with due as (
    select incident.id
    from nexora_private.security_incidents incident
    where incident.resolved_at is null
      and (incident.last_alerted_at is null or incident.last_alerted_at <= now() - interval '60 seconds')
    order by incident.last_seen_at
    limit 25
    for update skip locked
  ), claimed as (
    update nexora_private.security_incidents incident
    set last_alerted_at = now()
    from due
    where incident.id = due.id
    returning incident.*
  )
  select claimed.id, claimed.scope, claimed.target_ref, claimed.actor_user_id,
    users.email::text, claimed.details, claimed.occurrence_count,
    claimed.first_seen_at, claimed.last_seen_at
  from claimed
  left join auth.users users on users.id = claimed.actor_user_id;
end
$$;

create or replace function public.bot_claim_security_incidents()
returns table (
  id bigint, scope text, target_ref text, actor_user_id uuid, actor_email text,
  details jsonb, occurrence_count integer, first_seen_at timestamptz, last_seen_at timestamptz
)
language sql security invoker set search_path = ''
as $$ select * from nexora_private.bot_claim_security_incidents() $$;

create or replace function nexora_private.staff_nexora_groups()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(item) order by item.created_at desc) from public.nexora_groups item), '[]'::jsonb);
end
$$;

create or replace function public.staff_nexora_groups()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.staff_nexora_groups() $$;

create or replace function nexora_private.staff_add_nexora_group(
  group_id text, group_name text, group_logo_url text, member_count integer,
  owner_user_id text, owner_username text, owner_display_name text, discord_url text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor); result_id bigint;
begin
  if actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  insert into public.nexora_groups (
    roblox_group_id, roblox_group_name, roblox_group_logo_url, roblox_member_count,
    roblox_owner_user_id, roblox_owner_username, roblox_owner_display_name,
    discord_invite_url, created_by
  ) values (
    trim(group_id), trim(group_name), nullif(trim(group_logo_url), ''), greatest(coalesce(member_count, 0), 0),
    nullif(trim(owner_user_id), ''), nullif(trim(owner_username), ''), nullif(trim(owner_display_name), ''),
    nullif(trim(discord_url), ''), actor
  )
  on conflict (roblox_group_id) do update set
    roblox_group_name = excluded.roblox_group_name,
    roblox_group_logo_url = excluded.roblox_group_logo_url,
    roblox_member_count = excluded.roblox_member_count,
    roblox_owner_user_id = excluded.roblox_owner_user_id,
    roblox_owner_username = excluded.roblox_owner_username,
    roblox_owner_display_name = excluded.roblox_owner_display_name,
    discord_invite_url = excluded.discord_invite_url,
    published = true,
    updated_at = now()
  returning id into result_id;
  return result_id;
end
$$;

create or replace function public.staff_add_nexora_group(
  group_id text, group_name text, group_logo_url text, member_count integer,
  owner_user_id text, owner_username text, owner_display_name text, discord_url text
)
returns bigint language sql security invoker set search_path = ''
as $$ select nexora_private.staff_add_nexora_group(group_id, group_name, group_logo_url, member_count, owner_user_id, owner_username, owner_display_name, discord_url) $$;

create or replace function nexora_private.staff_remove_nexora_group(group_record_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  delete from public.nexora_groups where id = group_record_id;
  return found;
end
$$;

create or replace function public.staff_remove_nexora_group(group_record_id bigint)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_remove_nexora_group(group_record_id) $$;

create or replace function nexora_private.staff_archive_beta_application(application_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if nexora_private.current_staff_role(actor) is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  update nexora_private.beta_applications
  set archived_at = now(), archived_by = actor, updated_at = now()
  where id = application_id and archived_at is null;
  return found;
end
$$;

create or replace function nexora_private.workspace_rank_candidates(target_workspace_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if nexora_private.workspace_role(target_workspace_id) not in ('owner', 'admin', 'operator') then
    raise exception using errcode = '42501', message = 'rank_request_forbidden';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', member.user_id,
      'workspace_role', member.role,
      'roblox_user_id', link.provider_user_id,
      'roblox_username', link.username,
      'roblox_display_name', link.display_name
    ) order by coalesce(link.display_name, link.username))
    from public.workspace_members member
    join public.account_links link
      on link.user_id = member.user_id and link.provider = 'roblox'
    where member.workspace_id = target_workspace_id
  ), '[]'::jsonb);
end
$$;

create or replace function public.workspace_rank_candidates(target_workspace_id uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.workspace_rank_candidates(target_workspace_id) $$;

create or replace function nexora_private.create_workspace_rank_request(
  target_workspace_id uuid,
  target_roblox_user_id text,
  target_role_id text,
  target_role_name text,
  request_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); action_id uuid; target_link public.account_links%rowtype;
begin
  if nexora_private.workspace_role(target_workspace_id) not in ('owner', 'admin', 'operator') then
    raise exception using errcode = '42501', message = 'rank_request_forbidden';
  end if;
  if target_roblox_user_id !~ '^[0-9]{1,20}$' or target_role_id !~ '^[0-9]{1,20}$'
     or char_length(trim(target_role_name)) not between 1 and 100
     or char_length(trim(request_reason)) not between 2 and 500 then
    raise exception using errcode = '22023', message = 'invalid_rank_request';
  end if;
  select link.* into target_link
  from public.account_links link
  join public.workspace_members member on member.user_id = link.user_id
  where member.workspace_id = target_workspace_id
    and link.provider = 'roblox'
    and link.provider_user_id = target_roblox_user_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'workspace_member_not_found';
  end if;
  insert into public.rank_actions (
    workspace_id, target_user_id, target_roblox_user_id, target_username,
    requested_by, to_role_id, to_role_name, reason, status, policy_snapshot
  ) values (
    target_workspace_id, target_link.user_id, target_link.provider_user_id,
    coalesce(target_link.username, target_link.display_name, target_link.provider_user_id),
    actor, target_role_id, trim(target_role_name), trim(request_reason), 'pending',
    jsonb_build_object('source', 'dashboard_automation', 'requested_change', 'promote_or_demote', 'roblox_execution', 'awaiting_approved_provider')
  ) returning id into action_id;
  insert into public.workspace_logs (workspace_id, source, severity, event_type, summary, actor_user_id, metadata)
  values (
    target_workspace_id, 'roblox', 'info', 'rank.requested',
    'Rank change requested for ' || coalesce(target_link.display_name, target_link.username, target_link.provider_user_id),
    actor, jsonb_build_object('rank_action_id', action_id, 'target_roblox_user_id', target_link.provider_user_id, 'to_role_id', target_role_id, 'to_role_name', trim(target_role_name), 'reason', trim(request_reason))
  );
  return action_id;
end
$$;

create or replace function public.create_workspace_rank_request(
  target_workspace_id uuid, target_roblox_user_id text, target_role_id text,
  target_role_name text, request_reason text
)
returns uuid language sql security invoker set search_path = ''
as $$ select nexora_private.create_workspace_rank_request(target_workspace_id, target_roblox_user_id, target_role_id, target_role_name, request_reason) $$;

create or replace function public.staff_archive_beta_application(application_id uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_archive_beta_application(application_id) $$;

create or replace function nexora_private.staff_delete_beta_application(application_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  delete from nexora_private.beta_applications where id = application_id;
  return found;
end
$$;

create or replace function public.staff_delete_beta_application(application_id uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_delete_beta_application(application_id) $$;

create or replace function nexora_private.staff_beta_applications()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', application.id, 'full_name', application.full_name, 'email', application.email,
        'age', application.age, 'status', application.status,
        'discord_notified', application.discord_notified,
        'discord_user_id', application.discord_user_id,
        'discord_name', application.discord_name,
        'created_at', application.created_at, 'updated_at', application.updated_at
      ) order by application.created_at desc
    )
    from nexora_private.beta_applications application
    where application.archived_at is null
  ), '[]'::jsonb);
end
$$;

create or replace function nexora_private.public_platform_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'beta_enabled', beta_enabled,
    'dashboard_invite_only', true,
    'updated_at', updated_at
  )
  from nexora_private.platform_settings
  where singleton = true
$$;

revoke all on function nexora_private.dashboard_access_state() from public, anon;
grant execute on function nexora_private.dashboard_access_state() to authenticated;
revoke all on function public.dashboard_access_state() from public, anon;
grant execute on function public.dashboard_access_state() to authenticated;
revoke all on function nexora_private.guard_beta_workspace_creation() from public, anon, authenticated;
revoke all on function nexora_private.report_security_incident(text,text,jsonb) from public, anon;
grant execute on function nexora_private.report_security_incident(text,text,jsonb) to authenticated;
revoke all on function public.report_security_incident(text,text,jsonb) from public, anon;
grant execute on function public.report_security_incident(text,text,jsonb) to authenticated;
revoke all on function nexora_private.staff_security_incidents(), nexora_private.staff_resolve_security_incident(bigint) from public, anon;
grant execute on function nexora_private.staff_security_incidents(), nexora_private.staff_resolve_security_incident(bigint) to authenticated;
revoke all on function public.staff_security_incidents(), public.staff_resolve_security_incident(bigint) from public, anon;
grant execute on function public.staff_security_incidents(), public.staff_resolve_security_incident(bigint) to authenticated;
revoke all on function nexora_private.bot_claim_security_incidents(), public.bot_claim_security_incidents() from public, anon, authenticated;
grant execute on function nexora_private.bot_claim_security_incidents(), public.bot_claim_security_incidents() to service_role;
revoke all on function nexora_private.staff_nexora_groups(), nexora_private.staff_add_nexora_group(text,text,text,integer,text,text,text,text), nexora_private.staff_remove_nexora_group(bigint) from public, anon;
grant execute on function nexora_private.staff_nexora_groups(), nexora_private.staff_add_nexora_group(text,text,text,integer,text,text,text,text), nexora_private.staff_remove_nexora_group(bigint) to authenticated;
revoke all on function public.staff_nexora_groups(), public.staff_add_nexora_group(text,text,text,integer,text,text,text,text), public.staff_remove_nexora_group(bigint) from public, anon;
grant execute on function public.staff_nexora_groups(), public.staff_add_nexora_group(text,text,text,integer,text,text,text,text), public.staff_remove_nexora_group(bigint) to authenticated;
revoke all on function nexora_private.staff_archive_beta_application(uuid), nexora_private.staff_delete_beta_application(uuid) from public, anon;
grant execute on function nexora_private.staff_archive_beta_application(uuid), nexora_private.staff_delete_beta_application(uuid) to authenticated;
revoke all on function public.staff_archive_beta_application(uuid), public.staff_delete_beta_application(uuid) from public, anon;
grant execute on function public.staff_archive_beta_application(uuid), public.staff_delete_beta_application(uuid) to authenticated;
revoke all on function nexora_private.workspace_rank_candidates(uuid), nexora_private.create_workspace_rank_request(uuid,text,text,text,text) from public, anon;
grant execute on function nexora_private.workspace_rank_candidates(uuid), nexora_private.create_workspace_rank_request(uuid,text,text,text,text) to authenticated;
revoke all on function public.workspace_rank_candidates(uuid), public.create_workspace_rank_request(uuid,text,text,text,text) from public, anon;
grant execute on function public.workspace_rank_candidates(uuid), public.create_workspace_rank_request(uuid,text,text,text,text) to authenticated;
