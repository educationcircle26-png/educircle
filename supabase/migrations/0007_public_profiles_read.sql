-- Bug fix: profiles were only readable by 'authenticated', so any view
-- that joins posts to profiles (posts_with_author) silently dropped
-- every row for anonymous visitors — breaking the public landing page's
-- "Parents are asking" preview, which is meant to work logged-out.
-- General (school_id is null) posts are already public via posts' own
-- RLS, so their authors' display name/avatar should be too.
drop policy "profiles readable by authenticated users" on public.profiles;

create policy "profiles readable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);
