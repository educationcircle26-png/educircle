-- Following another parent.
--
-- The graph is deliberately not enumerable. A parent can read the rows where
-- they are the follower (who they follow) and the rows where they are the
-- target (who follows them) — nobody can list a third party's connections.
-- Public-facing counts come from follow_counts, which exposes totals and no
-- identities, the way poll_results and school_stats do.

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  -- Following yourself would quietly corrupt every count downstream.
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx
  on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "users read their own follow edges" on public.follows;
create policy "users read their own follow edges"
  on public.follows for select
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "users follow on their own behalf" on public.follows;
create policy "users follow on their own behalf"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "users unfollow on their own behalf" on public.follows;
create policy "users unfollow on their own behalf"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

drop policy if exists "admins read every follow edge" on public.follows;
create policy "admins read every follow edge"
  on public.follows for select
  to authenticated
  using (public.is_admin());

-- Totals only: no follower_id, no following_id beyond the subject.
create or replace view public.follow_counts as
select
  p.id as user_id,
  (select count(*)::int from public.follows f where f.following_id = p.id)
    as followers,
  (select count(*)::int from public.follows f where f.follower_id = p.id)
    as following
from public.profiles p;

grant select on public.follow_counts to anon, authenticated;
