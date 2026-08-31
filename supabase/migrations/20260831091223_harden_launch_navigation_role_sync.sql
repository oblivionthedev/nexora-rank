-- Launch hardening: richer public directories, dependable Discord role sync,
-- working security actions, and a complete onboarding reset after deletion.

alter table public.partners
  add column if not exists roblox_group_banner_url text;
alter table public.nexora_groups
  add column if not exists roblox_group_banner_url text;

alter table public.partners drop constraint if exists partners_banner_https;
alter table public.partners add constraint partners_banner_https check (
  roblox_group_banner_url is null or roblox_group_banner_url ~ '^https://'
);
alter table public.nexora_groups drop constraint if exists nexora_groups_banner_https;
alter table public.nexora_groups add constraint nexora_groups_banner_https check (
  roblox_group_banner_url is null or roblox_group_banner_url ~ '^https://'
);

drop function if exists public.staff_add_partner(text,text,text,integer,text,text,text,text);
drop function if exists nexora_private.staff_add_partner(text,text,text,integer,text,text,text,text);
create function nexora_private.staff_add_partner(
  group_id text, group_name text, group_logo_url text, group_banner_url text,
  member_count integer, owner_user_id text, owner_username text,
  owner_display_name text, discord_url text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor); partner_id uuid;
begin
  if actor_role not in ('owner', 'admin') then raise exception using errcode = '42501', message = 'staff_management_denied'; end if;
  insert into public.partners (
    roblox_group_id, roblox_group_name, roblox_group_logo_url, roblox_group_banner_url,
    roblox_member_count, roblox_owner_user_id, roblox_owner_username,
    roblox_owner_display_name, discord_invite_url, created_by
  ) values (
    trim(group_id), trim(group_name), nullif(trim(group_logo_url), ''), nullif(trim(group_banner_url), ''),
    greatest(coalesce(member_count, 0), 0), nullif(trim(owner_user_id), ''),
    nullif(trim(owner_username), ''), nullif(trim(owner_display_name), ''), trim(discord_url), actor
  ) on conflict (roblox_group_id) do update set
    roblox_group_name = excluded.roblox_group_name,
    roblox_group_logo_url = excluded.roblox_group_logo_url,
    roblox_group_banner_url = excluded.roblox_group_banner_url,
    roblox_member_count = excluded.roblox_member_count,
    roblox_owner_user_id = excluded.roblox_owner_user_id,
    roblox_owner_username = excluded.roblox_owner_username,
    roblox_owner_display_name = excluded.roblox_owner_display_name,
    discord_invite_url = excluded.discord_invite_url,
    published = true, updated_at = now()
  returning id into partner_id;
  return partner_id;
end $$;
create function public.staff_add_partner(
  group_id text, group_name text, group_logo_url text, group_banner_url text,
  member_count integer, owner_user_id text, owner_username text,
  owner_display_name text, discord_url text
) returns uuid language sql security invoker set search_path = ''
as $$ select nexora_private.staff_add_partner(group_id, group_name, group_logo_url, group_banner_url, member_count, owner_user_id, owner_username, owner_display_name, discord_url) $$;
revoke all on function nexora_private.staff_add_partner(text,text,text,text,integer,text,text,text,text) from public, anon;
revoke all on function public.staff_add_partner(text,text,text,text,integer,text,text,text,text) from public, anon;
grant execute on function nexora_private.staff_add_partner(text,text,text,text,integer,text,text,text,text) to authenticated;
grant execute on function public.staff_add_partner(text,text,text,text,integer,text,text,text,text) to authenticated;

drop function if exists public.staff_add_nexora_group(text,text,text,integer,text,text,text,text);
drop function if exists nexora_private.staff_add_nexora_group(text,text,text,integer,text,text,text,text);
create function nexora_private.staff_add_nexora_group(
  group_id text, group_name text, group_logo_url text, group_banner_url text,
  member_count integer, owner_user_id text, owner_username text,
  owner_display_name text, discord_url text
) returns bigint language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor); result_id bigint;
begin
  if actor_role not in ('owner', 'admin') then raise exception using errcode = '42501', message = 'staff_management_denied'; end if;
  insert into public.nexora_groups (
    roblox_group_id, roblox_group_name, roblox_group_logo_url, roblox_group_banner_url,
    roblox_member_count, roblox_owner_user_id, roblox_owner_username,
    roblox_owner_display_name, discord_invite_url, created_by
  ) values (
    trim(group_id), trim(group_name), nullif(trim(group_logo_url), ''), nullif(trim(group_banner_url), ''),
    greatest(coalesce(member_count, 0), 0), nullif(trim(owner_user_id), ''),
    nullif(trim(owner_username), ''), nullif(trim(owner_display_name), ''),
    nullif(trim(discord_url), ''), actor
  ) on conflict (roblox_group_id) do update set
    roblox_group_name = excluded.roblox_group_name,
    roblox_group_logo_url = excluded.roblox_group_logo_url,
    roblox_group_banner_url = excluded.roblox_group_banner_url,
    roblox_member_count = excluded.roblox_member_count,
    roblox_owner_user_id = excluded.roblox_owner_user_id,
    roblox_owner_username = excluded.roblox_owner_username,
    roblox_owner_display_name = excluded.roblox_owner_display_name,
    discord_invite_url = excluded.discord_invite_url,
    published = true, updated_at = now()
  returning id into result_id;
  return result_id;
