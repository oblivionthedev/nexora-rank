create table public.partners (
  id uuid primary key default gen_random_uuid(),
  roblox_group_id text not null unique,
  roblox_group_name text not null,
  roblox_group_logo_url text,
  roblox_member_count integer not null default 0,
  roblox_owner_user_id text,
  roblox_owner_username text,
  roblox_owner_display_name text,
  discord_invite_url text not null,
  published boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_group_id_format check (roblox_group_id ~ '^[0-9]{1,20}$'),
  constraint partners_group_name_length check (char_length(roblox_group_name) between 1 and 120),
  constraint partners_member_count_nonnegative check (roblox_member_count >= 0),
  constraint partners_discord_invite_https check (
    discord_invite_url ~ '^https://(www\.)?(discord\.gg|discord\.com/invite)/[A-Za-z0-9_-]+/?$'
  )
);

create index partners_published_created_idx
  on public.partners (published, created_at desc);

alter table public.partners enable row level security;
create policy partners_public_read
  on public.partners for select
  to anon, authenticated
  using (published = true);

revoke all on table public.partners from public, anon, authenticated;
grant select on table public.partners to anon, authenticated;
grant select, insert, update, delete on table public.partners to service_role;

create or replace function nexora_private.staff_partners()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) is null then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(p) order by p.created_at desc)
    from public.partners p
  ), '[]'::jsonb);
end;
$$;

create or replace function nexora_private.staff_add_partner(
  group_id text,
  group_name text,
  group_logo_url text,
  member_count integer,
  owner_user_id text,
  owner_username text,
  owner_display_name text,
  discord_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid(); actor_role text := nexora_private.current_staff_role(actor); partner_id uuid;
begin
  if actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  insert into public.partners (
    roblox_group_id, roblox_group_name, roblox_group_logo_url,
    roblox_member_count, roblox_owner_user_id, roblox_owner_username,
    roblox_owner_display_name, discord_invite_url, created_by
  ) values (
    trim(group_id), trim(group_name), nullif(trim(group_logo_url), ''),
    greatest(coalesce(member_count, 0), 0), nullif(trim(owner_user_id), ''),
    nullif(trim(owner_username), ''), nullif(trim(owner_display_name), ''),
    trim(discord_url), actor
  )
  on conflict (roblox_group_id) do update set
    roblox_group_name = excluded.roblox_group_name,
    roblox_group_logo_url = excluded.roblox_group_logo_url,
    roblox_member_count = excluded.roblox_member_count,
    roblox_owner_user_id = excluded.roblox_owner_user_id,
    roblox_owner_username = excluded.roblox_owner_username,
    roblox_owner_display_name = excluded.roblox_owner_display_name,
    discord_invite_url = excluded.discord_invite_url,
    published = true,
    updated_at = now()
  returning id into partner_id;
  return partner_id;
end;
$$;

create or replace function nexora_private.staff_remove_partner(partner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nexora_private.current_staff_role(auth.uid()) not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'staff_management_denied';
  end if;
  delete from public.partners where id = partner_id;
  return found;
end;
$$;

create function public.staff_partners()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select nexora_private.staff_partners() $$;
create function public.staff_add_partner(
  group_id text, group_name text, group_logo_url text, member_count integer,
  owner_user_id text, owner_username text, owner_display_name text, discord_url text
)
returns uuid language sql security invoker set search_path = ''
as $$ select nexora_private.staff_add_partner(group_id, group_name, group_logo_url, member_count, owner_user_id, owner_username, owner_display_name, discord_url) $$;
create function public.staff_remove_partner(partner_id uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select nexora_private.staff_remove_partner(partner_id) $$;

revoke all on function nexora_private.staff_partners() from public, anon, authenticated;
revoke all on function nexora_private.staff_add_partner(text,text,text,integer,text,text,text,text) from public, anon, authenticated;
revoke all on function nexora_private.staff_remove_partner(uuid) from public, anon, authenticated;
revoke all on function public.staff_partners() from public, anon, authenticated;
revoke all on function public.staff_add_partner(text,text,text,integer,text,text,text,text) from public, anon, authenticated;
revoke all on function public.staff_remove_partner(uuid) from public, anon, authenticated;
grant execute on function nexora_private.staff_partners() to authenticated;
grant execute on function nexora_private.staff_add_partner(text,text,text,integer,text,text,text,text) to authenticated;
grant execute on function nexora_private.staff_remove_partner(uuid) to authenticated;
grant execute on function public.staff_partners() to authenticated;
grant execute on function public.staff_add_partner(text,text,text,integer,text,text,text,text) to authenticated;
grant execute on function public.staff_remove_partner(uuid) to authenticated;
