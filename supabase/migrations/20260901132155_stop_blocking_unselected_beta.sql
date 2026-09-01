-- A signed-in user who has not been selected for Beta is expected traffic,
-- not an intrusion attempt. Keep the database safe even if a future caller
-- accidentally reports that routine access denial again.
create or replace function nexora_private.report_security_incident(
  requested_scope text,
  requested_target text default null,
  requested_details jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  clean_target text := left(nullif(trim(coalesce(requested_target, '')), ''), 160);
  clean_reason text;
  incident_key text;
  incident_id bigint;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if requested_scope not in ('staff_login', 'staff_access', 'workspace_access', 'dashboard_access')
     or jsonb_typeof(coalesce(requested_details, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_security_incident';
  end if;

  clean_reason := left(
    coalesce(nullif(trim(requested_details->>'reason'), ''), requested_scope || '_unauthorized'),
    500
  );

  if requested_scope = 'dashboard_access' and clean_reason = 'beta_selection_required' then
    return 0;
  end if;

  select lower(nullif(trim(users.email), ''))
    into actor_email
    from auth.users users
   where users.id = actor;
  actor_email := coalesce(actor_email, actor::text || '@no-email.nexora');
  incident_key := actor::text || ':' || requested_scope || ':' || coalesce(clean_target, '');

  insert into nexora_private.security_incidents (
    dedupe_key, actor_user_id, scope, target_ref, details
  ) values (
    incident_key, actor, requested_scope, clean_target, coalesce(requested_details, '{}'::jsonb)
  )
  on conflict (dedupe_key) do update set
    details = excluded.details,
    occurrence_count = nexora_private.security_incidents.occurrence_count + 1,
    last_seen_at = now(),
    last_alerted_at = case
      when nexora_private.security_incidents.resolved_at is not null then null
      else nexora_private.security_incidents.last_alerted_at
    end,
    resolved_at = null,
    resolved_by = null
  returning id into incident_id;

  insert into nexora_private.security_account_blocks (
    user_id, email, reason, source_incident_id, blocked_at, blocked_until
  ) values (
    actor, actor_email, clean_reason, incident_id, now(), now() + interval '24 hours'
  )
  on conflict (user_id) do update set
    email = excluded.email,
    reason = excluded.reason,
    source_incident_id = excluded.source_incident_id,
    blocked_at = case
      when nexora_private.security_account_blocks.unblocked_at is not null
        or nexora_private.security_account_blocks.blocked_until <= now()
      then now()
      else nexora_private.security_account_blocks.blocked_at
    end,
    blocked_until = greatest(
      nexora_private.security_account_blocks.blocked_until,
      now() + interval '24 hours'
    ),
    unblocked_at = null,
    unblocked_by = null,
    updated_at = now();

  return incident_id;
end
$$;

-- Repair only blocks that were created by the mistaken Beta-selection rule.
update nexora_private.security_account_blocks
set blocked_until = now(),
    unblocked_at = now(),
    updated_at = now()
where reason = 'beta_selection_required'
  and unblocked_at is null
  and blocked_until > now();

update nexora_private.security_incidents
set resolved_at = now(),
    last_alerted_at = now()
where scope = 'dashboard_access'
  and details->>'reason' = 'beta_selection_required'
  and resolved_at is null;
