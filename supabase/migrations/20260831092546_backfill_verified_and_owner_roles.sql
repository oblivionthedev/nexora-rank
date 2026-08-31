insert into nexora_private.discord_role_sync_queue
  (guild_id, discord_user_id, role_id, operation)
select '1542617161825255474', link.provider_user_id, '1543357165836705883', 'add'
from public.account_links link
where link.provider='discord' and link.verified_at is not null
on conflict (guild_id, discord_user_id, role_id) where status in ('pending','processing','failed')
do update set operation='add', status='pending', attempts=0, next_attempt_at=now(),
  last_error=null, updated_at=now(), completed_at=null;

insert into nexora_private.discord_role_sync_queue
  (guild_id, discord_user_id, role_id, operation)
select distinct '1542617161825255474', link.provider_user_id, '1543357235185324123', 'add'
from public.account_links link
join public.workspace_members member on member.user_id=link.user_id and member.role='owner'
where link.provider='discord' and link.verified_at is not null
on conflict (guild_id, discord_user_id, role_id) where status in ('pending','processing','failed')
do update set operation='add', status='pending', attempts=0, next_attempt_at=now(),
  last_error=null, updated_at=now(), completed_at=null;
