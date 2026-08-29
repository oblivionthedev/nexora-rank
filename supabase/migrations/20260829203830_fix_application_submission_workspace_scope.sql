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
    from public.application_forms application_form
    where application_form.id = application_submissions.form_id
      and application_form.workspace_id = application_submissions.workspace_id
      and application_form.status = 'open'
      and (application_form.opens_at is null or application_form.opens_at <= now())
      and (application_form.closes_at is null or application_form.closes_at > now())
  )
);
