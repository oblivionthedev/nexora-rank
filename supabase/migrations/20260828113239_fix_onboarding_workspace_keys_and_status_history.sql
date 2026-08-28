alter table public.profiles
  add column if not exists selected_roblox_group_id text,
  add column if not exists selected_roblox_group_name text,
  add column if not exists selected_roblox_group_role text;

alter table public.profiles drop constraint if exists profiles_selected_roblox_group_id_check;
alter table public.profiles add constraint profiles_selected_roblox_group_id_check
  check (selected_roblox_group_id is null or selected_roblox_group_id ~ '^[0-9]+$');

alter table public.workspaces
  alter column public_id set default upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 20));

alter table public.workspaces drop constraint if exists workspaces_public_id_format_check;
alter table public.workspaces add constraint workspaces_public_id_format_check
  check (public_id ~ '^[A-Za-z0-9]+$');

create table if not exists public.service_status_snapshots (
  service_key text not null,
  checked_on date not null default (timezone('utc', now()))::date,
  state text not null,
  detail text,
  checked_at timestamptz not null default now(),
  primary key (service_key, checked_on),
  constraint service_status_snapshots_key_check check (service_key ~ '^[a-z0-9-]{2,64}$'),
  constraint service_status_snapshots_state_check check (state in ('operational', 'degraded', 'outage', 'unknown'))
);

alter table public.service_status_snapshots enable row level security;
drop policy if exists service_status_snapshots_public_read on public.service_status_snapshots;
create policy service_status_snapshots_public_read on public.service_status_snapshots
  for select to anon, authenticated using (true);
grant select on public.service_status_snapshots to anon, authenticated;
revoke insert, update, delete on public.service_status_snapshots from anon, authenticated;

