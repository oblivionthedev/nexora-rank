-- Keep staff tables inaccessible through direct Data API queries. Console data
-- is exposed only by the role-checking RPC functions.
create policy staff_members_deny_direct_access
on public.staff_members for all
to anon, authenticated
using (false)
with check (false);

create policy staff_action_log_deny_direct_access
on public.staff_action_log for all
to anon, authenticated
using (false)
with check (false);

create index staff_action_log_actor_idx
  on public.staff_action_log (actor_user_id, created_at desc);
create index staff_action_log_target_staff_idx
  on public.staff_action_log (target_staff_user_id, created_at desc)
  where target_staff_user_id is not null;
create index staff_members_created_by_idx
  on public.staff_members (created_by)
  where created_by is not null;
create index workspaces_moderated_by_idx
  on public.workspaces (moderated_by)
  where moderated_by is not null;
