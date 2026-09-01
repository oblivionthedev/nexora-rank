alter table nexora_private.beta_applications
  add column if not exists reapply_wait_bypassed_at timestamptz,
  add column if not exists reapply_wait_bypassed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reapply_wait_bypass_reason text;

create index if not exists beta_applications_reapply_bypassed_by_idx
  on nexora_private.beta_applications(reapply_wait_bypassed_by)
  where reapply_wait_bypassed_by is not null;

create or replace function nexora_private.dashboard_access_state()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  staff_role text;
  beta_selected boolean := false;
  workspace_member boolean := false;
  block_state jsonb;
begin
  if actor is null then
    return jsonb_build_object('allowed', false, 'reason', 'sign_in_required');
  end if;
  block_state := nexora_private.account_block_state();
  if coalesce((block_state->>'blocked')::boolean, false) then
    return jsonb_build_object('allowed', false, 'reason', 'security_blocked', 'blocked', true, 'blocked_until', block_state->>'blocked_until');
  end if;
  staff_role := nexora_private.current_staff_role(actor);
  select exists (
    select 1 from public.account_links link
    join nexora_private.beta_applications application on application.discord_user_id = link.provider_user_id
    where link.user_id = actor and link.provider = 'discord'
      and application.status = 'selected' and application.archived_at is null
  ) into beta_selected;
  select exists (
    select 1 from public.workspace_members member
    join public.workspaces workspace on workspace.id = member.workspace_id
    where member.user_id = actor
      and workspace.lifecycle_status <> 'deleted'
  ) into workspace_member;
  return jsonb_build_object(
    'allowed', staff_role is not null or beta_selected or workspace_member,
    'staff', staff_role is not null, 'staff_role', staff_role,
    'beta_selected', beta_selected, 'workspace_member', workspace_member,
    'blocked', false,
    'reason', case
      when staff_role is not null then 'staff'
      when beta_selected then 'beta_selected'
      when workspace_member then 'workspace_member'
      else 'beta_selection_required'
    end
  );
end $$;

create or replace function nexora_private.submit_beta_application(
  applicant_name text, applicant_email text, applicant_age integer
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  discord_link public.account_links;
  existing nexora_private.beta_applications;
  clean_name text := trim(coalesce(applicant_name, ''));
  clean_email text := lower(trim(coalesce(applicant_email, '')));
  raw_code text := 'NXB-' || upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 20));
  application_id uuid;
  retry_at timestamptz;
begin
  if actor is null then return jsonb_build_object('ok', false, 'error', 'discord_required'); end if;
  select * into discord_link from public.account_links
  where user_id = actor and provider = 'discord' and verified_at is not null;
  if discord_link.provider_user_id is null then return jsonb_build_object('ok', false, 'error', 'discord_required'); end if;
  if not coalesce((select beta_enabled from nexora_private.platform_settings where singleton = true), false) then
    return jsonb_build_object('ok', false, 'error', 'beta_closed');
  end if;
  if char_length(clean_name) not between 2 and 80 then return jsonb_build_object('ok', false, 'error', 'invalid_name'); end if;
  if char_length(clean_email) not between 5 and 254 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if applicant_age is null or applicant_age not between 13 and 100 then return jsonb_build_object('ok', false, 'error', 'invalid_age'); end if;

  select * into existing from nexora_private.beta_applications application
  where lower(application.email) = clean_email or application.discord_user_id = discord_link.provider_user_id
  order by application.created_at desc limit 1;

  if existing.id is not null then
    if existing.status <> 'declined' then return jsonb_build_object('ok', false, 'error', 'already_registered'); end if;
    retry_at := existing.updated_at + interval '24 hours';
    if now() < retry_at and existing.reapply_wait_bypassed_at is null then
      return jsonb_build_object('ok', false, 'error', 'reapply_wait', 'retry_at', retry_at);
    end if;
    update nexora_private.beta_applications set
      full_name = clean_name, email = clean_email, age = applicant_age,
      status = 'submitted', lookup_token_hash = encode(extensions.digest(raw_code, 'sha256'), 'hex'),
      discord_notified = false, discord_message_id = null,
      discord_user_id = discord_link.provider_user_id,
      discord_name = coalesce(discord_link.display_name, discord_link.username),
      discord_avatar_url = discord_link.avatar_url,
      created_at = now(), updated_at = now(), reviewed_at = null, reviewed_by = null,
      archived_at = null, archived_by = null,
      reapply_wait_bypassed_at = null, reapply_wait_bypassed_by = null,
      reapply_wait_bypass_reason = null
    where id = existing.id returning id into application_id;
    return jsonb_build_object('ok', true, 'application_id', application_id,
      'lookup_code', raw_code, 'status', 'submitted', 'reapplied', true);
  end if;

  insert into nexora_private.beta_applications (
    full_name, email, age, lookup_token_hash, discord_user_id, discord_name, discord_avatar_url
  ) values (
    clean_name, clean_email, applicant_age, encode(extensions.digest(raw_code, 'sha256'), 'hex'),
    discord_link.provider_user_id, coalesce(discord_link.display_name, discord_link.username), discord_link.avatar_url
  ) returning id into application_id;
  return jsonb_build_object('ok', true, 'application_id', application_id, 'lookup_code', raw_code, 'status', 'submitted');
