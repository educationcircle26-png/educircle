-- Votes for posts.type = 'poll'. Options themselves live in
-- posts.metadata->'options' (a jsonb array of strings) — no separate
-- options table needed since they're fixed at creation time.

create table public.poll_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_index int not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.poll_votes enable row level security;

create policy "poll votes readable by everyone"
  on public.poll_votes for select
  to anon, authenticated
  using (true);

create policy "users manage their own poll vote"
  on public.poll_votes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
