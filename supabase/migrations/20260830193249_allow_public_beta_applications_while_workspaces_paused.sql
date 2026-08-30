update nexora_private.platform_settings
set beta_enabled = true,
    updated_at = now()
where singleton = true;

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
  existing nexora_private.beta_applications;
  clean_name text := trim(coalesce(applicant_name, ''));
  clean_email text := lower(trim(coalesce(applicant_email, '')));
  raw_code text := 'NXB-' || upper(substr(encode(extensions.gen_random_bytes(16), 'hex'), 1, 20));
  application_id uuid;
  retry_at timestamptz;
begin
  if actor is not null then
    select * into discord_link
    from public.account_links
    where user_id = actor and provider = 'discord';
  end if;

  if not coalesce((
    select beta_enabled
    from nexora_private.platform_settings
    where singleton = true
  ), false) then
    return jsonb_build_object('ok', false, 'error', 'beta_closed');
  end if;
  if char_length(clean_name) not between 2 and 80 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  if char_length(clean_email) not between 5 and 254
     or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;
  if applicant_age is null or applicant_age not between 13 and 100 then
    return jsonb_build_object('ok', false, 'error', 'invalid_age');
  end if;

  select * into existing
  from nexora_private.beta_applications application
  where lower(application.email) = clean_email
     or (
       discord_link.provider_user_id is not null
       and application.discord_user_id = discord_link.provider_user_id
     )
  order by application.created_at desc
  limit 1;

  if existing.id is not null then
    if existing.status <> 'declined' then
      return jsonb_build_object('ok', false, 'error', 'already_registered');
    end if;
    retry_at := existing.updated_at + interval '24 hours';
    if now() < retry_at then
      return jsonb_build_object(
        'ok', false, 'error', 'reapply_wait', 'retry_at', retry_at
      );
    end if;

    update nexora_private.beta_applications
    set full_name = clean_name,
        email = clean_email,
        age = applicant_age,
        status = 'submitted',
        lookup_token_hash = encode(extensions.digest(raw_code, 'sha256'), 'hex'),
        discord_notified = false,
        discord_message_id = null,
        discord_user_id = discord_link.provider_user_id,
        discord_name = coalesce(discord_link.display_name, discord_link.username),
        discord_avatar_url = discord_link.avatar_url,
        created_at = now(),
        updated_at = now(),
        reviewed_at = null,
        reviewed_by = null,
        archived_at = null,
        archived_by = null
    where id = existing.id
    returning id into application_id;

    return jsonb_build_object(
      'ok', true,
      'application_id', application_id,
      'lookup_code', raw_code,
      'status', 'submitted',
      'reapplied', true
    );
  end if;

  insert into nexora_private.beta_applications (
    full_name, email, age, lookup_token_hash,
    discord_user_id, discord_name, discord_avatar_url
  ) values (
    clean_name,
    clean_email,
    applicant_age,
    encode(extensions.digest(raw_code, 'sha256'), 'hex'),
    discord_link.provider_user_id,
    coalesce(discord_link.display_name, discord_link.username),
    discord_link.avatar_url
  )
  returning id into application_id;

  return jsonb_build_object(
    'ok', true,
    'application_id', application_id,
    'lookup_code', raw_code,
    'status', 'submitted'
  );
end
$$;

comment on function nexora_private.submit_beta_application(text, text, integer) is
  'Accepts public Beta applications while workspace creation remains separately controlled.';
