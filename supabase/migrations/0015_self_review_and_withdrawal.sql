-- Two gaps left over from the 0014 review, both surfaced while verifying it.
--
--  1. A school moderator could approve their OWN membership and verification
--     requests for the school they moderate. Narrow, since they are already
--     in — but self-review should never be the mechanism, and it is what let
--     the verification test look like it was still failing.
--
--  2. There was no DELETE policy on school_memberships or
--     verification_requests at all, so a parent could never leave a school or
--     withdraw a request once filed. Nothing could clear those rows short of
--     the service-role key.
--
-- Site admins are exempt from the self-review guard: they are the trust root
-- for the whole instance, whereas a moderator is a volunteer scoped to one
-- school.

drop policy if exists "moderators and admins review memberships of their school"
  on public.school_memberships;
create policy "moderators and admins review memberships of their school"
  on public.school_memberships for update
  to authenticated
  using (
    public.is_admin()
    or (public.is_school_moderator(school_id) and user_id <> auth.uid())
  )
  with check (
    public.is_admin()
    or (public.is_school_moderator(school_id) and user_id <> auth.uid())
  );

drop policy if exists "moderators decide requests for their school"
  on public.verification_requests;
create policy "moderators decide requests for their school"
  on public.verification_requests for update
  to authenticated
  using (
    public.is_admin()
    or (public.is_school_moderator(school_id) and user_id <> auth.uid())
  )
  with check (
    public.is_admin()
    or (public.is_school_moderator(school_id) and user_id <> auth.uid())
  );

drop policy if exists "users leave a school" on public.school_memberships;
create policy "users leave a school"
  on public.school_memberships for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "moderators and admins remove memberships"
  on public.school_memberships;
create policy "moderators and admins remove memberships"
  on public.school_memberships for delete
  to authenticated
  using (
    public.is_admin()
    or (public.is_school_moderator(school_id) and user_id <> auth.uid())
  );

drop policy if exists "users withdraw their own verification request"
  on public.verification_requests;
create policy "users withdraw their own verification request"
  on public.verification_requests for delete
  to authenticated
  using (user_id = auth.uid());
