alter table public.application_forms
  add column announcement_channel_id text,
  add column announcement_message_id text,
  add column submissions_channel_id text;

alter table public.application_submissions
  add column applicant_discord_user_id text,
  add column applicant_discord_name text,
  add column applicant_discord_avatar_url text;

alter table public.application_forms
  add constraint application_forms_announcement_channel_id_format
    check (announcement_channel_id is null or announcement_channel_id ~ '^[0-9]{17,22}$'),
  add constraint application_forms_announcement_message_id_format
    check (announcement_message_id is null or announcement_message_id ~ '^[0-9]{17,22}$'),
  add constraint application_forms_submissions_channel_id_format
    check (submissions_channel_id is null or submissions_channel_id ~ '^[0-9]{17,22}$');

alter table public.application_submissions
  add constraint application_submissions_discord_user_id_format
    check (applicant_discord_user_id is null or applicant_discord_user_id ~ '^[0-9]{17,22}$');

drop policy if exists "application_submissions_insert_self" on public.application_submissions;
create policy "application_submissions_insert_self"
on public.application_submissions
for insert
to authenticated
with check (
  applicant_id = (select auth.uid())
  and status = 'submitted'
  and exists (
    select 1
    from public.application_forms form
    where form.id = form_id
      and form.workspace_id = workspace_id
      and form.status = 'open'
      and (form.opens_at is null or form.opens_at <= now())
      and (form.closes_at is null or form.closes_at > now())
  )
);

comment on column public.application_forms.announcement_channel_id is
  'Discord channel where the public application announcement was sent.';
comment on column public.application_forms.announcement_message_id is
  'Discord message created by Nexora for the application announcement.';
comment on column public.application_forms.submissions_channel_id is
  'Discord channel that receives private submission notifications.';
comment on column public.application_submissions.applicant_discord_user_id is
  'Verified Discord identity copied from the applicant account link at submission time.';
