-- One-time Staff access codes are created only by the Discord bot using the
-- service-role key. Codes are hashed at rest and become unusable after one
-- successful Discord-authorized redemption.
create table nexora_private.staff_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  role text not null default 'support',
  guild_id text not null,
  created_by_discord_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  constraint staff_access_codes_role check (role in ('admin', 'moderator', 'support')),
  constraint staff_access_codes_guild check (guild_id = '1542617161825255474'),
  constraint staff_access_codes_hash check (code_hash ~ '^[0-9a-f]{64}$')
);

create index staff_access_codes_expiry_idx
  on nexora_private.staff_access_codes (expires_at)
  where used_at is null;
create index staff_access_codes_used_by_idx
  on nexora_private.staff_access_codes (used_by)
  where used_by is not null;

create table nexora_private.staff_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text not null,
  display_name text not null,
  avatar_url text,
  role text not null,
  access_code_id uuid references nexora_private.staff_access_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint staff_sessions_role check (role in ('admin', 'moderator', 'support')),
  constraint staff_sessions_discord_id check (discord_user_id ~ '^[0-9]{17,22}$')
);

create index staff_sessions_active_idx
  on nexora_private.staff_sessions (expires_at)
  where revoked_at is null;
create index staff_sessions_access_code_idx
  on nexora_private.staff_sessions (access_code_id)
  where access_code_id is not null;

