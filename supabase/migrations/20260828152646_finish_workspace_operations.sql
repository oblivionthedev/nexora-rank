-- Complete the self-service workspace lifecycle and team-management surface.
-- Destructive removal is delayed so mistakes can be recovered and moderation
-- evidence cannot be erased by a restricted workspace.

alter table public.workspaces
  add column if not exists lifecycle_status text not null default 'active',
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_effective_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.workspaces
  add constraint workspaces_lifecycle_status_check
  check (lifecycle_status in ('active','archived','pending_deletion'));

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin','reviewer','operator','viewer')),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

alter table public.workspace_invites enable row level security;
create policy workspace_invites_manager_read on public.workspace_invites for select to authenticated
using (nexora_private.can_manage_workspace(workspace_id) or lower(email) = lower(coalesce((select contact_email from public.profiles where id=(select auth.uid())),'')));
revoke insert, update, delete on public.workspace_invites from anon, authenticated;
grant select on public.workspace_invites to authenticated;

create or replace function public.update_workspace_profile(target_workspace_id uuid, requested_name text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); clean_name text := trim(requested_name);
begin
  if actor is null or not exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=actor and role='owner') then raise exception using errcode='42501',message='owner_required'; end if;
  if char_length(clean_name) not between 2 and 64 then raise exception using errcode='22023',message='invalid_name'; end if;
  update public.workspaces set name=clean_name,updated_at=now() where id=target_workspace_id and lifecycle_status='active';
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id) values(target_workspace_id,'workspace','success','workspace.updated','Workspace details updated',actor);
  return true;
end $$;

create or replace function public.invite_workspace_member(target_workspace_id uuid, target_email text, requested_role text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); clean_email text := lower(trim(target_email)); invite_token text := encode(extensions.gen_random_bytes(18),'hex'); existing_user uuid;
begin
  if actor is null or not exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=actor and role in ('owner','admin')) then raise exception using errcode='42501',message='manager_required'; end if;
  if requested_role not in ('admin','reviewer','operator','viewer') or clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception using errcode='22023',message='invalid_invite'; end if;
  select id into existing_user from public.profiles where lower(contact_email)=clean_email limit 1;
  if existing_user is not null then
    insert into public.workspace_members(workspace_id,user_id,role) values(target_workspace_id,existing_user,requested_role) on conflict(workspace_id,user_id) do update set role=excluded.role;
    insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id,metadata) values(target_workspace_id,'workspace','success','member.added','Workspace member added',actor,jsonb_build_object('user_id',existing_user,'role',requested_role));
    return jsonb_build_object('joined',true);
  end if;
  insert into public.workspace_invites(workspace_id,email,role,token_hash,invited_by) values(target_workspace_id,clean_email,requested_role,encode(extensions.digest(invite_token,'sha256'),'hex'),actor)
  on conflict(workspace_id,email) do update set role=excluded.role,token_hash=excluded.token_hash,invited_by=actor,expires_at=now()+interval '7 days',accepted_at=null,revoked_at=null;
  return jsonb_build_object('joined',false,'token',invite_token);
end $$;

create or replace function public.manage_workspace_member(target_workspace_id uuid, target_user_id uuid, requested_role text, requested_action text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); actor_role text; target_role text;
begin
  select role into actor_role from public.workspace_members where workspace_id=target_workspace_id and user_id=actor;
  select role into target_role from public.workspace_members where workspace_id=target_workspace_id and user_id=target_user_id;
  if actor_role not in ('owner','admin') then raise exception using errcode='42501',message='manager_required'; end if;
  if target_role='owner' or (actor_role='admin' and target_role='admin') then raise exception using errcode='42501',message='owner_required'; end if;
  if requested_action='remove' then delete from public.workspace_members where workspace_id=target_workspace_id and user_id=target_user_id;
  elsif requested_action='role' and requested_role in ('admin','reviewer','operator','viewer') then update public.workspace_members set role=requested_role where workspace_id=target_workspace_id and user_id=target_user_id;
  else raise exception using errcode='22023',message='invalid_action'; end if;
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id,metadata) values(target_workspace_id,'workspace','warning','member.'||requested_action,'Workspace membership changed',actor,jsonb_build_object('user_id',target_user_id,'role',requested_role));
  return true;
end $$;

