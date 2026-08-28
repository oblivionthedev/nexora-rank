-- Nexora Rank onboarding and single-plan beta foundation.
-- Passwords remain in Supabase Auth. Public profile tables store only whether
-- a backup password was configured, never a password or password hash.

alter table public.profiles
  add column first_name text,
  add column last_name text,
  add column contact_email text,
  add column plan_key text not null default 'free',
  add column plan_selected_at timestamptz,
  add column password_set_at timestamptz,
  add column roblox_link_deferred_at timestamptz,
  add column onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_first_name_length
    check (first_name is null or char_length(first_name) between 1 and 60),
  add constraint profiles_last_name_length
    check (last_name is null or char_length(last_name) between 1 and 60),
  add constraint profiles_contact_email_format
    check (
      contact_email is null
      or (
        char_length(contact_email) between 3 and 254
        and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    ),
  add constraint profiles_plan_key_free_beta check (plan_key = 'free');

create or replace function nexora_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, contact_email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'global_name',
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    contact_email = coalesce(public.profiles.contact_email, excluded.contact_email);
  return new;
end;
$$;

create or replace function nexora_private.sync_current_discord_identity()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  discord_identity record;
  external_id text;
  external_username text;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  select i.provider_id, i.identity_data
  into discord_identity
  from auth.identities i
  where i.user_id = actor_id
    and i.provider = 'discord'
  order by i.created_at
  limit 1;

  if not found then
    return false;
  end if;

  external_id := coalesce(
    discord_identity.identity_data ->> 'sub',
    discord_identity.identity_data ->> 'id',
    discord_identity.provider_id
  );
  external_username := coalesce(
    discord_identity.identity_data ->> 'username',
    discord_identity.identity_data ->> 'user_name',
    discord_identity.identity_data ->> 'name',
    'Discord user'
  );

  insert into public.account_links (
    user_id,
    provider,
    provider_user_id,
    username,
    display_name,
    avatar_url,
    metadata,
    verified_at,
    refreshed_at
  )
  values (
    actor_id,
    'discord',
    external_id,
    external_username,
    coalesce(
      discord_identity.identity_data ->> 'global_name',
      discord_identity.identity_data ->> 'full_name',
      external_username
    ),
    discord_identity.identity_data ->> 'avatar_url',
    jsonb_build_object('source', 'supabase_auth_identity'),
    now(),
    now()
  )
  on conflict (user_id, provider) do update
  set
    provider_user_id = excluded.provider_user_id,
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    metadata = excluded.metadata,
    refreshed_at = now();

  return true;
end;
$$;

revoke all on function nexora_private.sync_current_discord_identity() from public, anon;
grant execute on function nexora_private.sync_current_discord_identity() to authenticated;

create function public.sync_discord_identity()
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.sync_current_discord_identity();
$$;

revoke all on function public.sync_discord_identity() from public, anon;
grant execute on function public.sync_discord_identity() to authenticated;

create or replace function nexora_private.create_workspace(workspace_name text, workspace_slug text)
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
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = actor_id
      and p.first_name is not null
      and p.last_name is not null
      and p.contact_email is not null
      and p.plan_key = 'free'
      and p.plan_selected_at is not null
  ) then
    raise exception using errcode = 'P0001', message = 'onboarding_incomplete';
  end if;

  if exists (
    select 1
    from public.workspace_members wm
    where wm.user_id = actor_id
      and wm.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'free_workspace_limit';
  end if;

  insert into public.workspaces (name, slug, created_by)
  values (trim(workspace_name), lower(trim(workspace_slug)), actor_id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, actor_id, 'owner');

  insert into public.subscriptions (workspace_id, provider, plan_key, status)
  values (new_workspace_id, 'lemon_squeezy', 'free', 'free');

  update public.profiles
  set onboarding_completed_at = now()
  where id = actor_id;

  return new_workspace_id;
end;
$$;

comment on column public.profiles.contact_email is
  'Operational contact address. The authentication email remains managed by Supabase Auth.';
comment on column public.profiles.password_set_at is
  'Timestamp only. Password material is stored exclusively by Supabase Auth.';
comment on column public.profiles.roblox_link_deferred_at is
  'Temporary beta exception while Roblox OAuth provider review or configuration is pending.';
