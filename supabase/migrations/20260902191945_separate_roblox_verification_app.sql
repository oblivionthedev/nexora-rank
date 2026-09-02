-- Identity-only OAuth writes are server-attested; browser RPC callers cannot forge them.
-- No verification access/refresh token is persisted or used for group management.
create or replace function nexora_private.store_roblox_verification(
  candidate_secret text, provider_user_id text, provider_username text,
  provider_display_name text, provider_avatar_url text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  group_account text;
begin
  if actor is null or not coalesce(nexora_private.cron_secret_valid(candidate_secret), false) then
    raise exception using errcode = '42501', message = 'verification_server_required';
  end if;
  if provider_user_id is null or provider_user_id !~ '^[0-9]{1,20}$'
    or provider_username is null or char_length(trim(provider_username)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_roblox_identity';
  end if;
  if not exists (select 1 from public.account_links where user_id = actor and provider = 'discord' and verified_at is not null) then
    raise exception using errcode = '42501', message = 'discord_identity_required';
  end if;
  select credential.provider_user_id into group_account
    from nexora_private.roblox_oauth_credentials credential
    where credential.user_id = actor and credential.revoked_at is null
    for update;
  if group_account is not null and group_account <> provider_user_id then
    raise exception using errcode = '22023', message = 'roblox_group_account_mismatch';
  end if;
  insert into public.account_links as link (
    user_id, provider, provider_user_id, username, display_name, avatar_url,
    metadata, verified_at, refreshed_at
  ) values (
    actor, 'roblox', provider_user_id, trim(provider_username),
    nullif(left(trim(coalesce(provider_display_name, '')), 100), ''),
    case when provider_avatar_url like 'https://%' then provider_avatar_url else null end,
    jsonb_build_object('source', 'roblox_verification_oauth', 'scopes', jsonb_build_array('openid', 'profile'), 'open_cloud_ready', false),
    now(), now()
  ) on conflict (user_id, provider) do update set
    provider_user_id = excluded.provider_user_id,
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    metadata = case when link.provider_user_id = excluded.provider_user_id
      then link.metadata || jsonb_build_object('verification_source', 'roblox_verification_oauth')
      else excluded.metadata end,
    verified_at = now(), refreshed_at = now();
  return true;
end;
$$;

create or replace function public.store_roblox_verification(
  candidate_secret text, provider_user_id text, provider_username text,
  provider_display_name text, provider_avatar_url text
)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.store_roblox_verification(candidate_secret, provider_user_id, provider_username, provider_display_name, provider_avatar_url) $$;

revoke all on function nexora_private.store_roblox_verification(text,text,text,text,text) from public, anon;
revoke all on function public.store_roblox_verification(text,text,text,text,text) from public, anon;
grant execute on function nexora_private.store_roblox_verification(text,text,text,text,text) to authenticated;
grant execute on function public.store_roblox_verification(text,text,text,text,text) to authenticated;