create or replace function public.transfer_workspace_ownership(target_workspace_id uuid, target_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
  if not exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=actor and role='owner') then raise exception using errcode='42501',message='owner_required'; end if;
  if not exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=target_user_id) then raise exception using errcode='22023',message='member_required'; end if;
  update public.workspace_members set role='admin' where workspace_id=target_workspace_id and user_id=actor;
  update public.workspace_members set role='owner' where workspace_id=target_workspace_id and user_id=target_user_id;
  update public.workspaces set created_by=target_user_id,updated_at=now() where id=target_workspace_id;
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id,metadata) values(target_workspace_id,'workspace','warning','ownership.transferred','Workspace ownership transferred',actor,jsonb_build_object('new_owner',target_user_id));
  return true;
end $$;

create or replace function public.set_workspace_lifecycle(target_workspace_id uuid, requested_action text, confirmation_name text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); target public.workspaces;
begin
  select * into target from public.workspaces where id=target_workspace_id;
  if not exists(select 1 from public.workspace_members where workspace_id=target_workspace_id and user_id=actor and role='owner') then raise exception using errcode='42501',message='owner_required'; end if;
  if target.moderation_status <> 'clear' then raise exception using errcode='42501',message='restricted_workspace'; end if;
  if requested_action='archive' then update public.workspaces set lifecycle_status='archived',archived_at=now(),operational_status='suspended',updated_at=now() where id=target_workspace_id;
  elsif requested_action='restore' then update public.workspaces set lifecycle_status='active',archived_at=null,deletion_requested_at=null,deletion_effective_at=null,operational_status='active',updated_at=now() where id=target_workspace_id;
  elsif requested_action='delete' then
    if confirmation_name<>target.name then raise exception using errcode='22023',message='confirmation_mismatch'; end if;
    update public.workspaces set lifecycle_status='pending_deletion',deletion_requested_at=now(),deletion_effective_at=now()+interval '14 days',operational_status='suspended',updated_at=now() where id=target_workspace_id;
    update public.api_keys set revoked_at=coalesce(revoked_at,now()) where workspace_id=target_workspace_id;
    update public.automations set enabled=false where workspace_id=target_workspace_id;
    update public.discord_link_codes set claimed_at=coalesce(claimed_at,now()) where workspace_id=target_workspace_id and claimed_at is null;
  else raise exception using errcode='22023',message='invalid_action'; end if;
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id) values(target_workspace_id,'workspace','warning','workspace.'||requested_action,'Workspace lifecycle changed',actor);
  return jsonb_build_object('status',(select lifecycle_status from public.workspaces where id=target_workspace_id),'deletes_at',(select deletion_effective_at from public.workspaces where id=target_workspace_id));
end $$;

create or replace function public.disconnect_workspace_integration(target_workspace_id uuid, target_provider text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
 if target_provider not in ('discord','roblox') or not nexora_private.can_manage_workspace(target_workspace_id) then raise exception using errcode='42501',message='manager_required'; end if;
 update public.integrations set status='disconnected',external_id=null,settings='{}'::jsonb,updated_at=now() where workspace_id=target_workspace_id and provider=target_provider;
 if target_provider='discord' then update public.workspaces set discord_guild_id=null,discord_guild_name=null,updated_at=now() where id=target_workspace_id; else update public.workspaces set roblox_group_id=null,roblox_group_name=null,roblox_group_icon_url=null,updated_at=now() where id=target_workspace_id; end if;
 insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id) values(target_workspace_id,'workspace','warning','integration.disconnected',initcap(target_provider)||' disconnected',actor);
 return true;
end $$;

revoke all on function public.update_workspace_profile(uuid,text), public.invite_workspace_member(uuid,text,text), public.manage_workspace_member(uuid,uuid,text,text), public.transfer_workspace_ownership(uuid,uuid), public.set_workspace_lifecycle(uuid,text,text), public.disconnect_workspace_integration(uuid,text) from public,anon;
grant execute on function public.update_workspace_profile(uuid,text), public.invite_workspace_member(uuid,text,text), public.manage_workspace_member(uuid,uuid,text,text), public.transfer_workspace_ownership(uuid,uuid), public.set_workspace_lifecycle(uuid,text,text), public.disconnect_workspace_integration(uuid,text) to authenticated;
