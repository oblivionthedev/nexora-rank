alter table public.workspaces
  add column roblox_group_name text,
  add column roblox_group_icon_url text,
  add column discord_guild_name text,
  add column moderation_expires_at timestamptz,
  add column appeal_allowed boolean not null default true,
  add column appeal_note text;

create table public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  allowed_roblox_rank_min integer not null default 0 check (allowed_roblox_rank_min between 0 and 255),
  allowed_roblox_role_ids text[] not null default '{}'::text[],
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.workspace_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null check (source in ('workspace', 'roblox', 'discord', 'game')),
  severity text not null default 'info' check (severity in ('info', 'warning', 'error', 'success')),
  event_type text not null,
  summary text not null check (char_length(summary) between 2 and 500),
  actor_user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.discord_link_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_guild_id text,
  created_at timestamptz not null default now()
);

create index workspace_logs_workspace_created_idx on public.workspace_logs (workspace_id, created_at desc);
create index workspace_logs_source_idx on public.workspace_logs (workspace_id, source, created_at desc);
create index discord_link_codes_expiry_idx on public.discord_link_codes (expires_at) where claimed_at is null;

alter table public.workspace_settings enable row level security;
alter table public.workspace_logs enable row level security;
alter table public.discord_link_codes enable row level security;

create policy workspace_settings_member_read on public.workspace_settings for select to authenticated
using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_settings.workspace_id and wm.user_id = (select auth.uid())));
create policy workspace_logs_member_read on public.workspace_logs for select to authenticated
using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_logs.workspace_id and wm.user_id = (select auth.uid())));
create policy discord_link_codes_deny_direct on public.discord_link_codes for all to anon, authenticated using (false) with check (false);

grant select on public.workspace_settings, public.workspace_logs to authenticated;
revoke insert, update, delete on public.workspace_settings, public.workspace_logs from anon, authenticated;
revoke all on public.discord_link_codes from public, anon, authenticated;
revoke all on sequence public.workspace_logs_id_seq from public, anon, authenticated;

insert into public.workspace_settings (workspace_id)
select id from public.workspaces on conflict do nothing;

