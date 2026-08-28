-- Public security-invoker wrappers need schema usage to resolve their exact
-- allow-listed private functions. This does not grant access to private tables.
grant usage on schema nexora_private to anon, authenticated;

revoke all on all tables in schema nexora_private from anon, authenticated;
revoke all on all sequences in schema nexora_private from anon, authenticated;

-- Keep only the intended authenticated helpers and secret-gated automation
-- functions executable. Other private functions retain their existing grants.
grant execute on function nexora_private.claim_free_membership_checks(text, integer) to anon, authenticated;
grant execute on function nexora_private.record_owner_membership_preflight(text, uuid, text) to anon, authenticated;
grant execute on function nexora_private.record_free_membership_check(text, uuid, text, text) to anon, authenticated;
