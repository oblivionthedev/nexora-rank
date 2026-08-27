-- Advisor-driven hardening after the initial Nexora Rank schema launch.

-- Supabase may create this helper when RLS-by-default is selected. It is an
-- administrative helper and must never be reachable through client roles.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Keep the privileged transaction out of the exposed public API schema. The
-- public wrapper is invoker-safe and the private implementation verifies
-- auth.uid() before doing any work.
alter function public.create_workspace(text, text) set schema nexora_private;

revoke all on function nexora_private.create_workspace(text, text) from public, anon, authenticated;
grant execute on function nexora_private.create_workspace(text, text) to authenticated;

create function public.create_workspace(workspace_name text, workspace_slug text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select nexora_private.create_workspace(workspace_name, workspace_slug);
$$;

revoke all on function public.create_workspace(text, text) from public, anon;
grant execute on function public.create_workspace(text, text) to authenticated;

-- Explicit deny policy documents that this idempotency ledger is server-only.
create policy "webhook_events_server_only"
on public.webhook_events
for all
to anon, authenticated
using (false)
with check (false);

-- Avoid duplicate permissive SELECT policies from FOR ALL admin policies.
drop policy "integrations_manage_admin" on public.integrations;
create policy "integrations_insert_admin" on public.integrations for insert to authenticated with check (nexora_private.can_manage_workspace(workspace_id));
create policy "integrations_update_admin" on public.integrations for update to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));
create policy "integrations_delete_admin" on public.integrations for delete to authenticated using (nexora_private.can_manage_workspace(workspace_id));

drop policy "rank_bindings_manage_admin" on public.rank_bindings;
create policy "rank_bindings_insert_admin" on public.rank_bindings for insert to authenticated with check (nexora_private.can_manage_workspace(workspace_id));
create policy "rank_bindings_update_admin" on public.rank_bindings for update to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));
create policy "rank_bindings_delete_admin" on public.rank_bindings for delete to authenticated using (nexora_private.can_manage_workspace(workspace_id));

drop policy "activity_quotas_manage_admin" on public.activity_quotas;
create policy "activity_quotas_insert_admin" on public.activity_quotas for insert to authenticated with check (nexora_private.can_manage_workspace(workspace_id));
create policy "activity_quotas_update_admin" on public.activity_quotas for update to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));
create policy "activity_quotas_delete_admin" on public.activity_quotas for delete to authenticated using (nexora_private.can_manage_workspace(workspace_id));

drop policy "application_forms_manage_admin" on public.application_forms;
create policy "application_forms_insert_admin" on public.application_forms for insert to authenticated with check (nexora_private.can_manage_workspace(workspace_id));
create policy "application_forms_update_admin" on public.application_forms for update to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));
create policy "application_forms_delete_admin" on public.application_forms for delete to authenticated using (nexora_private.can_manage_workspace(workspace_id));

drop policy "automations_manage_admin" on public.automations;
create policy "automations_insert_admin" on public.automations for insert to authenticated with check (nexora_private.can_manage_workspace(workspace_id));
create policy "automations_update_admin" on public.automations for update to authenticated using (nexora_private.can_manage_workspace(workspace_id)) with check (nexora_private.can_manage_workspace(workspace_id));
create policy "automations_delete_admin" on public.automations for delete to authenticated using (nexora_private.can_manage_workspace(workspace_id));

-- Cover every foreign key that the production access patterns may filter or
-- cascade through. These also keep delete/update checks predictable at scale.
create index application_forms_created_by_idx on public.application_forms(created_by) where created_by is not null;
create index application_submissions_reviewed_by_idx on public.application_submissions(reviewed_by) where reviewed_by is not null;
create index audit_events_actor_idx on public.audit_events(actor_id) where actor_id is not null;
create index automation_runs_automation_idx on public.automation_runs(automation_id);
create index automations_created_by_idx on public.automations(created_by) where created_by is not null;
create index integrations_connected_by_idx on public.integrations(connected_by) where connected_by is not null;
create index rank_actions_requested_by_idx on public.rank_actions(requested_by) where requested_by is not null;
create index rank_actions_reviewed_by_idx on public.rank_actions(reviewed_by) where reviewed_by is not null;
create index rank_actions_target_user_idx on public.rank_actions(target_user_id) where target_user_id is not null;
create index workspaces_created_by_idx on public.workspaces(created_by);
