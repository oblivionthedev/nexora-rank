alter table nexora_private.beta_applications
  add column if not exists discord_user_id text,
  add column if not exists discord_name text,
  add column if not exists discord_avatar_url text;

alter table nexora_private.beta_applications
  drop constraint if exists beta_applications_discord_user_id_format;
alter table nexora_private.beta_applications
  add constraint beta_applications_discord_user_id_format
  check (discord_user_id is null or discord_user_id ~ '^[0-9]{17,22}$');

create unique index if not exists beta_applications_discord_user_unique
  on nexora_private.beta_applications (discord_user_id)
  where discord_user_id is not null;

create or replace function nexora_private.guard_last_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A cascading parent deletion is intentional. At this point the workspace
  -- row is no longer visible, so its final owner may be removed safely.
  if tg_op = 'DELETE' and not exists (
    select 1 from public.workspaces where id = old.workspace_id
  ) then
    return old;
  end if;

  if old.role <> 'owner' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.role = 'owner' then return new; end if;

  if not exists (
    select 1 from public.workspace_members other_owner
    where other_owner.workspace_id = old.workspace_id
      and other_owner.user_id <> old.user_id
      and other_owner.role = 'owner'
  ) then
    raise exception 'A workspace must keep at least one owner';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function nexora_private.submit_beta_application(
  applicant_name text,
  applicant_email text,
  applicant_age integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  discord_link public.account_links;
  clean_name text := trim(coalesce(applicant_name, ''));
  clean_email text := lower(trim(coalesce(applicant_email, '')));
  raw_code text := 'NXB-' || upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 20));
  application_id uuid;
begin
  if actor is null then return jsonb_build_object('ok', false, 'error', 'discord_required'); end if;
  select * into discord_link from public.account_links
  where user_id = actor and provider = 'discord';
  if discord_link.id is null then return jsonb_build_object('ok', false, 'error', 'discord_required'); end if;
  if not coalesce((select beta_enabled from nexora_private.platform_settings where singleton = true), false) then
    return jsonb_build_object('ok', false, 'error', 'beta_closed');
  end if;
  if char_length(clean_name) not between 2 and 80 then return jsonb_build_object('ok', false, 'error', 'invalid_name'); end if;
  if char_length(clean_email) not between 5 and 254 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if applicant_age is null or applicant_age not between 13 and 100 then return jsonb_build_object('ok', false, 'error', 'invalid_age'); end if;
  if exists (select 1 from nexora_private.beta_applications where lower(email) = clean_email or discord_user_id = discord_link.provider_user_id) then
    return jsonb_build_object('ok', false, 'error', 'already_registered');
  end if;

  insert into nexora_private.beta_applications
    (full_name, email, age, lookup_token_hash, discord_user_id, discord_name, discord_avatar_url)
  values
    (clean_name, clean_email, applicant_age, encode(extensions.digest(raw_code, 'sha256'), 'hex'),
     discord_link.provider_user_id, coalesce(discord_link.display_name, discord_link.username), discord_link.avatar_url)
  returning id into application_id;
  return jsonb_build_object('ok', true, 'application_id', application_id, 'lookup_code', raw_code, 'status', 'submitted');
end;
$$;

create or replace function nexora_private.staff_beta_applications()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare actor_role text := nexora_private.current_staff_role(auth.uid());
begin
  if actor_role is null then raise exception using errcode = '42501', message = 'staff_access_denied'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'full_name', full_name, 'email', email, 'age', age,
      'status', status, 'discord_notified', discord_notified,
      'discord_user_id', discord_user_id, 'discord_name', discord_name,
      'discord_avatar_url', discord_avatar_url,
      'created_at', created_at, 'updated_at', updated_at
    ) order by created_at desc)
    from nexora_private.beta_applications
  ), '[]'::jsonb);
end;
$$;

drop function if exists public.staff_update_beta_application(uuid, text);
drop function if exists nexora_private.staff_update_beta_application(uuid, text);
create function nexora_private.staff_update_beta_application(application_id uuid, requested_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor_id); changed nexora_private.beta_applications;
begin
  if actor_role not in ('owner', 'admin') then raise exception using errcode = '42501', message = 'staff_management_denied'; end if;
  if requested_status not in ('submitted', 'reviewing', 'selected', 'waitlisted', 'declined') then raise exception using errcode = '22023', message = 'invalid_beta_status'; end if;
  update nexora_private.beta_applications
  set status = requested_status,
      reviewed_at = case when requested_status = 'submitted' then null else now() end,
      reviewed_by = case when requested_status = 'submitted' then null else actor_id end,
      updated_at = now()
  where id = application_id returning * into changed;
  if changed.id is null then return jsonb_build_object('ok', false, 'error', 'beta_application_not_found'); end if;
  return jsonb_build_object('ok', true, 'status', changed.status,
    'discord_user_id', changed.discord_user_id, 'discord_name', changed.discord_name);
end;
$$;
create function public.staff_update_beta_application(application_id uuid, requested_status text)
returns jsonb language sql security invoker set search_path = ''
as $$ select nexora_private.staff_update_beta_application(application_id, requested_status) $$;

revoke all on function nexora_private.staff_update_beta_application(uuid, text) from public, anon, authenticated;
revoke all on function public.staff_update_beta_application(uuid, text) from public, anon, authenticated;
grant execute on function nexora_private.staff_update_beta_application(uuid, text) to authenticated;
grant execute on function public.staff_update_beta_application(uuid, text) to authenticated;
