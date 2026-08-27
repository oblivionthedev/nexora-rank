-- Synchronize built-in Discord and custom Roblox OIDC identities into the
-- verified, user-readable account_links table.

create or replace function nexora_private.sync_current_auth_identities()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  auth_identity record;
  nexora_provider text;
  external_id text;
  external_username text;
  synced_providers text[] := '{}'::text[];
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  for auth_identity in
    select i.provider, i.provider_id, i.identity_data
    from auth.identities i
    where i.user_id = actor_id
      and i.provider in ('discord', 'custom:roblox')
    order by i.created_at
  loop
    nexora_provider := case
      when auth_identity.provider = 'custom:roblox' then 'roblox'
      else 'discord'
    end;
    external_id := coalesce(
      auth_identity.identity_data ->> 'sub',
      auth_identity.identity_data ->> 'id',
      auth_identity.provider_id
    );
    external_username := coalesce(
      auth_identity.identity_data ->> 'preferred_username',
      auth_identity.identity_data ->> 'username',
      auth_identity.identity_data ->> 'user_name',
      auth_identity.identity_data ->> 'name',
      initcap(nexora_provider) || ' user'
    );

    insert into public.account_links (
      user_id,
      provider,
      provider_user_id,
      username,
      display_name,
      avatar_url,
      metadata,
      verified_at,
      refreshed_at
    )
    values (
      actor_id,
      nexora_provider,
      external_id,
      external_username,
      coalesce(
        auth_identity.identity_data ->> 'global_name',
        auth_identity.identity_data ->> 'nickname',
        auth_identity.identity_data ->> 'full_name',
        auth_identity.identity_data ->> 'name',
        external_username
      ),
      coalesce(
        auth_identity.identity_data ->> 'avatar_url',
        auth_identity.identity_data ->> 'picture'
      ),
      jsonb_build_object(
        'source', 'supabase_auth_identity',
        'auth_provider', auth_identity.provider
      ),
      now(),
      now()
    )
    on conflict (user_id, provider) do update
    set
      provider_user_id = excluded.provider_user_id,
      username = excluded.username,
      display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      metadata = excluded.metadata,
      refreshed_at = now();

    synced_providers := array_append(synced_providers, nexora_provider);
  end loop;

  return synced_providers;
end;
$$;

revoke all on function nexora_private.sync_current_auth_identities() from public, anon;
grant execute on function nexora_private.sync_current_auth_identities() to authenticated;

create or replace function public.sync_auth_identities()
returns text[]
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.sync_current_auth_identities();
$$;

revoke all on function public.sync_auth_identities() from public, anon;
grant execute on function public.sync_auth_identities() to authenticated;
