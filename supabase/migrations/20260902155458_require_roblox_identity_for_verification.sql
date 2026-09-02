-- A Nexora verification binds one Discord identity to one official Roblox
-- OAuth identity. Enforce that rule in the database as well as the UI so a
-- direct RPC call cannot obtain the Discord role with only one provider.
create or replace function nexora_private.request_verified_role()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  discord_id text;
  roblox_id text;
  queue_id bigint;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select provider_user_id into discord_id
  from public.account_links
  where user_id = actor and provider = 'discord' and verified_at is not null;
  if discord_id is null then
    return jsonb_build_object('ok', false, 'error', 'discord_not_verified');
  end if;

  select provider_user_id into roblox_id
  from public.account_links
  where user_id = actor and provider = 'roblox' and verified_at is not null;
  if roblox_id is null then
    return jsonb_build_object('ok', false, 'error', 'roblox_not_verified');
  end if;

  queue_id := nexora_private.enqueue_discord_role_sync(
    discord_id,
    '1543357165836705883',
    'add'
  );
  return jsonb_build_object(
    'ok', true,
    'queue_id', queue_id,
    'discord_user_id', discord_id,
    'roblox_user_id', roblox_id
  );
end
$$;

revoke all on function nexora_private.request_verified_role() from public, anon;
grant execute on function nexora_private.request_verified_role() to authenticated;
