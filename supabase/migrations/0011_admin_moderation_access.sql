-- The admin dashboard needs to read and act on content the normal SELECT
-- policies hide: posts and comments held at pending_review. Permissive
-- policies are OR'd, so these widen access for admins only.
-- (verification_requests and school_memberships already grant admins access.)

create policy "admins read all posts"
  on public.posts for select
  to authenticated
  using (public.is_admin());

create policy "admins read all comments"
  on public.comments for select
  to authenticated
  using (public.is_admin());

create policy "admins moderate any post"
  on public.posts for update
  to authenticated
  using (public.is_admin());

create policy "admins moderate any comment"
  on public.comments for update
  to authenticated
  using (public.is_admin());
