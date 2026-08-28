-- Recover private-beta setup attempts that reached a complete owner profile
-- and Discord identity but were interrupted by the former RLS-blocked plan write.
update public.profiles p
set plan_selected_at = now()
where p.plan_key = 'free'
  and p.plan_selected_at is null
  and p.first_name is not null
  and p.last_name is not null
  and p.contact_email is not null
  and exists (
    select 1 from public.account_links l
    where l.user_id = p.id and l.provider = 'discord'
  );

-- These legacy beta RPCs are not used by the application. Keep their definitions
-- for migration compatibility while removing them from the exposed API surface.
revoke all on function public.complete_onboarding() from public, anon, authenticated;
revoke all on function public.onboarding_state() from public, anon, authenticated;
revoke all on function public.issue_workspace_api_key(uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_workspace_api_key(uuid) from public, anon, authenticated;
revoke all on function public.set_roblox_link_deferred(boolean) from public, anon, authenticated;
