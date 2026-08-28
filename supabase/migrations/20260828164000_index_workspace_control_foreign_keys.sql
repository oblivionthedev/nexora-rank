create index discord_link_codes_created_by_idx on public.discord_link_codes(created_by);
create index discord_link_codes_workspace_idx on public.discord_link_codes(workspace_id,created_at desc);
create index workspace_logs_actor_idx on public.workspace_logs(actor_user_id) where actor_user_id is not null;
create index workspace_settings_updated_by_idx on public.workspace_settings(updated_by) where updated_by is not null;
