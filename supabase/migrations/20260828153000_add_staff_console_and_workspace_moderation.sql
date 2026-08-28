-- Platform staff authorization and auditable workspace moderation.

alter table public.workspaces
  add column moderation_status text not null default 'clear',
  add column moderation_reason text,
  add column moderated_at timestamptz,
  add column moderated_by uuid references public.profiles(id) on delete set null;

alter table public.workspaces
  add constraint workspaces_moderation_status_check
  check (moderation_status in ('clear', 'suspended', 'banned'));

create index workspaces_moderation_status_idx
  on public.workspaces (moderation_status, created_at desc);

create table public.staff_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_members_role_check
    check (role in ('owner', 'admin', 'moderator', 'support'))
);

create table public.staff_action_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  action_type text not null,
  target_workspace_id uuid references public.workspaces(id) on delete set null,
  target_staff_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint staff_action_log_action_check check (
    action_type in (
      'workspace_suspended', 'workspace_restored', 'workspace_banned',
      'staff_role_granted', 'staff_role_revoked'
    )
  ),
  constraint staff_action_log_reason_length_check
    check (char_length(reason) between 4 and 500)
);

create index staff_action_log_created_idx on public.staff_action_log (created_at desc);
create index staff_action_log_workspace_idx
  on public.staff_action_log (target_workspace_id, created_at desc)
  where target_workspace_id is not null;

alter table public.staff_members enable row level security;
alter table public.staff_action_log enable row level security;

revoke all on public.staff_members from public, anon, authenticated;
revoke all on public.staff_action_log from public, anon, authenticated;
revoke all on sequence public.staff_action_log_id_seq from public, anon, authenticated;

-- Bootstrap the sole existing account as the initial platform owner. This is
-- deterministic and does not embed an environment-specific user identifier.
insert into public.staff_members (user_id, role, created_by)
select p.id, 'owner', p.id
from public.profiles p
where (select count(*) from public.profiles) = 1
on conflict (user_id) do nothing;

create or replace function nexora_private.current_staff_role(actor_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select sm.role
  from public.staff_members sm
  where sm.user_id = actor_id and sm.active = true
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
begin
  if actor_id is null then
    return jsonb_build_object('authorized', false);
  end if;

  actor_role := nexora_private.current_staff_role(actor_id);
  return jsonb_build_object(
    'authorized', actor_role is not null,
    'role', actor_role,
    'can_moderate', actor_role in ('owner', 'admin', 'moderator'),
    'can_ban', actor_role in ('owner', 'admin'),
    'can_manage_staff', actor_role in ('owner', 'admin')
  );
end;
$$;

create or replace function nexora_private.staff_console_state(
  search_query text default null,
  status_filter text default 'all'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  normalized_query text := nullif(trim(search_query), '');
  normalized_status text := coalesce(nullif(status_filter, ''), 'all');
  workspace_rows jsonb;
  staff_rows jsonb;
  recent_rows jsonb;
begin
  actor_role := nexora_private.current_staff_role(actor_id);
  if actor_role is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;

  if normalized_status not in ('all', 'active', 'suspended', 'banned') then
    raise exception using errcode = '22023', message = 'invalid_status_filter';
  end if;

  select coalesce(jsonb_agg(row_data order by row_data->>'created_at' desc), '[]'::jsonb)
  into workspace_rows
  from (
    select jsonb_build_object(
      'id', w.id,
      'public_id', w.public_id,
      'name', w.name,
      'plan', coalesce(s.plan_key, 'free'),
      'subscription_status', coalesce(s.status, 'free'),
      'operational_status', w.operational_status,
      'moderation_status', w.moderation_status,
      'moderation_reason', w.moderation_reason,
      'moderated_at', w.moderated_at,
      'owner_name', coalesce(p.display_name, p.first_name, 'Nexora operator'),
      'owner_email', coalesce(p.contact_email, u.email),
      'created_at', w.created_at
    ) as row_data
    from public.workspaces w
    left join public.profiles p on p.id = w.created_by
    left join auth.users u on u.id = w.created_by
    left join lateral (
      select sub.plan_key, sub.status
      from public.subscriptions sub
      where sub.workspace_id = w.id
      order by sub.updated_at desc
      limit 1
    ) s on true
    where (
      normalized_status = 'all'
      or (normalized_status = 'active' and w.operational_status = 'active')
      or (normalized_status = 'suspended' and w.moderation_status = 'suspended')
      or (normalized_status = 'banned' and w.moderation_status = 'banned')
    )
    and (
      normalized_query is null
      or w.name ilike '%' || normalized_query || '%'
      or w.public_id ilike '%' || normalized_query || '%'
      or coalesce(p.display_name, '') ilike '%' || normalized_query || '%'
      or coalesce(p.contact_email, u.email, '') ilike '%' || normalized_query || '%'
    )
    order by w.created_at desc
    limit 100
  ) rows;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', sm.user_id,
    'role', sm.role,
    'active', sm.active,
    'display_name', coalesce(p.display_name, p.first_name, 'Nexora operator'),
    'email', coalesce(p.contact_email, u.email),
    'created_at', sm.created_at
  ) order by sm.created_at), '[]'::jsonb)
  into staff_rows
  from public.staff_members sm
  left join public.profiles p on p.id = sm.user_id
  left join auth.users u on u.id = sm.user_id
  where sm.active = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id,
    'action_type', l.action_type,
    'reason', l.reason,
    'workspace_name', w.name,
    'actor_name', coalesce(p.display_name, p.first_name, 'Nexora staff'),
    'created_at', l.created_at
  ) order by l.created_at desc), '[]'::jsonb)
  into recent_rows
  from (
    select * from public.staff_action_log order by created_at desc limit 20
  ) l
  left join public.workspaces w on w.id = l.target_workspace_id
  left join public.profiles p on p.id = l.actor_user_id;

  return jsonb_build_object(
    'access', nexora_private.staff_access_state(),
    'counts', jsonb_build_object(
      'total', (select count(*) from public.workspaces),
      'active', (select count(*) from public.workspaces where operational_status = 'active'),
      'suspended', (select count(*) from public.workspaces where moderation_status = 'suspended'),
      'banned', (select count(*) from public.workspaces where moderation_status = 'banned')
    ),
    'workspaces', workspace_rows,
    'staff', staff_rows,
    'recent_actions', recent_rows
  );
