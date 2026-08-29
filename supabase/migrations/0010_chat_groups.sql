-- Group chat scoped to a school, optionally narrowed to one class.
-- Membership is explicit (a row per parent) rather than derived from
-- children.class_name, so a parent can be in a year-group chat and a
-- class chat without owning a child row per group.

create table public.chat_groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  description text,
  academic_year text,
  class_name text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index chat_groups_school_id_idx on public.chat_groups (school_id);

create table public.chat_group_members (
  group_id uuid not null references public.chat_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  status text not null default 'published'
    check (status in ('published', 'pending_review', 'removed')),
  created_at timestamptz not null default now()
);

create index chat_messages_group_id_created_at_idx
  on public.chat_messages (group_id, created_at);

alter table public.chat_groups enable row level security;
alter table public.chat_group_members enable row level security;
alter table public.chat_messages enable row level security;

-- SECURITY DEFINER so the members policy can check membership without
-- recursing back through chat_group_members' own SELECT policy.
create function public.is_chat_group_member(target_group_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.chat_group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

create function public.chat_group_school(target_group_id uuid)
returns uuid
language sql security definer set search_path = public stable
as $$
  select school_id from public.chat_groups where id = target_group_id;
$$;

-- Groups are discoverable by anyone verified at that school, so a parent
-- can find and join one; the messages inside stay members-only.
create policy "school members see their school's groups"
  on public.chat_groups for select
  to authenticated
  using (public.is_school_member(school_id) or public.is_admin());

create policy "school members create groups for their school"
  on public.chat_groups for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_school_member(school_id));

create policy "group admins and site admins update groups"
  on public.chat_groups for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "members see the roster of groups they are in"
  on public.chat_group_members for select
  to authenticated
  using (public.is_chat_group_member(group_id) or public.is_admin());

create policy "verified parents join groups at their school"
  on public.chat_group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_school_member(public.chat_group_school(group_id))
  );

create policy "members leave groups they are in"
  on public.chat_group_members for delete
  to authenticated
  using (user_id = auth.uid());

create policy "group members read published messages"
  on public.chat_messages for select
  to authenticated
  using (
    public.is_chat_group_member(group_id)
    and (status = 'published' or author_id = auth.uid())
    or public.is_admin()
  );

create policy "group members post messages"
  on public.chat_messages for insert
  to authenticated
  with check (author_id = auth.uid() and public.is_chat_group_member(group_id));

create policy "authors and admins update messages"
  on public.chat_messages for update
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Mirrors posts_with_author so the UI can render a sender name in one query.
create view public.chat_messages_with_author
with (security_invoker = true)
as
select
  m.*,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url
from public.chat_messages m
join public.profiles pr on pr.id = m.author_id;
