create table nexora_private.security_account_blocks (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  reason text not null,
  source_incident_id bigint references nexora_private.security_incidents(id) on delete set null,
  blocked_at timestamptz not null default now(),
  blocked_until timestamptz not null,
  unblocked_at timestamptz,
  unblocked_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint security_account_blocks_email_length check (char_length(email) between 3 and 320),
  constraint security_account_blocks_reason_length check (char_length(reason) between 2 and 500),
  constraint security_account_blocks_window check (blocked_until >= blocked_at)
);

create index security_account_blocks_active_idx
  on nexora_private.security_account_blocks (blocked_until desc)
  where unblocked_at is null;
alter table nexora_private.security_account_blocks enable row level security;
alter table nexora_private.security_account_blocks force row level security;
revoke all on table nexora_private.security_account_blocks from public, anon, authenticated;
revoke all on sequence nexora_private.security_account_blocks_id_seq from public, anon, authenticated;
grant select, insert, update, delete on table nexora_private.security_account_blocks to service_role;
grant usage, select on sequence nexora_private.security_account_blocks_id_seq to service_role;

create or replace function nexora_private.account_block_state()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((
    select jsonb_build_object(
      'blocked', true, 'block_id', block.id, 'email', block.email,
      'reason', block.reason, 'blocked_at', block.blocked_at,
      'blocked_until', block.blocked_until
    )
    from nexora_private.security_account_blocks block
    where block.user_id = auth.uid() and block.unblocked_at is null and block.blocked_until > now()
  ), jsonb_build_object('blocked', false));
$$;
create or replace function public.account_block_state()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.account_block_state() $$;

create or replace function nexora_private.current_staff_role(actor_id uuid default auth.uid())
returns text language sql stable security definer set search_path = '' as $$
  select role from (
    select sm.role, case sm.role when 'owner' then 5 when 'admin' then 4 when 'moderator' then 3 else 2 end as weight
    from public.staff_members sm where sm.user_id = actor_id and sm.active = true
    union all
    select ss.role, case ss.role when 'admin' then 4 when 'moderator' then 3 else 2 end as weight
    from nexora_private.staff_sessions ss
    where ss.user_id = actor_id and ss.revoked_at is null and ss.expires_at > now()
  ) authorized_roles
  where not exists (
    select 1 from nexora_private.security_account_blocks block
    where block.user_id = actor_id and block.unblocked_at is null and block.blocked_until > now()
  )
  order by weight desc limit 1
$$;

create or replace function nexora_private.workspace_role(target_workspace_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select wm.role from public.workspace_members wm
  where wm.workspace_id = target_workspace_id and wm.user_id = (select auth.uid())
    and not exists (
      select 1 from nexora_private.security_account_blocks block
      where block.user_id = (select auth.uid()) and block.unblocked_at is null and block.blocked_until > now()
    )
  limit 1;
$$;

create or replace function nexora_private.dashboard_access_state()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid(); staff_role text; beta_selected boolean := false; block_state jsonb;
begin
  if actor is null then return jsonb_build_object('allowed', false, 'reason', 'sign_in_required'); end if;
  block_state := nexora_private.account_block_state();
  if coalesce((block_state->>'blocked')::boolean, false) then
    return jsonb_build_object('allowed', false, 'reason', 'security_blocked', 'blocked', true, 'blocked_until', block_state->>'blocked_until');
  end if;
  staff_role := nexora_private.current_staff_role(actor);
  select exists (
    select 1 from public.account_links link
    join nexora_private.beta_applications application on application.discord_user_id = link.provider_user_id
    where link.user_id = actor and link.provider = 'discord' and application.status = 'selected' and application.archived_at is null
  ) into beta_selected;
  return jsonb_build_object(
    'allowed', staff_role is not null or beta_selected, 'staff', staff_role is not null,
    'staff_role', staff_role, 'beta_selected', beta_selected, 'blocked', false,
    'reason', case when staff_role is not null then 'staff' when beta_selected then 'beta_selected' else 'beta_selection_required' end
  );
end
$$;

create or replace function nexora_private.report_security_incident(
  requested_scope text, requested_target text default null, requested_details jsonb default '{}'::jsonb
)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); actor_email text;
  clean_target text := left(nullif(trim(coalesce(requested_target, '')), ''), 160);
  clean_reason text; incident_key text; incident_id bigint;
