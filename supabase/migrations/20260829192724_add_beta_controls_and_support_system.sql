create table if not exists nexora_private.platform_settings (
  singleton boolean primary key default true check (singleton),
  beta_enabled boolean not null default true,
  updated_by_discord_id text,
  updated_at timestamptz not null default now()
);

insert into nexora_private.platform_settings (singleton, beta_enabled)
values (true, true)
on conflict (singleton) do nothing;

alter table nexora_private.platform_settings enable row level security;
alter table nexora_private.platform_settings force row level security;
drop policy if exists platform_settings_deny_direct_access on nexora_private.platform_settings;
create policy platform_settings_deny_direct_access
  on nexora_private.platform_settings for all to anon, authenticated
  using (false) with check (false);
revoke all on nexora_private.platform_settings from public, anon, authenticated;

create or replace function nexora_private.create_staff_access_code(
  raw_code text,
  requested_guild_id text,
  creator_discord_id text,
  requested_role text default 'support'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid; valid_until timestamptz := now() + interval '10 minutes';
begin
  if requested_guild_id <> '1542617161825255474'
     or creator_discord_id <> '1515743540259328202'
     or raw_code !~ '^[A-Z0-9]{25}$'
     or requested_role not in ('admin', 'moderator', 'support') then
    raise exception using errcode = '22023', message = 'invalid_staff_code_request';
  end if;

  delete from nexora_private.staff_access_codes
  where expires_at < now() - interval '1 day';

  insert into nexora_private.staff_access_codes
    (code_hash, role, guild_id, created_by_discord_id, expires_at)
  values
    (encode(extensions.digest(raw_code, 'sha256'), 'hex'), requested_role,
     requested_guild_id, creator_discord_id, valid_until)
  returning id into new_id;

  return jsonb_build_object('id', new_id, 'expires_at', valid_until, 'role', requested_role);
end;
$$;

create or replace function nexora_private.public_platform_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'beta_enabled', beta_enabled,
    'updated_at', updated_at
  )
  from nexora_private.platform_settings
  where singleton = true
$$;

create or replace function nexora_private.bot_set_beta_enabled(
  requested_enabled boolean,
  actor_discord_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_discord_id is null or actor_discord_id !~ '^\d{17,22}$' then
    raise exception using errcode = '22023', message = 'invalid_discord_actor';
  end if;

  update nexora_private.platform_settings
  set beta_enabled = requested_enabled,
      updated_by_discord_id = actor_discord_id,
      updated_at = now()
  where singleton = true;

  return nexora_private.public_platform_settings();
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
  clean_name text := trim(coalesce(applicant_name, ''));
  clean_email text := lower(trim(coalesce(applicant_email, '')));
  raw_code text := 'NXB-' || upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 20));
  application_id uuid;
begin
  if not coalesce((select beta_enabled from nexora_private.platform_settings where singleton = true), false) then
    return jsonb_build_object('ok', false, 'error', 'beta_closed');
  end if;
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

create table if not exists nexora_private.support_guild_configs (
  guild_id text primary key check (guild_id ~ '^\d{17,22}$'),
  category_id text not null check (category_id ~ '^\d{17,22}$'),
  transcripts_channel_id text not null check (transcripts_channel_id ~ '^\d{17,22}$'),
  logs_channel_id text not null check (logs_channel_id ~ '^\d{17,22}$'),
  support_role_id text not null check (support_role_id ~ '^\d{17,22}$'),
  panel_channel_id text,
  panel_message_id text,
  updated_by_discord_id text not null,
  updated_at timestamptz not null default now()
);

create table if not exists nexora_private.support_tickets (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null references nexora_private.support_guild_configs(guild_id) on delete cascade,
  channel_id text not null unique check (channel_id ~ '^\d{17,22}$'),
  user_discord_id text not null check (user_discord_id ~ '^\d{17,22}$'),
  ticket_number bigint generated by default as identity,
  status text not null default 'open' check (status in ('open', 'closed')),
  claimed_by_discord_id text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by_discord_id text,
  transcript_message_id text
);

create index if not exists support_tickets_guild_status_idx
  on nexora_private.support_tickets (guild_id, status, opened_at desc);
create unique index if not exists support_tickets_one_open_per_user_idx
  on nexora_private.support_tickets (guild_id, user_discord_id)
  where status = 'open';

alter table nexora_private.support_guild_configs enable row level security;
alter table nexora_private.support_guild_configs force row level security;
alter table nexora_private.support_tickets enable row level security;
alter table nexora_private.support_tickets force row level security;
drop policy if exists support_guild_configs_deny_direct_access on nexora_private.support_guild_configs;
create policy support_guild_configs_deny_direct_access
  on nexora_private.support_guild_configs for all to anon, authenticated
  using (false) with check (false);
drop policy if exists support_tickets_deny_direct_access on nexora_private.support_tickets;
create policy support_tickets_deny_direct_access
  on nexora_private.support_tickets for all to anon, authenticated
  using (false) with check (false);
revoke all on nexora_private.support_guild_configs from public, anon, authenticated;
revoke all on nexora_private.support_tickets from public, anon, authenticated;
grant select, insert, update, delete on nexora_private.support_guild_configs to service_role;
grant select, insert, update, delete on nexora_private.support_tickets to service_role;
grant usage, select on sequence nexora_private.support_tickets_ticket_number_seq to service_role;

create or replace function public.get_public_platform_settings()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select nexora_private.public_platform_settings() $$;

create or replace function public.bot_set_beta_enabled(
  requested_enabled boolean,
  actor_discord_id text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select nexora_private.bot_set_beta_enabled(requested_enabled, actor_discord_id) $$;

revoke all on function nexora_private.public_platform_settings() from public, anon, authenticated;
revoke all on function nexora_private.bot_set_beta_enabled(boolean, text) from public, anon, authenticated;
revoke all on function public.get_public_platform_settings() from public, anon, authenticated;
revoke all on function public.bot_set_beta_enabled(boolean, text) from public, anon, authenticated;

grant usage on schema nexora_private to anon, authenticated, service_role;
grant execute on function nexora_private.public_platform_settings() to anon, authenticated, service_role;
grant execute on function public.get_public_platform_settings() to anon, authenticated, service_role;
grant execute on function nexora_private.bot_set_beta_enabled(boolean, text) to service_role;
grant execute on function public.bot_set_beta_enabled(boolean, text) to service_role;

create index if not exists workspace_invites_invited_by_idx
  on public.workspace_invites (invited_by)
  where invited_by is not null;

comment on table nexora_private.platform_settings is 'Private runtime controls changed by the Nexora owner through the bot.';
comment on table nexora_private.support_guild_configs is 'Nexora Support server setup and panel destinations.';
comment on table nexora_private.support_tickets is 'Active and closed Nexora Support DM conversations.';