create or replace function nexora_private.can_manage_workspace(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(nexora_private.workspace_role(target_workspace_id) in ('owner', 'admin'), false)
$$;

create or replace function nexora_private.workspace_control_state(target_public_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); target_id uuid; actor_role text; result jsonb;
begin
  select w.id into target_id from public.workspaces w where w.public_id = target_public_id;
  if target_id is null then raise exception using errcode='P0002', message='workspace_not_found'; end if;
  actor_role := nexora_private.workspace_role(target_id);
  if actor_id is null or actor_role is null then raise exception using errcode='42501', message='workspace_access_denied'; end if;
  select jsonb_build_object(
    'workspace', jsonb_build_object('id',w.id,'public_id',w.public_id,'name',w.name,'slug',w.slug,'role',actor_role,
      'operational_status',w.operational_status,'moderation_status',w.moderation_status,'moderation_reason',w.moderation_reason,
      'moderation_expires_at',w.moderation_expires_at,'appeal_allowed',w.appeal_allowed,'appeal_note',w.appeal_note,
      'roblox_group_id',w.roblox_group_id,'roblox_group_name',w.roblox_group_name,'roblox_group_icon_url',w.roblox_group_icon_url,
      'discord_guild_id',w.discord_guild_id,'discord_guild_name',w.discord_guild_name),
    'counts', jsonb_build_object(
      'members',(select count(*) from public.workspace_members wm where wm.workspace_id=w.id),
      'rank_actions',(select count(*) from public.rank_actions ra where ra.workspace_id=w.id),
      'activity_sessions',(select count(*) from public.activity_sessions a where a.workspace_id=w.id),
      'log_events',(select count(*) from public.workspace_logs l where l.workspace_id=w.id)),
    'integrations', coalesce((select jsonb_agg(jsonb_build_object('provider',i.provider,'status',i.status,'external_id',i.external_id,'updated_at',i.updated_at)) from public.integrations i where i.workspace_id=w.id),'[]'::jsonb),
    'settings', coalesce((select to_jsonb(s) - 'workspace_id' - 'updated_by' from public.workspace_settings s where s.workspace_id=w.id),'{}'::jsonb)
  ) into result from public.workspaces w where w.id=target_id;
  return result;
end $$;

create or replace function public.workspace_control_state(target_public_id text)
returns jsonb language sql stable security invoker set search_path='' as $$ select nexora_private.workspace_control_state(target_public_id) $$;

create or replace function nexora_private.save_workspace_settings(target_workspace_id uuid, rank_min integer, role_ids text[])
returns boolean language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid();
begin
  if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then raise exception using errcode='42501',message='manager_required'; end if;
  if rank_min not between 0 and 255 or coalesce(array_length(role_ids,1),0)>50 then raise exception using errcode='22023',message='invalid_rank_settings'; end if;
  insert into public.workspace_settings(workspace_id,allowed_roblox_rank_min,allowed_roblox_role_ids,updated_by)
  values(target_workspace_id,rank_min,coalesce(role_ids,'{}'::text[]),actor_id)
  on conflict(workspace_id) do update set allowed_roblox_rank_min=excluded.allowed_roblox_rank_min,allowed_roblox_role_ids=excluded.allowed_roblox_role_ids,updated_by=actor_id,updated_at=now();
  insert into public.workspace_logs(workspace_id,source,event_type,summary,actor_user_id,metadata)
  values(target_workspace_id,'workspace','settings.updated','Workspace access settings updated',actor_id,jsonb_build_object('minimum_rank',rank_min));
  return true;
end $$;
create or replace function public.save_workspace_settings(target_workspace_id uuid, rank_min integer, role_ids text[])
returns boolean language sql security invoker set search_path='' as $$ select nexora_private.save_workspace_settings(target_workspace_id,rank_min,role_ids) $$;

create or replace function nexora_private.create_discord_link_code(target_workspace_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); raw_code text; digest_hex text; expiry timestamptz:=now()+interval '10 minutes';
begin
  if actor_id is null or not nexora_private.can_manage_workspace(target_workspace_id) then raise exception using errcode='42501',message='manager_required'; end if;
  if exists(select 1 from public.workspaces w where w.id=target_workspace_id and w.operational_status<>'active') then raise exception using errcode='42501',message='workspace_suspended'; end if;
  raw_code := 'NX-' || upper(substr(encode(extensions.gen_random_bytes(12),'hex'),1,12));
  digest_hex := encode(extensions.digest(raw_code,'sha256'),'hex');
  update public.discord_link_codes set expires_at=now() where workspace_id=target_workspace_id and claimed_at is null;
  insert into public.discord_link_codes(workspace_id,code_hash,created_by,expires_at) values(target_workspace_id,digest_hex,actor_id,expiry);
  insert into public.workspace_logs(workspace_id,source,event_type,summary,actor_user_id) values(target_workspace_id,'discord','discord.link_code_created','Discord link code created',actor_id);
  return jsonb_build_object('code',raw_code,'expires_at',expiry);
end $$;
create or replace function public.create_discord_link_code(target_workspace_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select nexora_private.create_discord_link_code(target_workspace_id) $$;

create or replace function nexora_private.claim_discord_link_code(raw_code text, guild_id text, guild_name text, discord_user_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare code_row public.discord_link_codes%rowtype; target public.workspaces%rowtype;
begin
  if raw_code !~ '^NX-[A-F0-9]{12}$' or guild_id !~ '^[0-9]{5,22}$' or discord_user_id !~ '^[0-9]{5,22}$' or char_length(trim(guild_name)) not between 2 and 100 then raise exception using errcode='22023',message='invalid_link_request'; end if;
  select * into code_row from public.discord_link_codes where code_hash=encode(extensions.digest(upper(raw_code),'sha256'),'hex') and claimed_at is null and expires_at>now() for update;
  if not found then raise exception using errcode='P0002',message='link_code_invalid_or_expired'; end if;
  select * into target from public.workspaces where id=code_row.workspace_id for update;
  if target.operational_status<>'active' then raise exception using errcode='42501',message='workspace_restricted'; end if;
  if exists(select 1 from public.workspaces w where w.discord_guild_id=guild_id and w.id<>target.id) then raise exception using errcode='23505',message='discord_server_already_linked'; end if;
  update public.discord_link_codes set claimed_at=now(),claimed_guild_id=guild_id where id=code_row.id;
  update public.workspaces set discord_guild_id=guild_id,discord_guild_name=trim(guild_name),updated_at=now() where id=target.id;
  insert into public.integrations(workspace_id,provider,external_id,status,settings,connected_by,connected_at)
  values(target.id,'discord',guild_id,'connected',jsonb_build_object('linked_by_discord_user_id',discord_user_id),code_row.created_by,now())
  on conflict(workspace_id,provider) do update set external_id=excluded.external_id,status='connected',settings=excluded.settings,connected_by=excluded.connected_by,connected_at=now(),updated_at=now();
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id,metadata)
  values(target.id,'discord','success','discord.server_linked','Discord server linked with /link',code_row.created_by,jsonb_build_object('guild_id',guild_id,'guild_name',trim(guild_name)));
  return jsonb_build_object('workspace_id',target.public_id,'workspace_name',target.name,'status','connected');
end $$;
create or replace function public.claim_discord_link_code(raw_code text,guild_id text,guild_name text,discord_user_id text)
returns jsonb language sql security invoker set search_path='' as $$ select nexora_private.claim_discord_link_code(raw_code,guild_id,guild_name,discord_user_id) $$;

create or replace function nexora_private.authenticate_workspace_api_key(raw_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare key_row public.api_keys%rowtype; target public.workspaces%rowtype;
begin
  if char_length(coalesce(raw_key,''))<>25 then raise exception using errcode='42501',message='invalid_api_key'; end if;
  select * into key_row from public.api_keys k where k.key_hash=encode(extensions.digest(raw_key,'sha256'),'hex') and k.revoked_at is null and (k.expires_at is null or k.expires_at>now()) limit 1;
  if not found then raise exception using errcode='42501',message='invalid_api_key'; end if;
  select * into target from public.workspaces where id=key_row.workspace_id;
  if target.operational_status<>'active' then raise exception using errcode='42501',message='workspace_restricted'; end if;
  update public.api_keys set last_used_at=now() where id=key_row.id;
  return jsonb_build_object('workspace_id',target.public_id,'workspace_name',target.name,'roblox_group_id',target.roblox_group_id,'discord_guild_id',target.discord_guild_id,'active',true);
end $$;
create or replace function public.authenticate_workspace_api_key(raw_key text)
returns jsonb language sql security invoker set search_path='' as $$ select nexora_private.authenticate_workspace_api_key(raw_key) $$;

drop function if exists public.staff_moderate_workspace(uuid,text,text);
drop function if exists nexora_private.staff_moderate_workspace(uuid,text,text);
create or replace function nexora_private.staff_moderate_workspace(target_workspace_id uuid, moderation_action text, action_reason text, suspension_days integer default null, can_appeal boolean default true, appeal_message text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); actor_role text; target_row public.workspaces%rowtype; log_action text; next_status text; expiry timestamptz;
begin
  actor_role:=nexora_private.current_staff_role(actor_id);
  if actor_role not in ('owner','admin','moderator') then raise exception using errcode='42501',message='staff_moderation_denied'; end if;
  if moderation_action not in ('suspend','restore','ban') or char_length(trim(coalesce(action_reason,''))) not between 4 and 500 then raise exception using errcode='22023',message='invalid_moderation_request'; end if;
  if moderation_action='ban' and actor_role not in ('owner','admin') then raise exception using errcode='42501',message='staff_ban_denied'; end if;
  if moderation_action='suspend' and (suspension_days is null or suspension_days not between 1 and 365) then raise exception using errcode='22023',message='invalid_suspension_days'; end if;
  select * into target_row from public.workspaces where id=target_workspace_id for update;
  if not found then raise exception using errcode='P0002',message='workspace_not_found'; end if;
  if moderation_action='restore' then
    next_status:='clear'; log_action:='workspace_restored'; expiry:=null;
    update public.workspaces set operational_status='active',moderation_status='clear',moderation_reason=null,moderation_expires_at=null,appeal_allowed=true,appeal_note=null,moderated_at=now(),moderated_by=actor_id,suspended_at=null,suspension_reason=null,updated_at=now() where id=target_workspace_id;
  else
    next_status:=case when moderation_action='ban' then 'banned' else 'suspended' end;
    log_action:=case when moderation_action='ban' then 'workspace_banned' else 'workspace_suspended' end;
    expiry:=case when moderation_action='suspend' then now()+make_interval(days=>suspension_days) else null end;
    update public.workspaces set operational_status='suspended',moderation_status=next_status,moderation_reason=trim(action_reason),moderation_expires_at=expiry,appeal_allowed=can_appeal,appeal_note=nullif(trim(appeal_message),''),moderated_at=now(),moderated_by=actor_id,suspended_at=now(),suspension_reason='staff_'||next_status,updated_at=now() where id=target_workspace_id;
  end if;
  insert into public.staff_action_log(actor_user_id,action_type,target_workspace_id,reason,previous_state,new_state)
  values(actor_id,log_action,target_workspace_id,trim(action_reason),jsonb_build_object('status',target_row.moderation_status),jsonb_build_object('status',next_status,'expires_at',expiry,'appeal_allowed',can_appeal));
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id,metadata)
  values(target_workspace_id,'workspace',case when moderation_action='restore' then 'success' else 'warning' end,'moderation.'||moderation_action,'Workspace '||case when moderation_action='restore' then 'restored' else next_status end,actor_id,jsonb_build_object('reason',trim(action_reason),'expires_at',expiry,'appeal_allowed',can_appeal));
  return jsonb_build_object('moderation_status',next_status,'expires_at',expiry);
end $$;
create or replace function public.staff_moderate_workspace(target_workspace_id uuid, moderation_action text, action_reason text, suspension_days integer default null, can_appeal boolean default true, appeal_message text default null)
returns jsonb language sql security invoker set search_path='' as $$ select nexora_private.staff_moderate_workspace(target_workspace_id,moderation_action,action_reason,suspension_days,can_appeal,appeal_message) $$;

create or replace function nexora_private.staff_find_workspaces(group_query text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor_role text:=nexora_private.current_staff_role(auth.uid());
begin
  if actor_role is null then raise exception using errcode='42501',message='staff_access_denied'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'public_id',w.public_id,'name',w.name,'roblox_group_id',w.roblox_group_id,'roblox_group_name',w.roblox_group_name,'roblox_group_icon_url',w.roblox_group_icon_url,'moderation_status',w.moderation_status,'operational_status',w.operational_status)) from public.workspaces w where w.roblox_group_id=trim(group_query) or w.roblox_group_name ilike '%'||trim(group_query)||'%' or w.public_id ilike '%'||trim(group_query)||'%' limit 25),'[]'::jsonb);
