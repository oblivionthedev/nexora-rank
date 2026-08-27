-- Persist the verified Discord identity produced by the OAuth exchange.
--
-- public.account_links is deliberately SELECT-only for the authenticated role,
-- because a member must never be able to assert an arbitrary Discord identity.
-- This security-definer function therefore takes no arguments: it reads the
-- identity GoTrue already verified and stored in auth.identities, so nothing
-- about the identity can originate from the browser.

create or replace function public.sync_discord_identity()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  identity_data jsonb;
  discord_id text;
  discord_username text;
  discord_display text;
  discord_avatar text;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select i.identity_data
    into identity_data
  from auth.identities i
  where i.user_id = actor_id
    and i.provider = 'discord'
  order by i.last_sign_in_at desc nulls last
  limit 1;

  if identity_data is null then
    raise exception 'No Discord identity is attached to this account'
      using errcode = '22023';
  end if;

  discord_id := identity_data ->> 'sub';

  if discord_id is null or char_length(discord_id) = 0 then
    raise exception 'Discord identity is missing a stable subject claim'
      using errcode = '22023';
  end if;

  discord_username := coalesce(
    nullif(identity_data ->> 'user_name', ''),
    nullif(identity_data ->> 'preferred_username', ''),
    nullif(identity_data ->> 'name', ''),
    nullif(identity_data ->> 'full_name', ''),
    'discord-' || discord_id
  );

  discord_display := coalesce(
    nullif(identity_data ->> 'global_name', ''),
    nullif(identity_data ->> 'full_name', ''),
    nullif(identity_data ->> 'name', ''),
    discord_username
  );

  discord_avatar := coalesce(
    nullif(identity_data ->> 'avatar_url', ''),
    nullif(identity_data ->> 'picture', '')
  );

  -- Keep the profile readable, but never overwrite a name the member set.
  insert into public.profiles (id, display_name, avatar_url)
  values (actor_id, left(discord_display, 80), discord_avatar)
  on conflict (id) do update
    set display_name = coalesce(profiles.display_name, excluded.display_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);

  begin
    insert into public.account_links (
      user_id, provider, provider_user_id, username,
      display_name, avatar_url, metadata, refreshed_at
    )
    values (
      actor_id, 'discord', discord_id, discord_username,
      left(discord_display, 80), discord_avatar,
      jsonb_build_object(
        'email_verified', coalesce(identity_data -> 'email_verified', to_jsonb(false))
      ),
      now()
    )
    on conflict (user_id, provider) do update
      set provider_user_id = excluded.provider_user_id,
          username = excluded.username,
          display_name = excluded.display_name,
          avatar_url = excluded.avatar_url,
          metadata = excluded.metadata,
          refreshed_at = now();
  exception when unique_violation then
    -- Tripped by account_links_provider_identity: this Discord account already
    -- belongs to a different Nexora user. Refuse rather than silently move it.
    raise exception 'This Discord account is already linked to another Nexora user'
      using errcode = '23505';
  end;

  return jsonb_build_object(
    'provider', 'discord',
    'provider_user_id', discord_id,
    'username', discord_username,
    'display_name', discord_display,
    'avatar_url', discord_avatar
  );
end;
$$;

comment on function public.sync_discord_identity() is
  'Copies the caller''s verified Discord identity from auth.identities into account_links. Takes no arguments so an identity cannot be forged by the client.';

revoke all on function public.sync_discord_identity() from public, anon;
grant execute on function public.sync_discord_identity() to authenticated;
