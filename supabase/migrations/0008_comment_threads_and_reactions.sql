-- One level of reply nesting on comments, plus upvotes so a "top answer"
-- can be computed from real vote counts (matches the reviewed mockup).

alter table public.comments
  add column parent_comment_id uuid references public.comments(id) on delete cascade;

create index comments_parent_comment_id_idx on public.comments (parent_comment_id);

create table public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reactions enable row level security;

create policy "comment reactions readable by authenticated users"
  on public.comment_reactions for select
  to authenticated
  using (true);

create policy "users manage their own comment reactions"
  on public.comment_reactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