begin
  if actor is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if requested_scope not in ('staff_login', 'staff_access', 'workspace_access', 'dashboard_access')
     or jsonb_typeof(coalesce(requested_details, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_security_incident';
  end if;
  select lower(nullif(trim(users.email), '')) into actor_email from auth.users users where users.id = actor;
  actor_email := coalesce(actor_email, actor::text || '@no-email.nexora');
  clean_reason := left(coalesce(nullif(trim(requested_details->>'reason'), ''), requested_scope || '_unauthorized'), 500);
  incident_key := actor::text || ':' || requested_scope || ':' || coalesce(clean_target, '');
  insert into nexora_private.security_incidents (dedupe_key, actor_user_id, scope, target_ref, details)
  values (incident_key, actor, requested_scope, clean_target, coalesce(requested_details, '{}'::jsonb))
  on conflict (dedupe_key) do update set
    details = excluded.details, occurrence_count = nexora_private.security_incidents.occurrence_count + 1,
    last_seen_at = now(),
    last_alerted_at = case when nexora_private.security_incidents.resolved_at is not null then null else nexora_private.security_incidents.last_alerted_at end,
    resolved_at = null, resolved_by = null
  returning id into incident_id;
  insert into nexora_private.security_account_blocks (user_id, email, reason, source_incident_id, blocked_at, blocked_until)
  values (actor, actor_email, clean_reason, incident_id, now(), now() + interval '24 hours')
  on conflict (user_id) do update set
    email = excluded.email, reason = excluded.reason, source_incident_id = excluded.source_incident_id,
    blocked_at = case when nexora_private.security_account_blocks.unblocked_at is not null
      or nexora_private.security_account_blocks.blocked_until <= now() then now() else nexora_private.security_account_blocks.blocked_at end,
    blocked_until = greatest(nexora_private.security_account_blocks.blocked_until, now() + interval '24 hours'),
    unblocked_at = null, unblocked_by = null, updated_at = now();
  return incident_id;
end
$$;

create or replace function nexora_private.staff_security_incidents()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if nexora_private.current_staff_role(auth.uid()) is null then raise exception using errcode = '42501', message = 'staff_access_denied'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', incident.id, 'scope', incident.scope, 'target_ref', incident.target_ref,
    'details', incident.details, 'occurrence_count', incident.occurrence_count,
    'first_seen_at', incident.first_seen_at, 'last_seen_at', incident.last_seen_at,
    'last_alerted_at', incident.last_alerted_at, 'resolved_at', incident.resolved_at,
    'actor_user_id', incident.actor_user_id, 'actor_email', users.email,
    'block_id', block.id, 'blocked_until', block.blocked_until,
    'block_active', coalesce(block.unblocked_at is null and block.blocked_until > now(), false),
    'unblocked_at', block.unblocked_at
  ) order by incident.resolved_at nulls first, incident.last_seen_at desc)
  from nexora_private.security_incidents incident
  left join auth.users users on users.id = incident.actor_user_id
  left join nexora_private.security_account_blocks block on block.user_id = incident.actor_user_id), '[]'::jsonb);
end
$$;

alter table public.staff_action_log drop constraint if exists staff_action_log_action_check;
alter table public.staff_action_log add constraint staff_action_log_action_check check (action_type in (
  'workspace_suspended', 'workspace_restored', 'workspace_banned', 'staff_role_granted', 'staff_role_revoked',
  'security_incident_resolved', 'security_account_unblocked'
));

create or replace function nexora_private.staff_unblock_security_account(requested_block_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor); blocked_email text;
begin
  if actor_role not in ('owner', 'admin') then raise exception using errcode = '42501', message = 'staff_management_denied'; end if;
  update nexora_private.security_account_blocks
  set blocked_until = now(), unblocked_at = now(), unblocked_by = actor, updated_at = now()
  where id = requested_block_id and unblocked_at is null and blocked_until > now()
  returning email into blocked_email;
  if not found then return false; end if;
  insert into public.staff_action_log (actor_user_id, action_type, reason)
  values (actor, 'security_account_unblocked', 'Unblocked security account ' || blocked_email);
  return true;
end
$$;
create or replace function public.staff_unblock_security_account(requested_block_id bigint)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_unblock_security_account(requested_block_id) $$;

revoke all on function nexora_private.account_block_state() from public, anon;
grant execute on function nexora_private.account_block_state() to authenticated;
revoke all on function public.account_block_state() from public, anon;
grant execute on function public.account_block_state() to authenticated;
revoke all on function nexora_private.staff_unblock_security_account(bigint) from public, anon;
grant execute on function nexora_private.staff_unblock_security_account(bigint) to authenticated;
revoke all on function public.staff_unblock_security_account(bigint) from public, anon;
grant execute on function public.staff_unblock_security_account(bigint) to authenticated;

comment on table nexora_private.security_account_blocks is
  'Server-enforced 24-hour account and email locks created by unauthorized access incidents.';
