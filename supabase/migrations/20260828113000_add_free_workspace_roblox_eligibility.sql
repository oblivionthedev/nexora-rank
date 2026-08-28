-- Free-tier eligibility for Nexora Rank's required Roblox community.
-- Enforcement is deliberately disabled at migration time while Roblox OAuth is
-- under review. Enable it only after the provider is approved and the cron
-- secret has been configured in nexora_private.platform_policy.

alter table public.profiles
  add column free_roblox_group_status text not null default 'unchecked',
  add column free_roblox_group_checked_at timestamptz;

alter table public.profiles
  add constraint profiles_free_roblox_group_status_check
  check (free_roblox_group_status in ('unchecked', 'member', 'not_member', 'unverifiable'));

alter table public.workspaces
  add column operational_status text not null default 'active',
  add column suspended_at timestamptz,
  add column suspension_reason text;

alter table public.workspaces
  add constraint workspaces_operational_status_check
  check (operational_status in ('active', 'suspended'));

create table nexora_private.platform_policy (
  singleton boolean primary key default true check (singleton),
  free_roblox_membership_enforced boolean not null default false,
  required_roblox_group_id text not null default '596263047',
  membership_grace_hours integer not null default 48 check (membership_grace_hours between 1 and 168),
  cron_secret_sha256 text,
  updated_at timestamptz not null default now()
);

revoke all on table nexora_private.platform_policy from public, anon, authenticated;

insert into nexora_private.platform_policy (singleton)
values (true)
on conflict (singleton) do nothing;

create table public.workspace_roblox_eligibility (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  required_group_id text not null default '596263047',
  status text not null default 'pending',
  last_checked_at timestamptz,
  last_member_at timestamptz,
  grace_started_at timestamptz,
  grace_expires_at timestamptz,
  suspended_at timestamptz,
  last_error_code text,
  updated_at timestamptz not null default now(),
  constraint workspace_roblox_eligibility_status_check
    check (status in ('pending', 'eligible', 'grace', 'suspended', 'exempt', 'unverifiable'))
);

create index workspace_roblox_eligibility_owner_idx
  on public.workspace_roblox_eligibility (owner_user_id, workspace_id);
create index workspace_roblox_eligibility_due_idx
  on public.workspace_roblox_eligibility (grace_expires_at)
  where status = 'grace';

alter table public.workspace_roblox_eligibility enable row level security;

create policy workspace_roblox_eligibility_select_member
on public.workspace_roblox_eligibility
for select
to authenticated
using ((select nexora_private.is_workspace_member(workspace_id)));

grant select on public.workspace_roblox_eligibility to authenticated;
revoke insert, update, delete on public.workspace_roblox_eligibility from anon, authenticated;

insert into public.workspace_roblox_eligibility (workspace_id, owner_user_id)
select wm.workspace_id, wm.user_id
from public.workspace_members wm
where wm.role = 'owner'
on conflict (workspace_id) do nothing;

create or replace function nexora_private.cron_secret_valid(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate is not null
    and p.cron_secret_sha256 is not null
    and encode(extensions.digest(candidate, 'sha256'), 'hex') = p.cron_secret_sha256
  from nexora_private.platform_policy p
  where p.singleton = true;
$$;

revoke all on function nexora_private.cron_secret_valid(text) from public, anon, authenticated;

create or replace function nexora_private.get_free_membership_policy()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'enabled', p.free_roblox_membership_enforced,
    'group_id', p.required_roblox_group_id,
    'grace_hours', p.membership_grace_hours
  )
  from nexora_private.platform_policy p
  where p.singleton = true;
$$;

revoke all on function nexora_private.get_free_membership_policy() from public, anon;
grant execute on function nexora_private.get_free_membership_policy() to authenticated;

create or replace function public.get_free_membership_policy()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select nexora_private.get_free_membership_policy();
$$;

revoke all on function public.get_free_membership_policy() from public, anon;
grant execute on function public.get_free_membership_policy() to authenticated;

