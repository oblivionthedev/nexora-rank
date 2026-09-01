create table nexora_private.roblox_oauth_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_user_id text not null,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}'::text[],
  authorized_resources jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  refreshed_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint roblox_oauth_provider_user_id check (provider_user_id ~ '^[0-9]{1,20}$'),
  constraint roblox_oauth_access_ciphertext check (access_token_ciphertext like 'v1.%'),
  constraint roblox_oauth_refresh_ciphertext check (refresh_token_ciphertext like 'v1.%'),
  constraint roblox_oauth_resources_object check (jsonb_typeof(authorized_resources) = 'object')
);

revoke all on table nexora_private.roblox_oauth_credentials from public, anon, authenticated;

create or replace function nexora_private.store_roblox_oauth_credential(
  provider_user_id text,
  provider_username text,
  provider_display_name text,
  provider_avatar_url text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  token_scopes text[],
  resource_snapshot jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  normalized_scopes text[] := coalesce(token_scopes, '{}'::text[]);
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if provider_user_id !~ '^[0-9]{1,20}$'
     or char_length(trim(provider_username)) not between 1 and 100
     or access_token_ciphertext not like 'v1.%'
     or refresh_token_ciphertext not like 'v1.%'
     or token_expires_at <= now()
     or not ('openid' = any(normalized_scopes))
     or not ('profile' = any(normalized_scopes))
     or not ('group:read' = any(normalized_scopes))
     or not ('group:write' = any(normalized_scopes))
     or jsonb_typeof(coalesce(resource_snapshot, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_roblox_oauth_credential';
  end if;

  insert into nexora_private.roblox_oauth_credentials (
    user_id, provider_user_id, access_token_ciphertext,
    refresh_token_ciphertext, expires_at, scopes, authorized_resources,
    connected_at, refreshed_at, revoked_at
  ) values (
    actor, provider_user_id, access_token_ciphertext,
    refresh_token_ciphertext, token_expires_at, normalized_scopes,
    coalesce(resource_snapshot, '{}'::jsonb), now(), now(), null
  )
  on conflict (user_id) do update set
    provider_user_id = excluded.provider_user_id,
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    expires_at = excluded.expires_at,
    scopes = excluded.scopes,
    authorized_resources = excluded.authorized_resources,
    refreshed_at = now(),
    revoked_at = null;

  insert into public.account_links (
    user_id, provider, provider_user_id, username, display_name,
    avatar_url, metadata, verified_at, refreshed_at
  ) values (
    actor, 'roblox', provider_user_id, trim(provider_username),
    nullif(trim(coalesce(provider_display_name, '')), ''),
    nullif(trim(coalesce(provider_avatar_url, '')), ''),
    jsonb_build_object(
      'source', 'roblox_open_cloud_oauth',
      'scopes', to_jsonb(normalized_scopes),
      'open_cloud_ready', true
    ), now(), now()
  )
  on conflict (user_id, provider) do update set
    provider_user_id = excluded.provider_user_id,
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    metadata = excluded.metadata,
    verified_at = now(),
    refreshed_at = now();

  return true;
end
$$;

create or replace function public.store_roblox_oauth_credential(
  provider_user_id text,
  provider_username text,
  provider_display_name text,
  provider_avatar_url text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  token_scopes text[],
  resource_snapshot jsonb
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.store_roblox_oauth_credential(
    provider_user_id, provider_username, provider_display_name,
    provider_avatar_url, access_token_ciphertext, refresh_token_ciphertext,
    token_expires_at, token_scopes, resource_snapshot
  )
$$;

create or replace function nexora_private.claim_group_member_action(
  candidate_secret text,
  target_action_id uuid
)
returns table (
  action_id uuid,
  workspace_id uuid,
  roblox_group_id text,
  target_roblox_user_id text,
  action_type text,
  requested_role_id text,
  requested_role_name text,
  requested_role_rank integer,
  credential_user_id uuid,
  credential_provider_user_id text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  token_scopes text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_workspace_id uuid;
  actor_role text;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'invalid_execution_secret';
  end if;

  select action.workspace_id into target_workspace_id
  from public.group_member_actions action
  where action.id = target_action_id and action.status = 'pending';
  if target_workspace_id is null then
    raise exception using errcode = 'P0002', message = 'group_member_action_unavailable';
  end if;

  actor_role := nexora_private.workspace_role(target_workspace_id);
  if actor_role not in ('owner', 'admin', 'operator') then
    raise exception using errcode = '42501', message = 'group_member_action_forbidden';
  end if;

  return query
  select
    action.id,
    action.workspace_id,
    action.roblox_group_id,
    action.target_roblox_user_id,
    action.action_type,
    action.requested_role_id,
    action.requested_role_name,
    action.requested_role_rank,
    credential.user_id,
    credential.provider_user_id,
    credential.access_token_ciphertext,
    credential.refresh_token_ciphertext,
    credential.expires_at,
    credential.scopes
  from public.group_member_actions action
  join public.workspaces workspace on workspace.id = action.workspace_id
  join public.workspace_members owner_member
    on owner_member.workspace_id = workspace.id and owner_member.role = 'owner'
  join nexora_private.roblox_oauth_credentials credential
    on credential.user_id = owner_member.user_id
  where action.id = target_action_id
    and action.status = 'pending'
    and workspace.operational_status = 'active'
    and workspace.roblox_group_id = action.roblox_group_id
    and credential.revoked_at is null
    and credential.provider_user_id = (
      select link.provider_user_id
      from public.account_links link
      where link.user_id = credential.user_id and link.provider = 'roblox'
    );

  if not found then
    raise exception using errcode = 'P0002', message = 'roblox_reconnect_required';
  end if;

  update public.group_member_actions
  set status = 'processing', error_code = null
  where id = target_action_id and status = 'pending';
end
$$;

create or replace function nexora_private.rotate_roblox_oauth_credential(
  candidate_secret text,
  target_action_id uuid,
  target_credential_user_id uuid,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  token_scopes text[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_workspace_id uuid;
begin
  if actor is null or not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'credential_rotation_forbidden';
  end if;
  select action.workspace_id into target_workspace_id
  from public.group_member_actions action
  where action.id = target_action_id and action.status = 'processing';
  if target_workspace_id is null
     or nexora_private.workspace_role(target_workspace_id) not in ('owner', 'admin', 'operator')
     or not exists (
       select 1 from public.workspace_members member
       where member.workspace_id = target_workspace_id
         and member.user_id = target_credential_user_id
         and member.role = 'owner'
     ) then
    raise exception using errcode = '42501', message = 'credential_rotation_forbidden';
  end if;
  if access_token_ciphertext not like 'v1.%'
     or refresh_token_ciphertext not like 'v1.%'
     or token_expires_at <= now() then
    raise exception using errcode = '22023', message = 'invalid_credential_rotation';
  end if;

  update nexora_private.roblox_oauth_credentials
  set access_token_ciphertext = rotate_roblox_oauth_credential.access_token_ciphertext,
      refresh_token_ciphertext = rotate_roblox_oauth_credential.refresh_token_ciphertext,
      expires_at = token_expires_at,
      scopes = coalesce(token_scopes, scopes),
      refreshed_at = now(),
      revoked_at = null
  where user_id = target_credential_user_id;
  return found;
end
$$;

create or replace function nexora_private.complete_group_member_action(
  candidate_secret text,
  target_action_id uuid,
  execution_succeeded boolean,
  execution_error_code text,
  observed_role_id text,
  observed_role_name text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  action_record public.group_member_actions%rowtype;
begin
  if actor is null or not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'action_completion_forbidden';
  end if;
  select * into action_record from public.group_member_actions
  where id = target_action_id and status = 'processing';
  if action_record.id is null
     or nexora_private.workspace_role(action_record.workspace_id) not in ('owner', 'admin', 'operator') then
    raise exception using errcode = '42501', message = 'action_completion_forbidden';
  end if;

  update public.group_member_actions
  set status = case when execution_succeeded then 'succeeded' else 'failed' end,
      completed_at = now(),
      error_code = case when execution_succeeded then null else left(coalesce(execution_error_code, 'roblox_execution_failed'), 120) end
  where id = target_action_id;

  insert into public.workspace_logs (
    workspace_id, source, severity, event_type, summary, actor_user_id, metadata
  ) values (
    action_record.workspace_id,
    'roblox',
    case when execution_succeeded then 'info' else 'error' end,
    case when execution_succeeded then 'group.member.action_succeeded' else 'group.member.action_failed' end,
    initcap(action_record.action_type) ||
      case when execution_succeeded then ' completed for ' else ' failed for ' end ||
      action_record.target_username,
    actor,
    jsonb_build_object(
      'group_member_action_id', target_action_id,
      'request_key', action_record.request_key,
      'action', action_record.action_type,
      'target_roblox_user_id', action_record.target_roblox_user_id,
      'requested_role_id', action_record.requested_role_id,
      'requested_role_name', action_record.requested_role_name,
      'observed_role_id', observed_role_id,
      'observed_role_name', observed_role_name,
      'error_code', case when execution_succeeded then null else left(coalesce(execution_error_code, 'roblox_execution_failed'), 120) end,
      'verified_after_write', execution_succeeded
    )
  );
  return true;
end
$$;

create or replace function public.claim_group_member_action(candidate_secret text, target_action_id uuid)
returns table (
  action_id uuid, workspace_id uuid, roblox_group_id text,
  target_roblox_user_id text, action_type text, requested_role_id text,
  requested_role_name text, requested_role_rank integer,
  credential_user_id uuid, credential_provider_user_id text,
  access_token_ciphertext text, refresh_token_ciphertext text,
  token_expires_at timestamptz, token_scopes text[]
)
language sql security invoker set search_path = ''
as $$ select * from nexora_private.claim_group_member_action(candidate_secret, target_action_id) $$;

create or replace function public.rotate_roblox_oauth_credential(
  candidate_secret text, target_action_id uuid, target_credential_user_id uuid,
  access_token_ciphertext text, refresh_token_ciphertext text,
  token_expires_at timestamptz, token_scopes text[]
)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.rotate_roblox_oauth_credential(
  candidate_secret, target_action_id, target_credential_user_id,
  access_token_ciphertext, refresh_token_ciphertext, token_expires_at, token_scopes
) $$;

create or replace function public.complete_group_member_action(
  candidate_secret text, target_action_id uuid, execution_succeeded boolean,
  execution_error_code text, observed_role_id text, observed_role_name text
)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.complete_group_member_action(
  candidate_secret, target_action_id, execution_succeeded,
  execution_error_code, observed_role_id, observed_role_name
) $$;

revoke all on function nexora_private.store_roblox_oauth_credential(text,text,text,text,text,text,timestamptz,text[],jsonb) from public, anon;
revoke all on function nexora_private.claim_group_member_action(text,uuid) from public, anon;
revoke all on function nexora_private.rotate_roblox_oauth_credential(text,uuid,uuid,text,text,timestamptz,text[]) from public, anon;
revoke all on function nexora_private.complete_group_member_action(text,uuid,boolean,text,text,text) from public, anon;
grant execute on function nexora_private.store_roblox_oauth_credential(text,text,text,text,text,text,timestamptz,text[],jsonb) to authenticated;
grant execute on function nexora_private.claim_group_member_action(text,uuid) to authenticated;
grant execute on function nexora_private.rotate_roblox_oauth_credential(text,uuid,uuid,text,text,timestamptz,text[]) to authenticated;
grant execute on function nexora_private.complete_group_member_action(text,uuid,boolean,text,text,text) to authenticated;

revoke all on function public.store_roblox_oauth_credential(text,text,text,text,text,text,timestamptz,text[],jsonb) from public, anon;
revoke all on function public.claim_group_member_action(text,uuid) from public, anon;
revoke all on function public.rotate_roblox_oauth_credential(text,uuid,uuid,text,text,timestamptz,text[]) from public, anon;
revoke all on function public.complete_group_member_action(text,uuid,boolean,text,text,text) from public, anon;
grant execute on function public.store_roblox_oauth_credential(text,text,text,text,text,text,timestamptz,text[],jsonb) to authenticated;
grant execute on function public.claim_group_member_action(text,uuid) to authenticated;
grant execute on function public.rotate_roblox_oauth_credential(text,uuid,uuid,text,text,timestamptz,text[]) to authenticated;
grant execute on function public.complete_group_member_action(text,uuid,boolean,text,text,text) to authenticated;

comment on table nexora_private.roblox_oauth_credentials is
  'Encrypted Roblox OAuth access and rotating refresh tokens. Never exposed through the Data API.';