end;
$$;

create or replace function nexora_private.staff_moderate_workspace(
  target_workspace_id uuid,
  moderation_action text,
  action_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_row public.workspaces%rowtype;
  eligibility_status text;
  next_operational_status text;
  next_moderation_status text;
  next_reason text;
  log_action text;
begin
  actor_role := nexora_private.current_staff_role(actor_id);
  if actor_role not in ('owner', 'admin', 'moderator') then
    raise exception using errcode = '42501', message = 'staff_moderation_denied';
  end if;
  if moderation_action not in ('suspend', 'restore', 'ban') then
    raise exception using errcode = '22023', message = 'invalid_moderation_action';
  end if;
  if moderation_action = 'ban' and actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_ban_denied';
  end if;
  if char_length(trim(coalesce(action_reason, ''))) not between 4 and 500 then
    raise exception using errcode = '22023', message = 'moderation_reason_required';
  end if;

  select * into target_row
  from public.workspaces
  where id = target_workspace_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'workspace_not_found';
  end if;

  if moderation_action = 'suspend' then
    next_operational_status := 'suspended';
    next_moderation_status := 'suspended';
    next_reason := trim(action_reason);
    log_action := 'workspace_suspended';
  elsif moderation_action = 'ban' then
    next_operational_status := 'suspended';
    next_moderation_status := 'banned';
    next_reason := trim(action_reason);
    log_action := 'workspace_banned';
  else
    select e.status into eligibility_status
    from public.workspace_roblox_eligibility e
    where e.workspace_id = target_workspace_id;
    next_moderation_status := 'clear';
    log_action := 'workspace_restored';
    if eligibility_status = 'suspended' then
      next_operational_status := 'suspended';
      next_reason := 'free_owner_left_required_roblox_group';
    else
      next_operational_status := 'active';
      next_reason := null;
    end if;
  end if;

  update public.workspaces
  set operational_status = next_operational_status,
      moderation_status = next_moderation_status,
      moderation_reason = case when next_moderation_status = 'clear' then null else next_reason end,
      moderated_at = now(),
      moderated_by = actor_id,
      suspended_at = case when next_operational_status = 'suspended' then coalesce(suspended_at, now()) else null end,
      suspension_reason = next_reason,
      updated_at = now()
  where id = target_workspace_id;

  insert into public.staff_action_log (
    actor_user_id, action_type, target_workspace_id, reason, previous_state, new_state
  ) values (
    actor_id,
    log_action,
    target_workspace_id,
    trim(action_reason),
    jsonb_build_object(
      'operational_status', target_row.operational_status,
      'moderation_status', target_row.moderation_status,
      'reason', coalesce(target_row.moderation_reason, target_row.suspension_reason)
    ),
    jsonb_build_object(
      'operational_status', next_operational_status,
      'moderation_status', next_moderation_status,
      'reason', next_reason
    )
  );

  return jsonb_build_object(
    'workspace_id', target_workspace_id,
    'operational_status', next_operational_status,
    'moderation_status', next_moderation_status
  );
end;
$$;

create or replace function nexora_private.staff_grant_role(
  target_email text,
  target_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_id uuid;
  existing_role text;
begin
  actor_role := nexora_private.current_staff_role(actor_id);
  if actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  if target_role not in ('admin', 'moderator', 'support') then
    raise exception using errcode = '22023', message = 'invalid_staff_role';
  end if;
  if actor_role = 'admin' and target_role = 'admin' then
    raise exception using errcode = '42501', message = 'owner_role_required';
  end if;

  select p.id into target_id
  from public.profiles p
  left join auth.users u on u.id = p.id
  where lower(coalesce(p.contact_email, u.email, '')) = lower(trim(target_email))
  limit 1;
  if target_id is null then
    raise exception using errcode = 'P0002', message = 'nexora_account_not_found';
  end if;

  select sm.role into existing_role from public.staff_members sm where sm.user_id = target_id;
  if existing_role = 'owner' then
    raise exception using errcode = '42501', message = 'owner_role_cannot_be_changed';
  end if;
  if actor_role = 'admin' and existing_role = 'admin' then
    raise exception using errcode = '42501', message = 'owner_role_required';
  end if;

  insert into public.staff_members (user_id, role, active, created_by)
  values (target_id, target_role, true, actor_id)
  on conflict (user_id) do update
    set role = excluded.role, active = true, updated_at = now();

  insert into public.staff_action_log (
    actor_user_id, action_type, target_staff_user_id, reason, previous_state, new_state
  ) values (
    actor_id, 'staff_role_granted', target_id, 'Staff access assigned',
    jsonb_build_object('role', existing_role), jsonb_build_object('role', target_role)
  );
  return jsonb_build_object('user_id', target_id, 'role', target_role);
end;
$$;

create or replace function nexora_private.staff_revoke_role(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_role text;
begin
  actor_role := nexora_private.current_staff_role(actor_id);
  if actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  select sm.role into target_role from public.staff_members sm where sm.user_id = target_user_id and sm.active = true;
  if target_role is null then
    raise exception using errcode = 'P0002', message = 'staff_member_not_found';
  end if;
  if target_role = 'owner' or (actor_role = 'admin' and target_role = 'admin') then
    raise exception using errcode = '42501', message = 'owner_role_required';
  end if;

  update public.staff_members set active = false, updated_at = now() where user_id = target_user_id;
  insert into public.staff_action_log (
    actor_user_id, action_type, target_staff_user_id, reason, previous_state, new_state
  ) values (
    actor_id, 'staff_role_revoked', target_user_id, 'Staff access revoked',
    jsonb_build_object('role', target_role, 'active', true), jsonb_build_object('role', target_role, 'active', false)
  );
  return true;
end;
$$;

-- PostgREST-facing wrappers run with the caller's identity. Their private
-- implementations perform the role check again inside the database.
create or replace function public.staff_access_state()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.staff_access_state() $$;

create or replace function public.staff_console_state(search_query text default null, status_filter text default 'all')
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.staff_console_state(search_query, status_filter) $$;

create or replace function public.staff_moderate_workspace(target_workspace_id uuid, moderation_action text, action_reason text)
returns jsonb language sql security invoker set search_path = ''
as $$ select nexora_private.staff_moderate_workspace(target_workspace_id, moderation_action, action_reason) $$;

create or replace function public.staff_grant_role(target_email text, target_role text)
returns jsonb language sql security invoker set search_path = ''
as $$ select nexora_private.staff_grant_role(target_email, target_role) $$;

create or replace function public.staff_revoke_role(target_user_id uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_revoke_role(target_user_id) $$;

revoke all on function nexora_private.current_staff_role(uuid) from public, anon;
revoke all on function nexora_private.staff_access_state() from public, anon;
revoke all on function nexora_private.staff_console_state(text, text) from public, anon;
revoke all on function nexora_private.staff_moderate_workspace(uuid, text, text) from public, anon;
revoke all on function nexora_private.staff_grant_role(text, text) from public, anon;
revoke all on function nexora_private.staff_revoke_role(uuid) from public, anon;
grant usage on schema nexora_private to authenticated;
grant execute on function nexora_private.staff_access_state() to authenticated;
grant execute on function nexora_private.staff_console_state(text, text) to authenticated;
grant execute on function nexora_private.staff_moderate_workspace(uuid, text, text) to authenticated;
grant execute on function nexora_private.staff_grant_role(text, text) to authenticated;
grant execute on function nexora_private.staff_revoke_role(uuid) to authenticated;

revoke all on function public.staff_access_state() from public, anon;
revoke all on function public.staff_console_state(text, text) from public, anon;
revoke all on function public.staff_moderate_workspace(uuid, text, text) from public, anon;
revoke all on function public.staff_grant_role(text, text) from public, anon;
revoke all on function public.staff_revoke_role(uuid) from public, anon;
grant execute on function public.staff_access_state() to authenticated;
grant execute on function public.staff_console_state(text, text) to authenticated;
grant execute on function public.staff_moderate_workspace(uuid, text, text) to authenticated;
grant execute on function public.staff_grant_role(text, text) to authenticated;
grant execute on function public.staff_revoke_role(uuid) to authenticated;

comment on table public.staff_members is 'Platform-level Nexora staff authorization; not workspace membership.';
comment on table public.staff_action_log is 'Immutable audit trail for platform staff moderation and access changes.';
comment on column public.workspaces.moderation_status is 'Manual platform moderation state. Bans are reversible only by authorized staff.';
