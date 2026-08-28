create or replace function nexora_private.rotate_workspace_api_key(p_workspace_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); raw_key text; prefix text; digest_hex text; new_id uuid; workspace_status text;
begin
  if actor_id is null then raise exception using errcode='P0001',message='authentication_required'; end if;
  if not nexora_private.can_manage_workspace(p_workspace_id) then raise exception using errcode='42501',message='not_authorized'; end if;
  select operational_status into workspace_status from public.workspaces where id=p_workspace_id;
  if workspace_status is null then raise exception using errcode='P0002',message='workspace_not_found'; end if;
  if workspace_status<>'active' then raise exception using errcode='42501',message='workspace_suspended'; end if;
  raw_key:=substr(translate(encode(extensions.gen_random_bytes(24),'base64'),E'+/=\n','-_'),1,25);
  if char_length(raw_key)<>25 then raise exception using errcode='P0001',message='key_generation_failed'; end if;
  prefix:='nx_live_'||upper(substr(encode(extensions.gen_random_bytes(6),'hex'),1,8));
  digest_hex:=encode(extensions.digest(raw_key,'sha256'),'hex');
  update public.api_keys set revoked_at=coalesce(revoked_at,now()) where workspace_id=p_workspace_id and revoked_at is null;
  insert into public.api_keys(workspace_id,name,key_prefix,key_hash,scopes,created_by) values(p_workspace_id,'Workspace API key',prefix,digest_hex,array['workspace']::text[],actor_id) returning id into new_id;
  insert into public.workspace_logs(workspace_id,source,severity,event_type,summary,actor_user_id) values(p_workspace_id,'workspace','success','api_key.rotated','Private API key created or replaced',actor_id);
  return jsonb_build_object('id',new_id,'key_prefix',prefix,'api_key',raw_key);
end $$;
revoke all on function nexora_private.rotate_workspace_api_key(uuid) from public,anon;
grant execute on function nexora_private.rotate_workspace_api_key(uuid) to authenticated;
