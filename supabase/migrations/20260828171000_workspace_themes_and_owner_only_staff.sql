-- Workspace appearance, complete restriction enforcement, and sole-owner staff access.

alter table public.workspace_settings
  add column theme_mode text not null default 'gradient',
  add column theme_color_start text not null default '#d79a9a',
  add column theme_color_end text not null default '#b76e79';

alter table public.workspace_settings
  add constraint workspace_settings_theme_mode_check check (theme_mode in ('solid', 'gradient')),
  add constraint workspace_settings_theme_start_check check (theme_color_start ~ '^#[0-9a-fA-F]{6}$'),
  add constraint workspace_settings_theme_end_check check (theme_color_end ~ '^#[0-9a-fA-F]{6}$');

create or replace function nexora_private.save_workspace_theme(
  target_workspace_id uuid,
  requested_theme_mode text,
  requested_color_start text,
  requested_color_end text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  normalized_start text := lower(requested_color_start);
  normalized_end text := lower(requested_color_end);
begin
  if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then
    raise exception using errcode = '42501', message = 'manager_required';
  end if;
  if exists (select 1 from public.workspaces where id = target_workspace_id and operational_status <> 'active') then
    raise exception using errcode = '42501', message = 'workspace_restricted';
  end if;
  if requested_theme_mode not in ('solid', 'gradient')
    or normalized_start !~ '^#[0-9a-f]{6}$'
    or normalized_end !~ '^#[0-9a-f]{6}$' then
    raise exception using errcode = '22023', message = 'invalid_workspace_theme';
  end if;
  if requested_theme_mode = 'solid' then normalized_end := normalized_start; end if;

  insert into public.workspace_settings(workspace_id, theme_mode, theme_color_start, theme_color_end, updated_by)
  values(target_workspace_id, requested_theme_mode, normalized_start, normalized_end, actor_id)
  on conflict(workspace_id) do update set
    theme_mode = excluded.theme_mode,
    theme_color_start = excluded.theme_color_start,
    theme_color_end = excluded.theme_color_end,
    updated_by = actor_id,
    updated_at = now();

  insert into public.workspace_logs(workspace_id, source, event_type, summary, actor_user_id, metadata)
  values(target_workspace_id, 'workspace', 'workspace.theme_updated', 'Workspace appearance updated', actor_id,
    jsonb_build_object('mode', requested_theme_mode, 'start', normalized_start, 'end', normalized_end));
  return true;
end;
$$;

create or replace function public.save_workspace_theme(
  target_workspace_id uuid,
  requested_theme_mode text,
  requested_color_start text,
  requested_color_end text
)
returns boolean language sql security invoker set search_path = '' as $$
  select nexora_private.save_workspace_theme(target_workspace_id, requested_theme_mode, requested_color_start, requested_color_end)
$$;

-- Access preferences must not remain editable during a platform restriction.
create or replace function nexora_private.save_workspace_settings(target_workspace_id uuid, rank_min integer, role_ids text[])
returns boolean language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid();
begin
  if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then raise exception using errcode='42501',message='manager_required'; end if;
  if exists(select 1 from public.workspaces where id=target_workspace_id and operational_status<>'active') then raise exception using errcode='42501',message='workspace_restricted'; end if;
  if rank_min not between 0 and 255 or coalesce(array_length(role_ids,1),0)>50 then raise exception using errcode='22023',message='invalid_rank_settings'; end if;
  insert into public.workspace_settings(workspace_id,allowed_roblox_rank_min,allowed_roblox_role_ids,updated_by)
  values(target_workspace_id,rank_min,coalesce(role_ids,'{}'::text[]),actor_id)
  on conflict(workspace_id) do update set allowed_roblox_rank_min=excluded.allowed_roblox_rank_min,allowed_roblox_role_ids=excluded.allowed_roblox_role_ids,updated_by=actor_id,updated_at=now();
  insert into public.workspace_logs(workspace_id,source,event_type,summary,actor_user_id,metadata)
  values(target_workspace_id,'workspace','settings.updated','Workspace access settings updated',actor_id,jsonb_build_object('minimum_rank',rank_min));
  return true;
end $$;

-- Roblox selection is also disabled while the whole workspace is restricted.
create or replace function nexora_private.set_workspace_roblox_group(target_workspace_id uuid,group_id text,group_name text,icon_url text,oauth_verified boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid();
begin
 if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then raise exception using errcode='42501',message='manager_required'; end if;
 if exists(select 1 from public.workspaces where id=target_workspace_id and operational_status<>'active') then raise exception using errcode='42501',message='workspace_restricted'; end if;
 if group_id!~'^[0-9]+$' or char_length(trim(group_name)) not between 1 and 100 then raise exception using errcode='22023',message='invalid_group'; end if;
 if exists(select 1 from public.workspaces where roblox_group_id=group_id and id<>target_workspace_id) then raise exception using errcode='23505',message='group_already_claimed'; end if;
 update public.workspaces set roblox_group_id=group_id,roblox_group_name=trim(group_name),roblox_group_icon_url=nullif(icon_url,''),updated_at=now() where id=target_workspace_id;
 insert into public.integrations(workspace_id,provider,external_id,status,settings,connected_by,connected_at)
 values(target_workspace_id,'roblox',group_id,case when oauth_verified then 'connected' else 'pending' end,jsonb_build_object('group_name',trim(group_name),'ownership',case when oauth_verified then 'oauth_verified' else 'pending_oauth' end),actor_id,case when oauth_verified then now() else null end)
 on conflict(workspace_id,provider) do update set external_id=excluded.external_id,status=excluded.status,settings=excluded.settings,connected_by=actor_id,connected_at=excluded.connected_at,updated_at=now();
 insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id,metadata)
 values(target_workspace_id,'roblox','success','roblox.group_selected','Roblox group selected for this workspace',actor_id,jsonb_build_object('group_id',group_id,'group_name',trim(group_name),'oauth_verified',oauth_verified));
 return true;
end $$;

-- Only the platform owner is a valid Staff operator. Historical non-owner rows
-- are retained for audit history but disabled and cannot authorize requests.
update public.staff_members set active = false, updated_at = now() where role <> 'owner' and active = true;

create or replace function nexora_private.current_staff_role(actor_id uuid default auth.uid())
returns text language sql stable security definer set search_path = '' as $$
  select 'owner'::text
  from public.staff_members sm
  where sm.user_id = actor_id and sm.active = true and sm.role = 'owner'
  limit 1
$$;

revoke all on function nexora_private.save_workspace_theme(uuid,text,text,text) from public, anon;
grant execute on function nexora_private.save_workspace_theme(uuid,text,text,text) to authenticated;
revoke all on function public.save_workspace_theme(uuid,text,text,text) from public, anon;
grant execute on function public.save_workspace_theme(uuid,text,text,text) to authenticated;
