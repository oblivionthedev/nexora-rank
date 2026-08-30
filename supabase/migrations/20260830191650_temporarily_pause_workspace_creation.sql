alter table nexora_private.platform_settings
  add column if not exists workspace_creation_enabled boolean not null default false;

update nexora_private.platform_settings
set workspace_creation_enabled = false,
    updated_at = now()
where singleton = true;

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
    'workspace_creation_enabled', workspace_creation_enabled,
    'updated_at', updated_at
  )
  from nexora_private.platform_settings
  where singleton = true
$$;

create or replace function nexora_private.bot_set_beta_enabled(
  requested_enabled boolean,
  actor_discord_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_discord_id is distinct from '1515743540259328202' then
    raise exception using errcode = '42501', message = 'authorization_owner_required';
  end if;

  update nexora_private.platform_settings
  set beta_enabled = requested_enabled,
      updated_by_discord_id = actor_discord_id,
      updated_at = now()
  where singleton = true;

  return nexora_private.public_platform_settings();
end
$$;

create or replace function nexora_private.bot_set_workspace_creation_enabled(
  requested_enabled boolean,
  actor_discord_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_discord_id is distinct from '1515743540259328202' then
    raise exception using errcode = '42501', message = 'authorization_owner_required';
  end if;

  update nexora_private.platform_settings
  set workspace_creation_enabled = requested_enabled,
      updated_by_discord_id = actor_discord_id,
      updated_at = now()
  where singleton = true;

  return nexora_private.public_platform_settings();
end
$$;

create or replace function public.bot_set_workspace_creation_enabled(
  requested_enabled boolean,
  actor_discord_id text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.bot_set_workspace_creation_enabled(requested_enabled, actor_discord_id)
$$;

create or replace function nexora_private.guard_beta_workspace_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_state jsonb := nexora_private.dashboard_access_state();
  creation_enabled boolean := false;
begin
  if coalesce((access_state->>'staff')::boolean, false) then
    return new;
  end if;

  select coalesce(workspace_creation_enabled, false)
  into creation_enabled
  from nexora_private.platform_settings
  where singleton = true;

  if not creation_enabled then
    raise exception using errcode = '42501', message = 'workspace_creation_paused';
  end if;

  if not coalesce((access_state->>'allowed')::boolean, false) then
    raise exception using errcode = '42501', message = 'beta_selection_required';
  end if;

  return new;
end
$$;

revoke all on function nexora_private.bot_set_workspace_creation_enabled(boolean, text)
  from public, anon, authenticated;
revoke all on function public.bot_set_workspace_creation_enabled(boolean, text)
  from public, anon, authenticated;
grant execute on function nexora_private.bot_set_workspace_creation_enabled(boolean, text)
  to service_role;
grant execute on function public.bot_set_workspace_creation_enabled(boolean, text)
  to service_role;

comment on column nexora_private.platform_settings.workspace_creation_enabled is
  'Owner-controlled launch switch. Staff can always create workspaces; Beta users require this switch.';