end $$;
create function public.staff_add_nexora_group(
  group_id text, group_name text, group_logo_url text, group_banner_url text,
  member_count integer, owner_user_id text, owner_username text,
  owner_display_name text, discord_url text
) returns bigint language sql security invoker set search_path = ''
as $$ select nexora_private.staff_add_nexora_group(group_id, group_name, group_logo_url, group_banner_url, member_count, owner_user_id, owner_username, owner_display_name, discord_url) $$;
revoke all on function nexora_private.staff_add_nexora_group(text,text,text,text,integer,text,text,text,text) from public, anon;
revoke all on function public.staff_add_nexora_group(text,text,text,text,integer,text,text,text,text) from public, anon;
grant execute on function nexora_private.staff_add_nexora_group(text,text,text,text,integer,text,text,text,text) to authenticated;
grant execute on function public.staff_add_nexora_group(text,text,text,text,integer,text,text,text,text) to authenticated;

create table nexora_private.discord_role_sync_queue (
  id bigint generated always as identity primary key,
  guild_id text not null check (guild_id ~ '^[0-9]{17,22}$'),
  discord_user_id text not null check (discord_user_id ~ '^[0-9]{17,22}$'),
  role_id text not null check (role_id ~ '^[0-9]{17,22}$'),
  operation text not null check (operation in ('add', 'remove')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index discord_role_sync_open_unique on nexora_private.discord_role_sync_queue
  (guild_id, discord_user_id, role_id) where status in ('pending', 'processing', 'failed');
create index discord_role_sync_due_idx on nexora_private.discord_role_sync_queue
  (next_attempt_at, created_at) where status in ('pending', 'processing', 'failed');
alter table nexora_private.discord_role_sync_queue enable row level security;
alter table nexora_private.discord_role_sync_queue force row level security;
revoke all on nexora_private.discord_role_sync_queue from public, anon, authenticated;
grant select, insert, update, delete on nexora_private.discord_role_sync_queue to service_role;
grant usage, select on sequence nexora_private.discord_role_sync_queue_id_seq to service_role;

create or replace function nexora_private.enqueue_discord_role_sync(
  target_discord_user_id text, target_role_id text, requested_operation text
) returns bigint language plpgsql security definer set search_path = '' as $$
declare queue_id bigint;
begin
  if target_discord_user_id !~ '^[0-9]{17,22}$'
     or target_role_id not in ('1543356004316614687','1543357165836705883','1543357235185324123')
     or requested_operation not in ('add','remove') then
    raise exception using errcode = '22023', message = 'invalid_role_sync';
  end if;
  insert into nexora_private.discord_role_sync_queue
    (guild_id, discord_user_id, role_id, operation, status, attempts, next_attempt_at, last_error, updated_at)
  values ('1542617161825255474', target_discord_user_id, target_role_id, requested_operation, 'pending', 0, now(), null, now())
  on conflict (guild_id, discord_user_id, role_id) where status in ('pending','processing','failed')
  do update set operation = excluded.operation, status = 'pending', attempts = 0,
    next_attempt_at = now(), last_error = null, updated_at = now(), completed_at = null
  returning id into queue_id;
  return queue_id;
end $$;
revoke all on function nexora_private.enqueue_discord_role_sync(text,text,text) from public, anon, authenticated;

create or replace function nexora_private.request_verified_role()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); discord_id text; queue_id bigint;
begin
  if actor is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  select provider_user_id into discord_id from public.account_links
  where user_id = actor and provider = 'discord' and verified_at is not null;
  if discord_id is null then return jsonb_build_object('ok', false, 'error', 'discord_not_verified'); end if;
  queue_id := nexora_private.enqueue_discord_role_sync(discord_id, '1543357165836705883', 'add');
  return jsonb_build_object('ok', true, 'queue_id', queue_id, 'discord_user_id', discord_id);
end $$;
create or replace function public.request_verified_role()
returns jsonb language sql security invoker set search_path = '' as $$ select nexora_private.request_verified_role() $$;
revoke all on function nexora_private.request_verified_role() from public, anon;
revoke all on function public.request_verified_role() from public, anon;
grant execute on function nexora_private.request_verified_role() to authenticated;
grant execute on function public.request_verified_role() to authenticated;

create or replace function nexora_private.request_workspace_owner_role()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); discord_id text; queue_id bigint;
begin
  if actor is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if not exists (select 1 from public.workspace_members where user_id = actor and role = 'owner') then
    return jsonb_build_object('ok', false, 'error', 'workspace_owner_required');
  end if;
  select provider_user_id into discord_id from public.account_links
  where user_id = actor and provider = 'discord' and verified_at is not null;
  if discord_id is null then return jsonb_build_object('ok', false, 'error', 'discord_not_verified'); end if;
  queue_id := nexora_private.enqueue_discord_role_sync(discord_id, '1543357235185324123', 'add');
  return jsonb_build_object('ok', true, 'queue_id', queue_id, 'discord_user_id', discord_id);