create or replace function nexora_private.claim_free_membership_checks(candidate_secret text, batch_size integer default 250)
returns table (
  workspace_id uuid,
  owner_user_id uuid,
  roblox_user_id text,
  plan_key text,
  plan_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'invalid_cron_secret';
  end if;

  if not exists (
    select 1 from nexora_private.platform_policy p
    where p.singleton and p.free_roblox_membership_enforced
  ) then
    return;
  end if;

  return query
  select
    w.id,
    wm.user_id,
    al.provider_user_id,
    coalesce(s.plan_key, 'free'),
    coalesce(s.status, 'free')
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id and wm.role = 'owner'
  left join public.account_links al on al.user_id = wm.user_id and al.provider = 'roblox'
  left join public.subscriptions s on s.workspace_id = w.id
  order by coalesce((
    select e.last_checked_at
    from public.workspace_roblox_eligibility e
    where e.workspace_id = w.id
  ), '-infinity'::timestamptz)
  limit greatest(1, least(batch_size, 500));
end;
$$;

revoke all on function nexora_private.claim_free_membership_checks(text, integer) from public, anon;
grant execute on function nexora_private.claim_free_membership_checks(text, integer) to anon, authenticated;

create or replace function public.claim_free_membership_checks(candidate_secret text, batch_size integer default 250)
returns table (workspace_id uuid, owner_user_id uuid, roblox_user_id text, plan_key text, plan_status text)
language sql
security invoker
set search_path = ''
as $$
  select * from nexora_private.claim_free_membership_checks(candidate_secret, batch_size);
$$;

revoke all on function public.claim_free_membership_checks(text, integer) from public;
grant execute on function public.claim_free_membership_checks(text, integer) to anon, authenticated;

create or replace function nexora_private.record_owner_membership_preflight(
  candidate_secret text,
  target_user_id uuid,
  check_result text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'invalid_cron_secret';
  end if;
  if check_result not in ('member', 'not_member', 'unverifiable') then
    raise exception using errcode = '22023', message = 'invalid_membership_result';
  end if;

  update public.profiles
  set free_roblox_group_status = check_result,
      free_roblox_group_checked_at = now()
  where id = target_user_id;
end;
$$;

revoke all on function nexora_private.record_owner_membership_preflight(text, uuid, text) from public, anon;
grant execute on function nexora_private.record_owner_membership_preflight(text, uuid, text) to anon, authenticated;

create or replace function public.record_owner_membership_preflight(
  candidate_secret text,
  target_user_id uuid,
  check_result text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.record_owner_membership_preflight(candidate_secret, target_user_id, check_result);
$$;

revoke all on function public.record_owner_membership_preflight(text, uuid, text) from public;
grant execute on function public.record_owner_membership_preflight(text, uuid, text) to anon, authenticated;

create or replace function nexora_private.record_free_membership_check(
  candidate_secret text,
  target_workspace_id uuid,
  check_result text,
  error_code text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  policy_row nexora_private.platform_policy%rowtype;
  owner_id uuid;
  current_row public.workspace_roblox_eligibility%rowtype;
  current_plan text;
  current_plan_status text;
  is_paid boolean;
  next_status text;
begin
  if not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'invalid_cron_secret';
  end if;
  if check_result not in ('member', 'not_member', 'unverifiable', 'exempt') then
    raise exception using errcode = '22023', message = 'invalid_membership_result';
  end if;

  select * into policy_row
  from nexora_private.platform_policy p
  where p.singleton = true;

  select wm.user_id into owner_id
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id and wm.role = 'owner'
  limit 1;

  if owner_id is null then
    raise exception using errcode = 'P0002', message = 'workspace_owner_not_found';
  end if;

  select coalesce(s.plan_key, 'free'), coalesce(s.status, 'free')
  into current_plan, current_plan_status
  from public.workspaces w
  left join public.subscriptions s on s.workspace_id = w.id
  where w.id = target_workspace_id
  for update of w;

  is_paid := current_plan <> 'free' and current_plan_status in ('active', 'trialing');

  insert into public.workspace_roblox_eligibility (workspace_id, owner_user_id, required_group_id)
  values (target_workspace_id, owner_id, policy_row.required_roblox_group_id)
  on conflict (workspace_id) do update
    set owner_user_id = excluded.owner_user_id,
        required_group_id = excluded.required_group_id,
        updated_at = now();

  select * into current_row
  from public.workspace_roblox_eligibility e
  where e.workspace_id = target_workspace_id
  for update;

  if is_paid or check_result = 'exempt' then
    update public.workspace_roblox_eligibility
    set status = 'exempt', last_checked_at = now(), grace_started_at = null,
        grace_expires_at = null, suspended_at = null, last_error_code = null, updated_at = now()
    where workspace_id = target_workspace_id;
    update public.workspaces
    set operational_status = 'active', suspended_at = null, suspension_reason = null, updated_at = now()
    where id = target_workspace_id and suspension_reason = 'free_owner_left_required_roblox_group';
    return 'exempt';
  end if;

  if check_result = 'unverifiable' then
    update public.workspace_roblox_eligibility
    set status = case when status = 'pending' then 'unverifiable' else status end,
        last_checked_at = now(), last_error_code = left(coalesce(error_code, 'provider_unavailable'), 80), updated_at = now()
    where workspace_id = target_workspace_id;
    return current_row.status;
  end if;

  update public.profiles
  set free_roblox_group_status = check_result,
      free_roblox_group_checked_at = now()
  where id = owner_id;

  if check_result = 'member' then
    update public.workspace_roblox_eligibility
    set status = 'eligible', last_checked_at = now(), last_member_at = now(),
        grace_started_at = null, grace_expires_at = null, suspended_at = null,
        last_error_code = null, updated_at = now()
    where workspace_id = target_workspace_id;
    update public.workspaces
    set operational_status = 'active', suspended_at = null, suspension_reason = null, updated_at = now()
    where id = target_workspace_id and suspension_reason = 'free_owner_left_required_roblox_group';
    return 'eligible';
  end if;

  if current_row.grace_started_at is null and current_row.suspended_at is null then
    update public.workspace_roblox_eligibility
    set status = 'grace', last_checked_at = now(), grace_started_at = now(),
        grace_expires_at = now() + make_interval(hours => policy_row.membership_grace_hours),
        last_error_code = null, updated_at = now()
    where workspace_id = target_workspace_id;
    return 'grace';
  end if;

  if current_row.grace_expires_at is not null and now() >= current_row.grace_expires_at then
    update public.workspace_roblox_eligibility
    set status = 'suspended', last_checked_at = now(), suspended_at = coalesce(suspended_at, now()),
        last_error_code = null, updated_at = now()
    where workspace_id = target_workspace_id;
    update public.workspaces
    set operational_status = 'suspended', suspended_at = coalesce(suspended_at, now()),
        suspension_reason = 'free_owner_left_required_roblox_group', updated_at = now()
    where id = target_workspace_id;
    return 'suspended';
  end if;

  update public.workspace_roblox_eligibility
  set status = 'grace', last_checked_at = now(), last_error_code = null, updated_at = now()
  where workspace_id = target_workspace_id;
  return 'grace';
end;
$$;

revoke all on function nexora_private.record_free_membership_check(text, uuid, text, text) from public, anon;
grant execute on function nexora_private.record_free_membership_check(text, uuid, text, text) to anon, authenticated;

create or replace function public.record_free_membership_check(
  candidate_secret text,
  target_workspace_id uuid,
  check_result text,
  error_code text default null
)
returns text
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.record_free_membership_check(candidate_secret, target_workspace_id, check_result, error_code);
$$;

revoke all on function public.record_free_membership_check(text, uuid, text, text) from public;
grant execute on function public.record_free_membership_check(text, uuid, text, text) to anon, authenticated;

create or replace function nexora_private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nexora_private.workspace_role(target_workspace_id) in ('owner', 'admin')
    and exists (
      select 1 from public.workspaces w
      where w.id = target_workspace_id and w.operational_status = 'active'
    ),
    false
  );
$$;

create or replace function nexora_private.create_workspace(workspace_name text, workspace_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_workspace_id uuid;
  policy_enabled boolean;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = actor_id
      and p.first_name is not null
      and p.last_name is not null
      and p.contact_email is not null
      and p.plan_key = 'free'
      and p.plan_selected_at is not null
  ) then
    raise exception using errcode = 'P0001', message = 'onboarding_incomplete';
  end if;

  select p.free_roblox_membership_enforced into policy_enabled
  from nexora_private.platform_policy p where p.singleton = true;

  if policy_enabled and not exists (
    select 1 from public.profiles p
    where p.id = actor_id
      and p.free_roblox_group_status = 'member'
      and p.free_roblox_group_checked_at >= now() - interval '15 minutes'
      and exists (
        select 1 from public.account_links al
        where al.user_id = actor_id and al.provider = 'roblox'
      )
  ) then
    raise exception using errcode = 'P0001', message = 'roblox_membership_required';
  end if;

  if exists (
    select 1 from public.workspace_members wm
    where wm.user_id = actor_id and wm.role = 'owner'
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

  insert into public.workspace_roblox_eligibility (
    workspace_id, owner_user_id, status, last_checked_at, last_member_at
  )
  values (
    new_workspace_id, actor_id,
    case when policy_enabled then 'eligible' else 'pending' end,
    case when policy_enabled then now() else null end,
    case when policy_enabled then now() else null end
  );

  update public.profiles set onboarding_completed_at = now() where id = actor_id;
  return new_workspace_id;
end;
$$;

comment on table public.workspace_roblox_eligibility is
  'Automated free-tier owner membership checks for required Roblox community 596263047.';
comment on column public.workspaces.suspension_reason is
  'Machine-readable reason. Membership-policy restoration only clears its own suspension reason.';
