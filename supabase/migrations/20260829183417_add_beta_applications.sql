-- Public beta applications are kept outside the exposed public schema. Public
-- callers can only submit or check one application through tightly scoped RPCs.
create table nexora_private.beta_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  age smallint not null,
  status text not null default 'submitted',
  lookup_token_hash text not null unique,
  discord_notified boolean not null default false,
  discord_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  constraint beta_applications_name_length check (char_length(full_name) between 2 and 80),
  constraint beta_applications_email_length check (char_length(email) between 5 and 254),
  constraint beta_applications_age_range check (age between 13 and 100),
  constraint beta_applications_status check (status in ('submitted', 'reviewing', 'selected', 'waitlisted', 'declined'))
);

create unique index beta_applications_email_unique on nexora_private.beta_applications (lower(email));
create index beta_applications_status_created_idx on nexora_private.beta_applications (status, created_at desc);
create index beta_applications_reviewed_by_idx on nexora_private.beta_applications (reviewed_by) where reviewed_by is not null;
alter table nexora_private.beta_applications enable row level security;
alter table nexora_private.beta_applications force row level security;
create policy beta_applications_deny_direct_access on nexora_private.beta_applications for all to anon, authenticated using (false) with check (false);
revoke all on nexora_private.beta_applications from public, anon, authenticated;

create or replace function nexora_private.submit_beta_application(applicant_name text, applicant_email text, applicant_age integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := trim(coalesce(applicant_name, ''));
  clean_email text := lower(trim(coalesce(applicant_email, '')));
  raw_code text := 'NXB-' || upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 20));
  application_id uuid;
begin
  if char_length(clean_name) not between 2 and 80 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  if char_length(clean_email) not between 5 and 254 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if applicant_age is null or applicant_age not between 13 and 100 then
    return jsonb_build_object('ok', false, 'error', 'invalid_age');
  end if;
  if exists (select 1 from nexora_private.beta_applications where lower(email) = clean_email) then
    return jsonb_build_object('ok', false, 'error', 'already_registered');
  end if;

  insert into nexora_private.beta_applications (full_name, email, age, lookup_token_hash)
  values (clean_name, clean_email, applicant_age, encode(extensions.digest(raw_code, 'sha256'), 'hex'))
  returning id into application_id;

  return jsonb_build_object('ok', true, 'application_id', application_id, 'lookup_code', raw_code, 'status', 'submitted');
end;
$$;

create or replace function nexora_private.check_beta_application(applicant_email text, lookup_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select jsonb_build_object(
      'ok', true,
      'name', full_name,
      'status', status,
      'created_at', created_at,
      'updated_at', updated_at
    )
    from nexora_private.beta_applications
    where lower(email) = lower(trim(applicant_email))
      and lookup_token_hash = encode(extensions.digest(upper(trim(lookup_code)), 'sha256'), 'hex')
    limit 1
  ), jsonb_build_object('ok', false, 'error', 'application_not_found'))
$$;

create or replace function nexora_private.record_beta_notification(application_id uuid, lookup_code text, delivered boolean, message_id text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update nexora_private.beta_applications
  set discord_notified = delivered,
      discord_message_id = case when delivered then nullif(message_id, '') else null end,
      updated_at = now()
  where id = application_id
    and lookup_token_hash = encode(extensions.digest(upper(trim(lookup_code)), 'sha256'), 'hex');
  return found;
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
  if actor_role is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'full_name', full_name,
      'email', email,
      'age', age,
      'status', status,
      'discord_notified', discord_notified,
      'created_at', created_at,
      'updated_at', updated_at
    ) order by created_at desc)
    from nexora_private.beta_applications
  ), '[]'::jsonb);
end;
$$;

create or replace function nexora_private.staff_update_beta_application(application_id uuid, requested_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor_id);
begin
  if actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  if requested_status not in ('submitted', 'reviewing', 'selected', 'waitlisted', 'declined') then
    raise exception using errcode = '22023', message = 'invalid_beta_status';
  end if;
  update nexora_private.beta_applications
  set status = requested_status,
      reviewed_at = case when requested_status = 'submitted' then null else now() end,
      reviewed_by = case when requested_status = 'submitted' then null else actor_id end,
      updated_at = now()
  where id = application_id;
  return found;
end;
$$;

create or replace function public.submit_beta_application(applicant_name text, applicant_email text, applicant_age integer)
returns jsonb language sql security invoker set search_path = ''
as $$ select nexora_private.submit_beta_application(applicant_name, applicant_email, applicant_age) $$;
create or replace function public.check_beta_application(applicant_email text, lookup_code text)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.check_beta_application(applicant_email, lookup_code) $$;
create or replace function public.record_beta_notification(application_id uuid, lookup_code text, delivered boolean, message_id text default null)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.record_beta_notification(application_id, lookup_code, delivered, message_id) $$;
create or replace function public.staff_beta_applications()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.staff_beta_applications() $$;
create or replace function public.staff_update_beta_application(application_id uuid, requested_status text)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_update_beta_application(application_id, requested_status) $$;

revoke all on function nexora_private.submit_beta_application(text, text, integer) from public, anon, authenticated;
revoke all on function nexora_private.check_beta_application(text, text) from public, anon, authenticated;
revoke all on function nexora_private.record_beta_notification(uuid, text, boolean, text) from public, anon, authenticated;
revoke all on function nexora_private.staff_beta_applications() from public, anon, authenticated;
revoke all on function nexora_private.staff_update_beta_application(uuid, text) from public, anon, authenticated;
grant usage on schema nexora_private to anon, authenticated;
grant execute on function nexora_private.submit_beta_application(text, text, integer) to anon, authenticated;
grant execute on function nexora_private.check_beta_application(text, text) to anon, authenticated;
grant execute on function nexora_private.record_beta_notification(uuid, text, boolean, text) to anon, authenticated;
grant execute on function nexora_private.staff_beta_applications() to authenticated;
grant execute on function nexora_private.staff_update_beta_application(uuid, text) to authenticated;

revoke all on function public.submit_beta_application(text, text, integer) from public, anon, authenticated;
revoke all on function public.check_beta_application(text, text) from public, anon, authenticated;
revoke all on function public.record_beta_notification(uuid, text, boolean, text) from public, anon, authenticated;
revoke all on function public.staff_beta_applications() from public, anon, authenticated;
revoke all on function public.staff_update_beta_application(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_beta_application(text, text, integer) to anon, authenticated;
grant execute on function public.check_beta_application(text, text) to anon, authenticated;
grant execute on function public.record_beta_notification(uuid, text, boolean, text) to anon, authenticated;
grant execute on function public.staff_beta_applications() to authenticated;
grant execute on function public.staff_update_beta_application(uuid, text) to authenticated;

comment on table nexora_private.beta_applications is 'Private Nexora beta applications with hashed public status lookup codes.';