end $$;

create or replace function nexora_private.staff_bypass_beta_reapply_wait(
  application_id uuid, bypass_reason text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_role text := nexora_private.current_staff_role(actor);
  clean_reason text := trim(coalesce(bypass_reason, ''));
  target_email text;
begin
  if actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  if char_length(clean_reason) not between 3 and 300 then
    raise exception using errcode = '22023', message = 'invalid_bypass_reason';
  end if;
  update nexora_private.beta_applications application set
    reapply_wait_bypassed_at = now(), reapply_wait_bypassed_by = actor,
    reapply_wait_bypass_reason = clean_reason
  where application.id = application_id and application.status = 'declined'
  returning application.email into target_email;
  if target_email is null then return false; end if;
  insert into public.staff_action_log(actor_user_id, action_type, reason)
  values (actor, 'beta_reapply_wait_bypassed', clean_reason || ' · ' || target_email);
  return true;
end $$;

create or replace function public.staff_bypass_beta_reapply_wait(application_id uuid, bypass_reason text)
returns boolean language sql security invoker set search_path = '' as $$
  select nexora_private.staff_bypass_beta_reapply_wait(application_id, bypass_reason)
$$;

create or replace function nexora_private.staff_beta_applications()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if nexora_private.current_staff_role(auth.uid()) is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', application.id, 'full_name', application.full_name, 'email', application.email,
    'age', application.age, 'status', application.status,
    'discord_notified', application.discord_notified,
    'discord_user_id', application.discord_user_id, 'discord_name', application.discord_name,
    'created_at', application.created_at, 'updated_at', application.updated_at,
    'reapply_wait_bypassed_at', application.reapply_wait_bypassed_at,
    'reapply_wait_bypass_reason', application.reapply_wait_bypass_reason
  ) order by application.created_at desc)
  from nexora_private.beta_applications application where application.archived_at is null), '[]'::jsonb);
end $$;

-- The direct Roblox Open Cloud connection owns the Roblox account_links row.
-- Auth identity synchronization must never overwrite its permission metadata.
create or replace function nexora_private.sync_current_auth_identities()
returns text[] language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := auth.uid();
  auth_identity record;
  external_id text;
  external_username text;
  synced_providers text[] := '{}'::text[];
begin
  if actor_id is null then raise exception using errcode = 'P0001', message = 'authentication_required'; end if;
  for auth_identity in
    select i.provider, i.provider_id, i.identity_data from auth.identities i
    where i.user_id = actor_id and i.provider = 'discord' order by i.created_at
  loop
    external_id := coalesce(auth_identity.identity_data->>'sub', auth_identity.identity_data->>'id', auth_identity.provider_id);
    external_username := coalesce(auth_identity.identity_data->>'username', auth_identity.identity_data->>'user_name', auth_identity.identity_data->>'name', 'Discord user');
    insert into public.account_links(user_id, provider, provider_user_id, username, display_name, avatar_url, metadata, verified_at, refreshed_at)
    values (actor_id, 'discord', external_id, external_username,
      coalesce(auth_identity.identity_data->>'global_name', auth_identity.identity_data->>'name', external_username),
      auth_identity.identity_data->>'avatar_url',
      jsonb_build_object('source','supabase_auth_identity','auth_provider','discord'), now(), now())
    on conflict (user_id, provider) do update set
      provider_user_id=excluded.provider_user_id, username=excluded.username,
      display_name=excluded.display_name, avatar_url=excluded.avatar_url,
      metadata=excluded.metadata, refreshed_at=now();
    synced_providers := array_append(synced_providers, 'discord');
  end loop;
  return synced_providers;
end $$;

revoke all on function nexora_private.staff_bypass_beta_reapply_wait(uuid,text) from public, anon;
revoke all on function public.staff_bypass_beta_reapply_wait(uuid,text) from public, anon;
grant execute on function nexora_private.staff_bypass_beta_reapply_wait(uuid,text) to authenticated;
grant execute on function public.staff_bypass_beta_reapply_wait(uuid,text) to authenticated;

comment on column nexora_private.beta_applications.reapply_wait_bypassed_at is
  'Audited one-use Staff override of the declined application 24-hour reapply delay.';
