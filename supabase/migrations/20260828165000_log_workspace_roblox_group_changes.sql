create or replace function nexora_private.set_workspace_roblox_group(target_workspace_id uuid,group_id text,group_name text,icon_url text,oauth_verified boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid();
begin
 if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then raise exception using errcode='42501',message='manager_required'; end if;
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
create or replace function public.set_workspace_roblox_group(target_workspace_id uuid,group_id text,group_name text,icon_url text,oauth_verified boolean)
returns boolean language sql security invoker set search_path='' as $$ select nexora_private.set_workspace_roblox_group(target_workspace_id,group_id,group_name,icon_url,oauth_verified) $$;
revoke all on function nexora_private.set_workspace_roblox_group(uuid,text,text,text,boolean) from public,anon;
grant execute on function nexora_private.set_workspace_roblox_group(uuid,text,text,text,boolean) to authenticated;
revoke all on function public.set_workspace_roblox_group(uuid,text,text,text,boolean) from public,anon;
grant execute on function public.set_workspace_roblox_group(uuid,text,text,text,boolean) to authenticated;
