create table public.group_member_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  roblox_group_id text not null,
  target_roblox_user_id text not null,
  target_username text not null,
  current_role_id text not null,
  current_role_name text not null,
  current_role_rank integer not null check (current_role_rank between 1 and 254),
  action_type text not null check (action_type in ('promote', 'demote', 'terminate', 'kick')),
  requested_role_id text,
  requested_role_name text,
  requested_role_rank integer check (requested_role_rank between 1 and 254),
  reason text not null check (char_length(reason) between 2 and 500),
  status text not null default 'pending' check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text,
  request_key uuid not null default gen_random_uuid() unique,
  constraint group_member_actions_target_id check (target_roblox_user_id ~ '^[0-9]{1,20}$'),
  constraint group_member_actions_group_id check (roblox_group_id ~ '^[0-9]{1,20}$'),
  constraint group_member_actions_role_shape check (
    (action_type = 'kick' and requested_role_id is null and requested_role_name is null and requested_role_rank is null)
    or
    (action_type <> 'kick' and requested_role_id ~ '^[0-9]{1,20}$' and char_length(requested_role_name) between 1 and 100 and requested_role_rank is not null)
  )
);

create index group_member_actions_workspace_requested_idx
  on public.group_member_actions(workspace_id, requested_at desc);
create index group_member_actions_workspace_status_idx
  on public.group_member_actions(workspace_id, status);

alter table public.group_member_actions enable row level security;

create policy group_member_actions_select_member
  on public.group_member_actions for select to authenticated
  using ((select nexora_private.is_workspace_member(workspace_id)));

revoke all on public.group_member_actions from public, anon, authenticated;
grant select on public.group_member_actions to authenticated;

create or replace function nexora_private.request_group_member_action(
  target_workspace_id uuid,
  target_roblox_user_id text,
  target_username text,
  current_role_id text,
  current_role_name text,
  current_role_rank integer,
  requested_action text,
  requested_role_id text,
  requested_role_name text,
  requested_role_rank integer,
  request_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role text;
  group_id text;
  action_id uuid;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  actor_role := nexora_private.workspace_role(target_workspace_id);
  if actor_role not in ('owner', 'admin', 'operator') then
    raise exception using errcode = '42501', message = 'group_member_action_forbidden';
  end if;

  select workspace.roblox_group_id into group_id
  from public.workspaces workspace
  where workspace.id = target_workspace_id;

  if group_id is null then
    raise exception using errcode = 'P0002', message = 'roblox_group_not_connected';
  end if;
  if target_roblox_user_id !~ '^[0-9]{1,20}$'
     or current_role_id !~ '^[0-9]{1,20}$'
     or current_role_rank not between 1 and 254
     or char_length(trim(target_username)) not between 1 and 100
     or char_length(trim(current_role_name)) not between 1 and 100
     or requested_action not in ('promote', 'demote', 'terminate', 'kick')
     or char_length(trim(request_reason)) not between 2 and 500 then
    raise exception using errcode = '22023', message = 'invalid_group_member_action';
  end if;

  if requested_action = 'kick' then
    requested_role_id := null;
    requested_role_name := null;
    requested_role_rank := null;
  else
    if requested_role_id !~ '^[0-9]{1,20}$'
       or char_length(trim(requested_role_name)) not between 1 and 100
       or requested_role_rank not between 1 and 254 then
      raise exception using errcode = '22023', message = 'invalid_requested_group_role';
    end if;
    if requested_action = 'promote' and requested_role_rank <= current_role_rank then
      raise exception using errcode = '22023', message = 'promotion_must_increase_rank';
    end if;
    if requested_action in ('demote', 'terminate') and requested_role_rank >= current_role_rank then
      raise exception using errcode = '22023', message = 'demotion_must_lower_rank';
    end if;
  end if;

  insert into public.group_member_actions (
    workspace_id, roblox_group_id, target_roblox_user_id, target_username,
    current_role_id, current_role_name, current_role_rank, action_type,
    requested_role_id, requested_role_name, requested_role_rank,
    reason, requested_by
  ) values (
    target_workspace_id, group_id, target_roblox_user_id, trim(target_username),
    current_role_id, trim(current_role_name), current_role_rank, requested_action,
    requested_role_id, nullif(trim(coalesce(requested_role_name, '')), ''), requested_role_rank,
    trim(request_reason), actor
  ) returning id into action_id;

  insert into public.workspace_logs (
    workspace_id, source, severity, event_type, summary, actor_user_id, metadata
  ) values (
    target_workspace_id,
    'roblox',
    case when requested_action = 'kick' then 'warning' else 'info' end,
    'group.member.action_requested',
    initcap(requested_action) || ' requested for ' || trim(target_username),
    actor,
    jsonb_build_object(
      'group_member_action_id', action_id,
      'action', requested_action,
      'target_roblox_user_id', target_roblox_user_id,
      'from_role_id', current_role_id,
      'from_role_name', trim(current_role_name),
      'to_role_id', requested_role_id,
      'to_role_name', nullif(trim(coalesce(requested_role_name, '')), ''),
      'reason', trim(request_reason),
      'execution', 'awaiting_approved_roblox_provider'
    )
  );

  return action_id;
end
$$;

create or replace function public.request_group_member_action(
  target_workspace_id uuid,
  target_roblox_user_id text,
  target_username text,
  current_role_id text,
  current_role_name text,
  current_role_rank integer,
  requested_action text,
  requested_role_id text,
  requested_role_name text,
  requested_role_rank integer,
  request_reason text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.request_group_member_action(
    target_workspace_id, target_roblox_user_id, target_username,
    current_role_id, current_role_name, current_role_rank,
    requested_action, requested_role_id, requested_role_name,
    requested_role_rank, request_reason
  )
$$;

revoke all on function nexora_private.request_group_member_action(uuid,text,text,text,text,integer,text,text,text,integer,text)
  from public, anon;
grant execute on function nexora_private.request_group_member_action(uuid,text,text,text,text,integer,text,text,text,integer,text)
  to authenticated;
revoke all on function public.request_group_member_action(uuid,text,text,text,text,integer,text,text,text,integer,text)
  from public, anon;
grant execute on function public.request_group_member_action(uuid,text,text,text,text,integer,text,text,text,integer,text)
  to authenticated;

comment on table public.group_member_actions is
  'Audited Roblox group membership actions queued for approved provider execution.';
