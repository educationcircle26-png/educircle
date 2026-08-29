-- ============================================================
--  EduCircle — migrations 0008 to 0011, combined.
--
--  Paste this whole file into Supabase > SQL Editor and Run.
--  Safe to run more than once: every statement checks first, so
--  re-running it will not error or duplicate anything.
-- ============================================================


-- ============================================================
--  0008 — threaded replies + helpful votes on answers
-- ============================================================

alter table public.comments
  add column if not exists parent_comment_id uuid
  references public.comments(id) on delete cascade;

create index if not exists comments_parent_comment_id_idx
  on public.comments (parent_comment_id);

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reactions enable row level security;

drop policy if exists "comment reactions readable by authenticated users"
  on public.comment_reactions;
create policy "comment reactions readable by authenticated users"
  on public.comment_reactions for select
  to authenticated
  using (true);

drop policy if exists "users manage their own comment reactions"
  on public.comment_reactions;
create policy "users manage their own comment reactions"
  on public.comment_reactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
--  0009 — poll voting
-- ============================================================

create table if not exists public.poll_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_index int not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.poll_votes enable row level security;

drop policy if exists "poll votes readable by everyone" on public.poll_votes;
create policy "poll votes readable by everyone"
  on public.poll_votes for select
  to anon, authenticated
  using (true);

drop policy if exists "users manage their own poll vote" on public.poll_votes;
create policy "users manage their own poll vote"
  on public.poll_votes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
--  0010 — school group chat
-- ============================================================

create table if not exists public.chat_groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  description text,
  academic_year text,
  class_name text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists chat_groups_school_id_idx
  on public.chat_groups (school_id);

create table if not exists public.chat_group_members (
  group_id uuid not null references public.chat_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  status text not null default 'published'
    check (status in ('published', 'pending_review', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_group_id_created_at_idx
  on public.chat_messages (group_id, created_at);

alter table public.chat_groups enable row level security;
alter table public.chat_group_members enable row level security;
alter table public.chat_messages enable row level security;

-- SECURITY DEFINER so the members policy can check membership without
-- recursing back through chat_group_members' own SELECT policy.
create or replace function public.is_chat_group_member(target_group_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.chat_group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.chat_group_school(target_group_id uuid)
returns uuid
language sql security definer set search_path = public stable
as $$
  select school_id from public.chat_groups where id = target_group_id;
$$;

-- Groups are discoverable by anyone verified at that school, so a parent
-- can find and join one; the messages inside stay members-only.
drop policy if exists "school members see their school's groups"
  on public.chat_groups;
create policy "school members see their school's groups"
  on public.chat_groups for select
  to authenticated
  using (public.is_school_member(school_id) or public.is_admin());

drop policy if exists "school members create groups for their school"
  on public.chat_groups;
create policy "school members create groups for their school"
  on public.chat_groups for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_school_member(school_id));

drop policy if exists "group admins and site admins update groups"
  on public.chat_groups;
create policy "group admins and site admins update groups"
  on public.chat_groups for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

drop policy if exists "members see the roster of groups they are in"
  on public.chat_group_members;
create policy "members see the roster of groups they are in"
  on public.chat_group_members for select
  to authenticated
  using (public.is_chat_group_member(group_id) or public.is_admin());

drop policy if exists "verified parents join groups at their school"
  on public.chat_group_members;
create policy "verified parents join groups at their school"
  on public.chat_group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_school_member(public.chat_group_school(group_id))
  );

drop policy if exists "members leave groups they are in"
  on public.chat_group_members;
create policy "members leave groups they are in"
  on public.chat_group_members for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "group members read published messages"
  on public.chat_messages;
create policy "group members read published messages"
  on public.chat_messages for select
  to authenticated
  using (
    public.is_chat_group_member(group_id)
    and (status = 'published' or author_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "group members post messages" on public.chat_messages;
create policy "group members post messages"
  on public.chat_messages for insert
  to authenticated
  with check (author_id = auth.uid() and public.is_chat_group_member(group_id));

drop policy if exists "authors and admins update messages"
  on public.chat_messages;
create policy "authors and admins update messages"
  on public.chat_messages for update
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Mirrors posts_with_author so the UI can render a sender name in one query.
create or replace view public.chat_messages_with_author
with (security_invoker = true)
as
select
  m.*,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url
from public.chat_messages m
join public.profiles pr on pr.id = m.author_id;


-- ============================================================
--  0011 — admin access to held content
-- ============================================================

drop policy if exists "admins read all posts" on public.posts;
create policy "admins read all posts"
  on public.posts for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read all comments" on public.comments;
create policy "admins read all comments"
  on public.comments for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins moderate any post" on public.posts;
create policy "admins moderate any post"
  on public.posts for update
  to authenticated
  using (public.is_admin());

drop policy if exists "admins moderate any comment" on public.comments;
create policy "admins moderate any comment"
  on public.comments for update
  to authenticated
  using (public.is_admin());
