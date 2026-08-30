-- Migration 0007 opened profiles up to everyone so anonymous visitors could
-- see post authors through posts_with_author. That worked, but it exposed the
-- whole row — phone, search_preferences, full_name and is_admin included — to
-- anyone holding the anon key, which ships in the client bundle.
--
-- This narrows it back down: the base table becomes self/moderator/admin only,
-- and a public_profiles view carries just the columns meant to be seen. The
-- author views read from that view instead of the table.

drop policy if exists "profiles readable by everyone" on public.profiles;
drop policy if exists "profiles readable by authenticated users" on public.profiles;

drop policy if exists "users read their own profile" on public.profiles;
create policy "users read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admins read every profile" on public.profiles;
create policy "admins read every profile"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Moderators need the names behind the membership requests they're reviewing.
drop policy if exists "school moderators read profiles of their applicants"
  on public.profiles;
create policy "school moderators read profiles of their applicants"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.school_memberships m
      where m.user_id = profiles.id
        and public.is_school_moderator(m.school_id)
    )
  );

-- No security_invoker, so this runs as the view owner and is not blocked by
-- the policies above. The column list is the whole protection here: never add
-- phone, full_name, search_preferences or is_admin to it.
create or replace view public.public_profiles as
select
  id,
  display_name,
  avatar_url,
  bio,
  location,
  occupation,
  help_areas,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Repoint the author views at the narrowed source.
--
-- These are dropped rather than replaced: they select `c.*` / `p.*`, which was
-- expanded to a fixed column list when each view was created. Migration 0008
-- added comments.parent_comment_id after the fact, so re-expanding `c.*` now
-- shifts every later column and CREATE OR REPLACE refuses the rename. Dropping
-- also repairs comments_with_author, which had been stuck without
-- parent_comment_id since 0008 and so never returned it to the app.
drop view if exists public.posts_with_author;
drop view if exists public.comments_with_author;
drop view if exists public.chat_messages_with_author;

create view public.posts_with_author
with (security_invoker = true)
as
select
  p.*,
  case
    when p.is_anonymous and auth.uid() <> p.author_id and not public.is_admin()
      then null
    else pr.display_name
  end as author_display_name,
  case
    when p.is_anonymous and auth.uid() <> p.author_id and not public.is_admin()
      then null
    else pr.avatar_url
  end as author_avatar_url
from public.posts p
join public.public_profiles pr on pr.id = p.author_id;

create view public.comments_with_author
with (security_invoker = true)
as
select
  c.*,
  case
    when c.is_anonymous and auth.uid() <> c.author_id and not public.is_admin()
      then null
    else pr.display_name
  end as author_display_name,
  case
    when c.is_anonymous and auth.uid() <> c.author_id and not public.is_admin()
      then null
    else pr.avatar_url
  end as author_avatar_url
from public.comments c
join public.public_profiles pr on pr.id = c.author_id;

create view public.chat_messages_with_author
with (security_invoker = true)
as
select
  m.*,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url
from public.chat_messages m
join public.public_profiles pr on pr.id = m.author_id;

-- Dropping the views dropped their grants along with them.
grant select on public.posts_with_author to anon, authenticated;
grant select on public.comments_with_author to anon, authenticated;
grant select on public.chat_messages_with_author to authenticated;
