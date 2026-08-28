-- Keep privileged implementations out of the exposed public schema. Public RPC
-- functions are security-invoker wrappers; the private implementations perform
-- their existing auth.uid() and workspace-role checks.

alter function public.update_workspace_profile(uuid,text) set schema nexora_private;
alter function public.invite_workspace_member(uuid,text,text) set schema nexora_private;
alter function public.manage_workspace_member(uuid,uuid,text,text) set schema nexora_private;
alter function public.transfer_workspace_ownership(uuid,uuid) set schema nexora_private;
alter function public.set_workspace_lifecycle(uuid,text,text) set schema nexora_private;
alter function public.disconnect_workspace_integration(uuid,text) set schema nexora_private;

create function public.update_workspace_profile(target_workspace_id uuid, requested_name text)
returns boolean language sql security invoker set search_path='' as $$
  select nexora_private.update_workspace_profile(target_workspace_id, requested_name)
$$;
create function public.invite_workspace_member(target_workspace_id uuid, target_email text, requested_role text)
returns jsonb language sql security invoker set search_path='' as $$
  select nexora_private.invite_workspace_member(target_workspace_id, target_email, requested_role)
$$;
create function public.manage_workspace_member(target_workspace_id uuid, target_user_id uuid, requested_role text, requested_action text)
returns boolean language sql security invoker set search_path='' as $$
  select nexora_private.manage_workspace_member(target_workspace_id, target_user_id, requested_role, requested_action)
$$;
create function public.transfer_workspace_ownership(target_workspace_id uuid, target_user_id uuid)
returns boolean language sql security invoker set search_path='' as $$
  select nexora_private.transfer_workspace_ownership(target_workspace_id, target_user_id)
$$;
create function public.set_workspace_lifecycle(target_workspace_id uuid, requested_action text, confirmation_name text default '')
returns jsonb language sql security invoker set search_path='' as $$
  select nexora_private.set_workspace_lifecycle(target_workspace_id, requested_action, confirmation_name)
$$;
create function public.disconnect_workspace_integration(target_workspace_id uuid, target_provider text)
returns boolean language sql security invoker set search_path='' as $$
  select nexora_private.disconnect_workspace_integration(target_workspace_id, target_provider)
$$;

revoke all on function nexora_private.update_workspace_profile(uuid,text), nexora_private.invite_workspace_member(uuid,text,text),
  nexora_private.manage_workspace_member(uuid,uuid,text,text), nexora_private.transfer_workspace_ownership(uuid,uuid),
  nexora_private.set_workspace_lifecycle(uuid,text,text), nexora_private.disconnect_workspace_integration(uuid,text) from public, anon;
grant execute on function nexora_private.update_workspace_profile(uuid,text), nexora_private.invite_workspace_member(uuid,text,text),
  nexora_private.manage_workspace_member(uuid,uuid,text,text), nexora_private.transfer_workspace_ownership(uuid,uuid),
  nexora_private.set_workspace_lifecycle(uuid,text,text), nexora_private.disconnect_workspace_integration(uuid,text) to authenticated;
revoke all on function public.update_workspace_profile(uuid,text), public.invite_workspace_member(uuid,text,text),
  public.manage_workspace_member(uuid,uuid,text,text), public.transfer_workspace_ownership(uuid,uuid),
  public.set_workspace_lifecycle(uuid,text,text), public.disconnect_workspace_integration(uuid,text) from public, anon;
grant execute on function public.update_workspace_profile(uuid,text), public.invite_workspace_member(uuid,text,text),
  public.manage_workspace_member(uuid,uuid,text,text), public.transfer_workspace_ownership(uuid,uuid),
  public.set_workspace_lifecycle(uuid,text,text), public.disconnect_workspace_integration(uuid,text) to authenticated;

-- Avoid duplicate SELECT policies created by FOR ALL manager policies.
drop policy workspace_roblox_groups_manage on public.workspace_roblox_groups;
drop policy departments_manage on public.departments;
drop policy community_sessions_manage on public.community_sessions;
drop policy leave_requests_manage on public.leave_requests;
drop policy workspace_tasks_manage on public.workspace_tasks;
drop policy knowledge_entries_manage on public.knowledge_entries;
drop policy announcement_templates_manage on public.announcement_templates;
drop policy community_snapshots_manage on public.community_snapshots;

create policy workspace_roblox_groups_insert on public.workspace_roblox_groups for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy workspace_roblox_groups_update on public.workspace_roblox_groups for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy workspace_roblox_groups_delete on public.workspace_roblox_groups for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy departments_insert on public.departments for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy departments_update on public.departments for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy departments_delete on public.departments for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_sessions_insert on public.community_sessions for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_sessions_update on public.community_sessions for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_sessions_delete on public.community_sessions for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy leave_requests_insert on public.leave_requests for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy leave_requests_update on public.leave_requests for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy leave_requests_delete on public.leave_requests for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy workspace_tasks_insert on public.workspace_tasks for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy workspace_tasks_update on public.workspace_tasks for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy workspace_tasks_delete on public.workspace_tasks for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy knowledge_entries_insert on public.knowledge_entries for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy knowledge_entries_update on public.knowledge_entries for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy knowledge_entries_delete on public.knowledge_entries for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy announcement_templates_insert on public.announcement_templates for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy announcement_templates_update on public.announcement_templates for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy announcement_templates_delete on public.announcement_templates for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_snapshots_insert on public.community_snapshots for insert to authenticated with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_snapshots_update on public.community_snapshots for update to authenticated using ((select nexora_private.can_manage_workspace(workspace_id))) with check ((select nexora_private.can_manage_workspace(workspace_id)));
create policy community_snapshots_delete on public.community_snapshots for delete to authenticated using ((select nexora_private.can_manage_workspace(workspace_id)));

create index announcement_templates_created_by_idx on public.announcement_templates(created_by) where created_by is not null;
create index community_sessions_department_idx on public.community_sessions(department_id) where department_id is not null;
create index community_sessions_host_idx on public.community_sessions(host_user_id) where host_user_id is not null;
create index knowledge_entries_created_by_idx on public.knowledge_entries(created_by) where created_by is not null;
create index leave_requests_member_idx on public.leave_requests(member_user_id) where member_user_id is not null;
create index leave_requests_reviewer_idx on public.leave_requests(reviewed_by) where reviewed_by is not null;
create index workspace_tasks_assignee_idx on public.workspace_tasks(assigned_to) where assigned_to is not null;
create index workspace_tasks_creator_idx on public.workspace_tasks(created_by) where created_by is not null;
create index workspace_tasks_department_idx on public.workspace_tasks(department_id) where department_id is not null;