create or replace function nexora_private.current_staff_role(actor_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from (
    select sm.role,
      case sm.role when 'owner' then 5 when 'admin' then 4 when 'moderator' then 3 else 2 end as weight
    from public.staff_members sm
    where sm.user_id = actor_id and sm.active = true
    union all
    select ss.role,
      case ss.role when 'admin' then 4 when 'moderator' then 3 else 2 end as weight
    from nexora_private.staff_sessions ss
    where ss.user_id = actor_id and ss.revoked_at is null and ss.expires_at > now()
  ) authorized_roles
  order by weight desc
  limit 1
$$;

create function nexora_private.create_staff_access_code(
  raw_code text,
  requested_guild_id text,
  creator_discord_id text,
  requested_role text default 'support'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid; valid_until timestamptz := now() + interval '10 minutes';
begin
  if requested_guild_id <> '1542617161825255474'
     or creator_discord_id !~ '^[0-9]{17,22}$'
     or raw_code !~ '^[A-Z0-9]{25}$'
     or requested_role not in ('admin', 'moderator', 'support') then
    raise exception using errcode = '22023', message = 'invalid_staff_code_request';
  end if;

  delete from nexora_private.staff_access_codes
  where expires_at < now() - interval '1 day';

  insert into nexora_private.staff_access_codes
    (code_hash, role, guild_id, created_by_discord_id, expires_at)
  values
    (encode(extensions.digest(raw_code, 'sha256'), 'hex'), requested_role,
     requested_guild_id, creator_discord_id, valid_until)
  returning id into new_id;

  return jsonb_build_object('id', new_id, 'expires_at', valid_until, 'role', requested_role);
end;
$$;

create function public.bot_create_staff_access_code(
  raw_code text,
  guild_id text,
  creator_discord_id text,
  requested_role text default 'support'
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.create_staff_access_code(raw_code, guild_id, creator_discord_id, requested_role)
$$;

create function nexora_private.redeem_staff_access_code(raw_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  code_row nexora_private.staff_access_codes;
  discord_record record;
  staff_name text;
  staff_avatar text;
begin
  if actor_id is null or raw_code !~ '^[A-Z0-9]{25}$' then
    raise exception using errcode = '42501', message = 'invalid_staff_code';
  end if;

  select * into code_row
  from nexora_private.staff_access_codes
  where code_hash = encode(extensions.digest(raw_code, 'sha256'), 'hex')
    and used_at is null and expires_at > now()
  for update;

  if code_row.id is null then
    raise exception using errcode = '42501', message = 'invalid_staff_code';
  end if;

  select i.provider_id, i.identity_data into discord_record
  from auth.identities i
  where i.user_id = actor_id and i.provider = 'discord'
  order by i.created_at desc
  limit 1;

  if discord_record.provider_id is null then
    raise exception using errcode = '42501', message = 'discord_authorization_required';
  end if;

  staff_name := coalesce(
    nullif(discord_record.identity_data ->> 'global_name', ''),
    nullif(discord_record.identity_data ->> 'full_name', ''),
    nullif(discord_record.identity_data ->> 'name', ''),
    nullif(discord_record.identity_data ->> 'username', ''),
    'Nexora Staff'
  );
  staff_avatar := coalesce(
    nullif(discord_record.identity_data ->> 'avatar_url', ''),
    nullif(discord_record.identity_data ->> 'picture', '')
  );

  update nexora_private.staff_access_codes
  set used_at = now(), used_by = actor_id
  where id = code_row.id;

  insert into nexora_private.staff_sessions
    (user_id, discord_user_id, display_name, avatar_url, role, access_code_id, created_at, expires_at, revoked_at)
  values
    (actor_id, discord_record.provider_id, staff_name, staff_avatar, code_row.role,
     code_row.id, now(), now() + interval '12 hours', null)
  on conflict (user_id) do update set
    discord_user_id = excluded.discord_user_id,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    role = excluded.role,
    access_code_id = excluded.access_code_id,
    created_at = now(),
    expires_at = excluded.expires_at,
    revoked_at = null;

  return jsonb_build_object(
    'authorized', true,
    'role', code_row.role,
    'display_name', staff_name,
    'avatar_url', staff_avatar,
    'expires_at', now() + interval '12 hours'
  );
end;
$$;

create function public.redeem_staff_access_code(raw_code text)
returns jsonb language sql security invoker set search_path = '' as $$
  select nexora_private.redeem_staff_access_code(raw_code)
$$;

create function nexora_private.revoke_current_staff_session()
returns boolean language sql security definer set search_path = '' as $$
  update nexora_private.staff_sessions
  set revoked_at = now()
  where user_id = auth.uid() and revoked_at is null
  returning true
$$;

create function public.revoke_current_staff_session()
returns boolean language sql security invoker set search_path = '' as $$
  select coalesce(nexora_private.revoke_current_staff_session(), false)
$$;

create or replace function nexora_private.staff_access_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  session_row record;
  permanent_name text;
  permanent_avatar text;
begin
  if actor_id is null then return jsonb_build_object('authorized', false); end if;
  actor_role := nexora_private.current_staff_role(actor_id);
  if actor_role is null then return jsonb_build_object('authorized', false); end if;

  select display_name, avatar_url, expires_at into session_row
  from nexora_private.staff_sessions
  where user_id = actor_id and revoked_at is null and expires_at > now();

  select p.display_name, p.avatar_url into permanent_name, permanent_avatar
  from public.profiles p where p.id = actor_id;

  return jsonb_build_object(
    'authorized', true,
    'role', actor_role,
    'can_moderate', actor_role in ('owner', 'admin', 'moderator'),
    'can_ban', actor_role in ('owner', 'admin'),
    'can_manage_staff', actor_role in ('owner', 'admin'),
    'display_name', coalesce(session_row.display_name, permanent_name, 'Nexora Staff'),
    'avatar_url', coalesce(session_row.avatar_url, permanent_avatar),
    'session_expires_at', session_row.expires_at
  );
end;
$$;

-- Deletion is now immediate and permanent after the owner types the exact
-- workspace name. Archive remains the reversible choice.
create or replace function nexora_private.set_workspace_lifecycle(
  target_workspace_id uuid,
  requested_action text,
  confirmation_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); target public.workspaces;
begin
  select * into target from public.workspaces where id = target_workspace_id;
  if target.id is null then raise exception using errcode='P0002', message='workspace_not_found'; end if;
  if not exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=actor and role='owner') then
    raise exception using errcode='42501', message='owner_required';
  end if;
  if target.moderation_status <> 'clear' then raise exception using errcode='42501', message='restricted_workspace'; end if;

  if requested_action = 'archive' then
    update public.workspaces set lifecycle_status='archived', archived_at=now(), operational_status='suspended', updated_at=now() where id=target_workspace_id;
    insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id)
    values(target_workspace_id,'workspace','warning','workspace.archived','Workspace archived by its owner',actor);
    return jsonb_build_object('status','archived');
  elsif requested_action = 'restore' then
    update public.workspaces set lifecycle_status='active', archived_at=null, deletion_requested_at=null, deletion_effective_at=null, operational_status='active', updated_at=now() where id=target_workspace_id;
    insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id)
    values(target_workspace_id,'workspace','success','workspace.restored','Workspace restored by its owner',actor);
    return jsonb_build_object('status','active');
  elsif requested_action = 'delete' then
    if confirmation_name <> target.name then raise exception using errcode='22023', message='confirmation_mismatch'; end if;
    delete from public.workspaces where id = target_workspace_id;
    return jsonb_build_object('status','deleted','permanent',true);
  end if;
  raise exception using errcode='22023', message='invalid_action';
end;
$$;

revoke all on table nexora_private.staff_access_codes, nexora_private.staff_sessions from public, anon, authenticated;
revoke all on function nexora_private.create_staff_access_code(text,text,text,text) from public, anon, authenticated;
revoke all on function public.bot_create_staff_access_code(text,text,text,text) from public, anon, authenticated;
grant usage on schema nexora_private to service_role;
grant execute on function nexora_private.create_staff_access_code(text,text,text,text) to service_role;
grant execute on function public.bot_create_staff_access_code(text,text,text,text) to service_role;

revoke all on function nexora_private.redeem_staff_access_code(text), nexora_private.revoke_current_staff_session() from public, anon;
grant execute on function nexora_private.redeem_staff_access_code(text), nexora_private.revoke_current_staff_session() to authenticated;
revoke all on function public.redeem_staff_access_code(text), public.revoke_current_staff_session() from public, anon;
grant execute on function public.redeem_staff_access_code(text), public.revoke_current_staff_session() to authenticated;

comment on table nexora_private.staff_access_codes is 'Hashed, one-time Staff access codes created by the Nexora Discord bot.';
comment on table nexora_private.staff_sessions is 'Time-limited Staff console access established after code redemption and Discord authorization.';