end $$;
create or replace function public.staff_find_workspaces(group_query text) returns jsonb language sql stable security invoker set search_path='' as $$ select nexora_private.staff_find_workspaces(group_query) $$;

create or replace function nexora_private.release_expired_staff_suspensions(candidate_secret text)
returns integer language plpgsql security definer set search_path='' as $$
declare released integer;
begin
  if not coalesce(nexora_private.cron_secret_valid(candidate_secret),false) then raise exception using errcode='42501',message='invalid_cron_secret'; end if;
  with changed as (update public.workspaces set operational_status='active',moderation_status='clear',moderation_reason=null,moderation_expires_at=null,suspended_at=null,suspension_reason=null,updated_at=now() where moderation_status='suspended' and moderation_expires_at<=now() returning id)
  select count(*) into released from changed;
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary) select w.id,'workspace','success','moderation.expired','Timed suspension ended automatically' from public.workspaces w where w.updated_at>=now()-interval '5 seconds' and w.moderation_status='clear' and w.moderated_at is not null;
  return released;
end $$;
create or replace function public.release_expired_staff_suspensions(candidate_secret text) returns integer language sql security invoker set search_path='' as $$ select nexora_private.release_expired_staff_suspensions(candidate_secret) $$;

revoke all on function nexora_private.workspace_control_state(text),nexora_private.save_workspace_settings(uuid,integer,text[]),nexora_private.create_discord_link_code(uuid),nexora_private.claim_discord_link_code(text,text,text,text),nexora_private.authenticate_workspace_api_key(text),nexora_private.staff_moderate_workspace(uuid,text,text,integer,boolean,text),nexora_private.staff_find_workspaces(text),nexora_private.release_expired_staff_suspensions(text) from public,anon;
grant execute on function nexora_private.workspace_control_state(text),nexora_private.save_workspace_settings(uuid,integer,text[]),nexora_private.create_discord_link_code(uuid),nexora_private.staff_moderate_workspace(uuid,text,text,integer,boolean,text),nexora_private.staff_find_workspaces(text) to authenticated;
grant execute on function nexora_private.claim_discord_link_code(text,text,text,text),nexora_private.authenticate_workspace_api_key(text),nexora_private.release_expired_staff_suspensions(text) to anon,authenticated;
revoke all on function public.workspace_control_state(text),public.save_workspace_settings(uuid,integer,text[]),public.create_discord_link_code(uuid),public.staff_moderate_workspace(uuid,text,text,integer,boolean,text),public.staff_find_workspaces(text) from public,anon;
grant execute on function public.workspace_control_state(text),public.save_workspace_settings(uuid,integer,text[]),public.create_discord_link_code(uuid),public.staff_moderate_workspace(uuid,text,text,integer,boolean,text),public.staff_find_workspaces(text) to authenticated;
revoke all on function public.claim_discord_link_code(text,text,text,text),public.authenticate_workspace_api_key(text),public.release_expired_staff_suspensions(text) from public;
grant execute on function public.claim_discord_link_code(text,text,text,text),public.authenticate_workspace_api_key(text),public.release_expired_staff_suspensions(text) to anon,authenticated;