create or replace function nexora_private.save_onboarding_profile(
  p_first_name text,
  p_last_name text,
  p_contact_email text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  clean_first text := nullif(btrim(coalesce(p_first_name, '')), '');
  clean_last text := nullif(btrim(coalesce(p_last_name, '')), '');
  clean_email text := lower(nullif(btrim(coalesce(p_contact_email, '')), ''));
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  if clean_first is null or char_length(clean_first) > 60 then raise exception using errcode = 'P0001', message = 'invalid_first_name'; end if;
  if clean_last is null or char_length(clean_last) > 60 then raise exception using errcode = 'P0001', message = 'invalid_last_name'; end if;
  if clean_email is null or char_length(clean_email) > 254 or clean_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = 'P0001', message = 'invalid_contact_email';
  end if;
  insert into public.profiles (id, first_name, last_name, contact_email, display_name)
  values (actor_id, clean_first, clean_last, clean_email, clean_first || ' ' || clean_last)
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    contact_email = excluded.contact_email,
    display_name = excluded.display_name;
end;
$$;

create or replace function public.save_onboarding_profile(p_first_name text, p_last_name text, p_contact_email text)
returns void language sql security invoker set search_path = '' as $$
  select nexora_private.save_onboarding_profile(p_first_name, p_last_name, p_contact_email);
$$;

create or replace function nexora_private.confirm_password_set()
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  password_exists boolean;
  stamped timestamptz;
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  select nullif(u.encrypted_password, '') is not null into password_exists from auth.users u where u.id = actor_id;
  if not coalesce(password_exists, false) then raise exception using errcode = 'P0001', message = 'password_not_set'; end if;
  update public.profiles set password_set_at = coalesce(password_set_at, now()) where id = actor_id returning password_set_at into stamped;
  return stamped;
end;
$$;

create or replace function public.confirm_password_set()
returns timestamptz language sql security invoker set search_path = '' as $$
  select nexora_private.confirm_password_set();
$$;

create or replace function nexora_private.select_onboarding_plan(p_plan_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  clean_plan text := lower(btrim(coalesce(p_plan_key, '')));
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  if clean_plan <> 'free' then raise exception using errcode = 'P0001', message = 'plan_unavailable'; end if;
  insert into public.profiles (id, plan_key, plan_selected_at)
  values (actor_id, clean_plan, now())
  on conflict (id) do update set plan_key = excluded.plan_key, plan_selected_at = now();
end;
$$;

create or replace function public.select_onboarding_plan(p_plan_key text)
returns void language sql security invoker set search_path = '' as $$
  select nexora_private.select_onboarding_plan(p_plan_key);
$$;

create or replace function nexora_private.select_onboarding_roblox_group(
  p_group_id text,
  p_group_name text,
  p_group_role text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  clean_group_id text := btrim(coalesce(p_group_id, ''));
  clean_group_name text := nullif(btrim(coalesce(p_group_name, '')), '');
  clean_group_role text := nullif(btrim(coalesce(p_group_role, '')), '');
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  if clean_group_id !~ '^[0-9]+$' or clean_group_name is null or char_length(clean_group_name) > 120 or char_length(coalesce(clean_group_role, '')) > 120 then
    raise exception using errcode = 'P0001', message = 'invalid_roblox_group';
  end if;
  if not exists (select 1 from public.account_links where user_id = actor_id and provider = 'roblox') then
    raise exception using errcode = 'P0001', message = 'roblox_identity_required';
  end if;
  update public.profiles set
    selected_roblox_group_id = clean_group_id,
    selected_roblox_group_name = clean_group_name,
    selected_roblox_group_role = clean_group_role
  where id = actor_id;
end;
$$;

create or replace function public.select_onboarding_roblox_group(p_group_id text, p_group_name text, p_group_role text)
returns void language sql security invoker set search_path = '' as $$
  select nexora_private.select_onboarding_roblox_group(p_group_id, p_group_name, p_group_role);
$$;

create or replace function nexora_private.create_workspace(workspace_name text, workspace_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  new_workspace_id uuid;
  policy_enabled boolean;
  target_group_id text;
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  if not exists (
    select 1 from public.profiles p where p.id = actor_id
      and p.first_name is not null and p.last_name is not null and p.contact_email is not null
      and p.plan_key = 'free' and p.plan_selected_at is not null
  ) then raise exception using errcode = 'P0001', message = 'onboarding_incomplete'; end if;

  select p.free_roblox_membership_enforced into policy_enabled
  from nexora_private.platform_policy p where p.singleton = true;
  if policy_enabled and not exists (
    select 1 from public.profiles p where p.id = actor_id
      and p.free_roblox_group_status = 'member'
      and p.free_roblox_group_checked_at >= now() - interval '15 minutes'
      and exists (select 1 from public.account_links al where al.user_id = actor_id and al.provider = 'roblox')
  ) then raise exception using errcode = 'P0001', message = 'roblox_membership_required'; end if;
  if exists (select 1 from public.workspace_members wm where wm.user_id = actor_id and wm.role = 'owner') then
    raise exception using errcode = 'P0001', message = 'free_workspace_limit';
  end if;

  select selected_roblox_group_id into target_group_id from public.profiles where id = actor_id;
  insert into public.workspaces (name, slug, created_by, roblox_group_id)
  values (trim(workspace_name), lower(trim(workspace_slug)), actor_id, target_group_id)
  returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (new_workspace_id, actor_id, 'owner');
  insert into public.subscriptions (workspace_id, provider, plan_key, status) values (new_workspace_id, 'lemon_squeezy', 'free', 'free');
  insert into public.workspace_roblox_eligibility (workspace_id, owner_user_id, status, last_checked_at, last_member_at)
  values (new_workspace_id, actor_id, case when policy_enabled then 'eligible' else 'pending' end,
    case when policy_enabled then now() else null end, case when policy_enabled then now() else null end);
  update public.profiles set onboarding_completed_at = now() where id = actor_id;
  return new_workspace_id;
end;
$$;

create or replace function nexora_private.rotate_workspace_api_key(p_workspace_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  raw_key text;
  prefix text;
  digest_hex text;
  new_id uuid;
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  if not nexora_private.can_manage_workspace(p_workspace_id) then raise exception using errcode = 'P0001', message = 'not_authorized'; end if;
  raw_key := substr(translate(encode(extensions.gen_random_bytes(24), 'base64'), E'+/=\n', '-_'), 1, 25);
  if char_length(raw_key) <> 25 then raise exception using errcode = 'P0001', message = 'key_generation_failed'; end if;
  prefix := substr(raw_key, 1, 6);
  digest_hex := encode(extensions.digest(raw_key, 'sha256'), 'hex');
  update public.api_keys set revoked_at = coalesce(revoked_at, now()) where workspace_id = p_workspace_id and revoked_at is null;
  insert into public.api_keys (workspace_id, name, key_prefix, key_hash, scopes, created_by)
  values (p_workspace_id, 'Workspace API key', prefix, digest_hex, array['workspace']::text[], actor_id)
  returning id into new_id;
  return jsonb_build_object('id', new_id, 'key_prefix', prefix, 'api_key', raw_key);
end;
$$;

create or replace function public.rotate_workspace_api_key(p_workspace_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select nexora_private.rotate_workspace_api_key(p_workspace_id);
$$;

create or replace function nexora_private.record_status_snapshots(candidate_secret text, snapshots jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  expected_hash text;
  written integer;
begin
  select cron_secret_hash into expected_hash from nexora_private.platform_policy where singleton = true;
  if expected_hash is null or encode(extensions.digest(coalesce(candidate_secret, ''), 'sha256'), 'hex') <> expected_hash then
    raise exception using errcode = 'P0001', message = 'invalid_cron_secret';
  end if;
  if jsonb_typeof(snapshots) <> 'array' then raise exception using errcode = 'P0001', message = 'invalid_snapshots'; end if;
  with incoming as (
    select item->>'key' service_key, item->>'state' state, nullif(item->>'detail', '') detail
    from jsonb_array_elements(snapshots) item
  ), upserted as (
    insert into public.service_status_snapshots (service_key, state, detail)
    select service_key, state, detail from incoming
    where service_key ~ '^[a-z0-9-]{2,64}$' and state in ('operational','degraded','outage','unknown')
    on conflict (service_key, checked_on) do update set state = excluded.state, detail = excluded.detail, checked_at = now()
    returning 1
  ) select count(*) into written from upserted;
  return written;
end;
$$;

create or replace function public.record_status_snapshots(candidate_secret text, snapshots jsonb)
returns integer language sql security invoker set search_path = '' as $$
  select nexora_private.record_status_snapshots(candidate_secret, snapshots);
$$;

update public.profiles p set password_set_at = coalesce(p.password_set_at, now())
from auth.users u where u.id = p.id and nullif(u.encrypted_password, '') is not null and p.password_set_at is null;

revoke all on function public.save_onboarding_profile(text,text,text) from public, anon;
revoke all on function public.confirm_password_set() from public, anon;
revoke all on function public.select_onboarding_plan(text) from public, anon;
revoke all on function public.select_onboarding_roblox_group(text,text,text) from public, anon;
revoke all on function public.rotate_workspace_api_key(uuid) from public, anon;
revoke all on function public.record_status_snapshots(text,jsonb) from public, anon, authenticated;
grant execute on function public.save_onboarding_profile(text,text,text) to authenticated;
grant execute on function public.confirm_password_set() to authenticated;
grant execute on function public.select_onboarding_plan(text) to authenticated;
grant execute on function public.select_onboarding_roblox_group(text,text,text) to authenticated;
grant execute on function public.rotate_workspace_api_key(uuid) to authenticated;
grant execute on function public.record_status_snapshots(text,jsonb) to anon;
grant usage on schema nexora_private to anon, authenticated;
grant execute on function nexora_private.save_onboarding_profile(text,text,text) to authenticated;
grant execute on function nexora_private.confirm_password_set() to authenticated;
grant execute on function nexora_private.select_onboarding_plan(text) to authenticated;
grant execute on function nexora_private.select_onboarding_roblox_group(text,text,text) to authenticated;
grant execute on function nexora_private.rotate_workspace_api_key(uuid) to authenticated;
grant execute on function nexora_private.record_status_snapshots(text,jsonb) to anon;
