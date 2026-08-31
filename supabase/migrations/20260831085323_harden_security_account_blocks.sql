create policy security_account_blocks_deny_direct_access
  on nexora_private.security_account_blocks
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index security_account_blocks_source_incident_idx
  on nexora_private.security_account_blocks (source_incident_id)
  where source_incident_id is not null;

create index security_account_blocks_unblocked_by_idx
  on nexora_private.security_account_blocks (unblocked_by)
  where unblocked_by is not null;
