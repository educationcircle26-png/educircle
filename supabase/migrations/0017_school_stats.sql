-- The home page and the school directory want to show how many verified
-- parents and how many discussions a school has. school_memberships is
-- members-only by design, so a signed-out visitor counting rows there gets
-- zero — which is why those figures never appeared.
--
-- This exposes the aggregate and only the aggregate: counts per school, no
-- user ids, nothing that says who belongs where. Same shape as poll_results.

create or replace view public.school_stats as
select
  s.id as school_id,
  (
    select count(*)::int from public.school_memberships m
    where m.school_id = s.id and m.status = 'approved'
  ) as parents,
  (
    select count(*)::int from public.posts p
    where p.school_id = s.id and p.status = 'published'
  ) as discussions
from public.schools s;

grant select on public.school_stats to anon, authenticated;