end $$;
create or replace function public.request_workspace_owner_role()
returns jsonb language sql security invoker set search_path = '' as $$ select nexora_private.request_workspace_owner_role() $$;
revoke all on function nexora_private.request_workspace_owner_role() from public, anon;
revoke all on function public.request_workspace_owner_role() from public, anon;
grant execute on function nexora_private.request_workspace_owner_role() to authenticated;
grant execute on function public.request_workspace_owner_role() to authenticated;

create or replace function nexora_private.staff_update_beta_application(application_id uuid, requested_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor_id); changed nexora_private.beta_applications; resolved_discord_id text;
begin
  if actor_role not in ('owner','admin') then raise exception using errcode = '42501', message = 'staff_management_denied'; end if;
  if requested_status not in ('submitted','reviewing','selected','waitlisted','declined') then raise exception using errcode = '22023', message = 'invalid_beta_status'; end if;
  select link.provider_user_id into resolved_discord_id
  from nexora_private.beta_applications application
  join auth.users users on lower(users.email) = lower(application.email)
  join public.account_links link on link.user_id = users.id and link.provider = 'discord'
  where application.id = application_id
  limit 1;
  update nexora_private.beta_applications set
    status = requested_status,
    discord_user_id = coalesce(discord_user_id, resolved_discord_id),
    reviewed_at = case when requested_status = 'submitted' then null else now() end,
    reviewed_by = case when requested_status = 'submitted' then null else actor_id end,
    updated_at = now()
  where id = application_id returning * into changed;
  if changed.id is null then return jsonb_build_object('ok', false, 'error', 'beta_application_not_found'); end if;
  if changed.discord_user_id is not null then
    perform nexora_private.enqueue_discord_role_sync(changed.discord_user_id, '1543356004316614687', case when requested_status = 'selected' then 'add' else 'remove' end);
  end if;
  return jsonb_build_object('ok', true, 'status', changed.status,
    'discord_user_id', changed.discord_user_id, 'discord_name', changed.discord_name,
    'role_sync_queued', changed.discord_user_id is not null);
end $$;

create or replace function nexora_private.bot_claim_discord_role_sync()
returns table (id bigint, guild_id text, discord_user_id text, role_id text, operation text, attempts integer)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  with due as (
    select queue.id from nexora_private.discord_role_sync_queue queue
    where queue.next_attempt_at <= now()
      and (queue.status in ('pending','failed') or (queue.status = 'processing' and queue.updated_at < now() - interval '5 minutes'))
      and queue.attempts < 12
    order by queue.created_at limit 25 for update skip locked
  ), claimed as (
    update nexora_private.discord_role_sync_queue queue set
      status = 'processing', attempts = queue.attempts + 1, updated_at = now()
    from due where queue.id = due.id returning queue.*
  )
  select claimed.id, claimed.guild_id, claimed.discord_user_id, claimed.role_id, claimed.operation, claimed.attempts from claimed;
end $$;
create or replace function public.bot_claim_discord_role_sync()
returns table (id bigint, guild_id text, discord_user_id text, role_id text, operation text, attempts integer)
language sql security invoker set search_path = '' as $$ select * from nexora_private.bot_claim_discord_role_sync() $$;

