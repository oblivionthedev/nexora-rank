with resolved as (
  select application.id, link.provider_user_id
  from nexora_private.beta_applications application
  join auth.users users on lower(users.email) = lower(application.email)
  join public.account_links link on link.user_id = users.id and link.provider = 'discord'
  where application.status = 'selected' and application.discord_user_id is null
), updated as (
  update nexora_private.beta_applications application
  set discord_user_id = resolved.provider_user_id, updated_at = now()
  from resolved where application.id = resolved.id
  returning application.discord_user_id
)
insert into nexora_private.discord_role_sync_queue
  (guild_id, discord_user_id, role_id, operation)
select '1542617161825255474', discord_user_id, '1543356004316614687', 'add'
from updated
on conflict (guild_id, discord_user_id, role_id) where status in ('pending','processing','failed')
do update set operation='add', status='pending', attempts=0, next_attempt_at=now(),
  last_error=null, updated_at=now(), completed_at=null;
