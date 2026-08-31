create policy discord_role_sync_queue_deny_direct_access
  on nexora_private.discord_role_sync_queue for all
  to anon, authenticated
  using (false) with check (false);
