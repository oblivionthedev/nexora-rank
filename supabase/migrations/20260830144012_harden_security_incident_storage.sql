create policy security_incidents_no_direct_access
  on nexora_private.security_incidents
  for all
  to public
  using (false)
  with check (false);

create index security_incidents_resolved_by_idx
  on nexora_private.security_incidents (resolved_by)
  where resolved_by is not null;

create index beta_applications_archived_by_idx
  on nexora_private.beta_applications (archived_by)
  where archived_by is not null;