create or replace function nexora_private.bot_complete_discord_role_sync(queue_id bigint, succeeded boolean, failure_reason text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update nexora_private.discord_role_sync_queue set
    status = case when succeeded then 'completed' else 'failed' end,
    completed_at = case when succeeded then now() else null end,
    last_error = case when succeeded then null else left(coalesce(failure_reason, 'discord_role_failed'), 500) end,
    next_attempt_at = case when succeeded then next_attempt_at else now() + make_interval(mins => least(60, greatest(1, attempts * 5))) end,
    updated_at = now()
  where id = queue_id and status = 'processing';
  return found;
end $$;
create or replace function public.bot_complete_discord_role_sync(queue_id bigint, succeeded boolean, failure_reason text default null)
returns boolean language sql security invoker set search_path = '' as $$ select nexora_private.bot_complete_discord_role_sync(queue_id, succeeded, failure_reason) $$;
revoke all on function nexora_private.bot_claim_discord_role_sync(), public.bot_claim_discord_role_sync(),
  nexora_private.bot_complete_discord_role_sync(bigint,boolean,text), public.bot_complete_discord_role_sync(bigint,boolean,text)
  from public, anon, authenticated;
grant execute on function nexora_private.bot_claim_discord_role_sync(), public.bot_claim_discord_role_sync(),
  nexora_private.bot_complete_discord_role_sync(bigint,boolean,text), public.bot_complete_discord_role_sync(bigint,boolean,text)
  to service_role;

create or replace function nexora_private.staff_resolve_security_incident(incident_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor); resolved_count integer;
begin
  if actor_role is null then raise exception using errcode = '42501', message = 'staff_access_denied'; end if;
  update nexora_private.security_incidents set resolved_at = now(), resolved_by = actor
  where id = incident_id and resolved_at is null;
  get diagnostics resolved_count = row_count;
  if resolved_count = 0 then return false; end if;
  insert into public.staff_action_log (actor_user_id, action_type, reason)
  values (actor, 'security_incident_resolved', 'Resolved security incident ' || incident_id::text);
  return true;
end $$;

create or replace function nexora_private.set_workspace_lifecycle(
  target_workspace_id uuid, requested_action text, confirmation_name text default ''
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); target public.workspaces;
begin
  select * into target from public.workspaces where id = target_workspace_id;
  if target.id is null then raise exception using errcode = 'P0002', message = 'workspace_not_found'; end if;
  if not exists (select 1 from public.workspace_members where workspace_id = target_workspace_id and user_id = actor and role = 'owner') then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;
  if target.moderation_status <> 'clear' then raise exception using errcode = '42501', message = 'restricted_workspace'; end if;
  if requested_action = 'archive' then
    update public.workspaces set lifecycle_status='archived', archived_at=now(), operational_status='suspended', updated_at=now() where id=target_workspace_id;
    insert into public.workspace_logs (workspace_id,source,severity,event_type,summary,actor_user_id)
      values (target_workspace_id,'workspace','warning','workspace.archived','Workspace archived by its owner',actor);
    return jsonb_build_object('status','archived');
  elsif requested_action = 'restore' then
    update public.workspaces set lifecycle_status='active', archived_at=null, deletion_requested_at=null,
      deletion_effective_at=null, operational_status='active', updated_at=now() where id=target_workspace_id;
    insert into public.workspace_logs (workspace_id,source,severity,event_type,summary,actor_user_id)
      values (target_workspace_id,'workspace','success','workspace.restored','Workspace restored by its owner',actor);
    return jsonb_build_object('status','active');
  elsif requested_action = 'delete' then
    if confirmation_name <> target.name then raise exception using errcode = '22023', message = 'confirmation_mismatch'; end if;
    delete from public.workspaces where id = target_workspace_id;
    update public.profiles set first_name=null, last_name=null, contact_email=null, plan_selected_at=null,
      roblox_link_deferred_at=null, onboarding_completed_at=null, selected_roblox_group_id=null,
      selected_roblox_group_name=null, selected_roblox_group_role=null, free_roblox_group_status='unchecked',
      free_roblox_group_checked_at=null, updated_at=now()
    where id=actor and not exists (select 1 from public.workspace_members where user_id=actor);
    return jsonb_build_object('status','deleted','permanent',true,'onboarding_reset',true);
  end if;
  raise exception using errcode='22023', message='invalid_action';
end $$;

comment on table nexora_private.discord_role_sync_queue is
  'Private, retryable Discord role delivery queue consumed only by the Nexora bot service.';
