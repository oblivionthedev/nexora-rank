alter table public.discord_link_codes
  add column plan_key text,
  add column plan_tier text;

update public.discord_link_codes
set
  plan_key = 'free',
  plan_tier = 'free',
  expires_at = least(expires_at, now())
where plan_key is null or plan_tier is null;

alter table public.discord_link_codes
  alter column plan_key set not null,
  alter column plan_tier set not null;

create or replace function nexora_private.discord_link_plan_tier(requested_plan_key text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case lower(trim(coalesce(requested_plan_key, 'free')))
    when 'basic' then 'basic'
    when 'starter' then 'basic'
    when 'plus' then 'plus'
    when 'premium' then 'premium'
    when 'pro' then 'pro'
    when 'enterprise' then 'enterprise'
    else 'free'
  end
$$;

create or replace function nexora_private.create_discord_link_code(target_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  raw_code text;
  digest_hex text;
  expiry timestamptz := now() + interval '10 minutes';
  current_plan text;
  current_tier text;
begin
  if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then
    raise exception using errcode = '42501', message = 'manager_required';
  end if;
  if exists (
    select 1 from public.workspaces w
    where w.id = target_workspace_id and w.operational_status <> 'active'
  ) then
    raise exception using errcode = '42501', message = 'workspace_suspended';
  end if;

  select case
    when s.status in ('active', 'trialing') or coalesce(s.plan_key, 'free') = 'free'
      then coalesce(s.plan_key, 'free')
    else 'free'
  end
  into current_plan
  from public.workspaces w
  left join public.subscriptions s on s.workspace_id = w.id
  where w.id = target_workspace_id;

  if current_plan is null then
    raise exception using errcode = 'P0002', message = 'workspace_not_found';
  end if;

  current_tier := nexora_private.discord_link_plan_tier(current_plan);
  raw_code := 'NX-' || upper(current_tier) || '-' || upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 16));
  digest_hex := encode(extensions.digest(raw_code, 'sha256'), 'hex');

  update public.discord_link_codes
  set expires_at = now()
  where workspace_id = target_workspace_id and claimed_at is null;

  insert into public.discord_link_codes (
    workspace_id,
    code_hash,
    created_by,
    expires_at,
    plan_key,
    plan_tier
  ) values (
    target_workspace_id,
    digest_hex,
    actor_id,
    expiry,
    current_plan,
    current_tier
  );

  insert into public.workspace_logs (
    workspace_id,
    source,
    event_type,
    summary,
    actor_user_id,
    metadata
  ) values (
    target_workspace_id,
    'discord',
    'discord.link_code_created',
    initcap(current_tier) || ' plan Discord link code created',
    actor_id,
    jsonb_build_object('plan_key', current_plan, 'plan_tier', current_tier)
  );

  return jsonb_build_object(
    'code', raw_code,
    'expires_at', expiry,
    'plan_key', current_plan,
    'plan_tier', current_tier
  );
end
$$;

create or replace function nexora_private.claim_discord_link_code(
  raw_code text,
  guild_id text,
  guild_name text,
  discord_user_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  code_row public.discord_link_codes%rowtype;
  target public.workspaces%rowtype;
  current_plan text;
  current_tier text;
begin
  raw_code := upper(trim(coalesce(raw_code, '')));
  if raw_code !~ '^NX-(FREE|BASIC|PLUS|PREMIUM|PRO|ENTERPRISE)-[A-F0-9]{16}$'
    or guild_id !~ '^[0-9]{5,22}$'
    or discord_user_id !~ '^[0-9]{5,22}$'
    or char_length(trim(guild_name)) not between 2 and 100 then
    raise exception using errcode = '22023', message = 'invalid_link_request';
  end if;

  select * into code_row
  from public.discord_link_codes
  where code_hash = encode(extensions.digest(raw_code, 'sha256'), 'hex')
    and claimed_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'link_code_invalid_or_expired';
  end if;

  select * into target from public.workspaces where id = code_row.workspace_id for update;
  if target.operational_status <> 'active' then
    raise exception using errcode = '42501', message = 'workspace_restricted';
  end if;

  select case
    when s.status in ('active', 'trialing') or coalesce(s.plan_key, 'free') = 'free'
      then coalesce(s.plan_key, 'free')
    else 'free'
  end
  into current_plan
  from public.subscriptions s
  where s.workspace_id = target.id;

  current_plan := coalesce(current_plan, 'free');
  current_tier := nexora_private.discord_link_plan_tier(current_plan);
  if current_plan <> code_row.plan_key
    or current_tier <> code_row.plan_tier
    or raw_code not like 'NX-' || upper(code_row.plan_tier) || '-%' then
    raise exception using errcode = 'P0001', message = 'link_code_plan_changed';
  end if;

  if exists (
    select 1 from public.workspaces w
    where w.discord_guild_id = guild_id and w.id <> target.id
  ) then
    raise exception using errcode = '23505', message = 'discord_server_already_linked';
  end if;

  update public.discord_link_codes
  set claimed_at = now(), claimed_guild_id = guild_id
  where id = code_row.id;

  update public.workspaces
  set discord_guild_id = guild_id,
      discord_guild_name = trim(guild_name),
      updated_at = now()
  where id = target.id;

  insert into public.integrations (
    workspace_id, provider, external_id, status, settings, connected_by, connected_at
  ) values (
    target.id,
    'discord',
    guild_id,
    'connected',
    jsonb_build_object(
      'linked_by_discord_user_id', discord_user_id,
      'linked_plan_key', current_plan,
      'linked_plan_tier', current_tier
    ),
    code_row.created_by,
    now()
  )
  on conflict (workspace_id, provider) do update
  set external_id = excluded.external_id,
      status = 'connected',
      settings = excluded.settings,
      connected_by = excluded.connected_by,
      connected_at = now(),
      updated_at = now();

  insert into public.workspace_logs (
    workspace_id, source, severity, event_type, summary, actor_user_id, metadata
  ) values (
    target.id,
    'discord',
    'success',
    'discord.server_linked',
    'Discord server linked with a ' || initcap(current_tier) || ' plan code',
    code_row.created_by,
    jsonb_build_object(
      'guild_id', guild_id,
      'guild_name', trim(guild_name),
      'plan_key', current_plan,
      'plan_tier', current_tier
    )
  );

  return jsonb_build_object(
    'workspace_id', target.public_id,
    'workspace_name', target.name,
    'status', 'connected',
    'plan_key', current_plan,
    'plan_tier', current_tier
  );
end
$$;

revoke all on function nexora_private.discord_link_plan_tier(text) from public, anon, authenticated;
revoke all on function nexora_private.create_discord_link_code(uuid) from public, anon;
grant execute on function nexora_private.create_discord_link_code(uuid) to authenticated;
revoke all on function nexora_private.claim_discord_link_code(text, text, text, text) from public;
grant execute on function nexora_private.claim_discord_link_code(text, text, text, text) to anon, authenticated, service_role;
