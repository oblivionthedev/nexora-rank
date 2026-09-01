-- Start a fresh Beta application round without deleting review history.
update nexora_private.platform_settings
set beta_enabled = true,
    updated_at = now()
where singleton = true;

update nexora_private.beta_applications
set reapply_wait_bypassed_at = now(),
    reapply_wait_bypassed_by = null,
    reapply_wait_bypass_reason = 'Beta program restarted; applicant may reapply immediately.'
where status = 'declined'
  and archived_at is null;
