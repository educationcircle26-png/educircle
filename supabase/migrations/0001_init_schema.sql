-- EduCircle initial schema
-- Roles/verification are scoped per (user, school) via school_memberships,
-- not a single global role on the user — a parent can be verified at one
-- school and just an explorer at another.

create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES (one row per auth.users, auto-created on signup)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  phone text,
  location text,
  avatar_url text,
  bio text,
  occupation text,
  help_areas text[] not null default '{}',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- NOTE: MVP-simple — every field readable by any signed-in parent.
-- Per-field visibility (Everyone/Parents only/My communities/Only me,
-- shown in the profile mockup) is a later feature, not v1.
create policy "profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper functions (security definer so they bypass RLS internally and
-- avoid "infinite recursion" when a policy needs to query the very table
-- it protects, e.g. school_memberships checking school_memberships).
create function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- =========================================================
-- SCHOOLS (directory entries — no login of their own in v1)
-- =========================================================
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  curriculum text[] not null default '{}',
  min_year text,
  max_year text,
  description text,
  logo_url text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;

create policy "schools are publicly readable"
  on public.schools for select
  to anon, authenticated
  using (true);

create policy "admins manage schools"
  on public.schools for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- CHILDREN
-- =========================================================
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  academic_year text,
  class_name text,
  created_at timestamptz not null default now()
);

alter table public.children enable row level security;

create policy "parents manage their own children"
  on public.children for all
  to authenticated
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- =========================================================
-- SCHOOL MEMBERSHIPS (verification + moderator status, per school)
-- =========================================================
create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null default 'verified_parent' check (role in ('verified_parent', 'moderator')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verification_method text check (verification_method in ('invite_code', 'document', 'moderator_review')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);

alter table public.school_memberships enable row level security;

create function public.is_school_member(target_school_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.school_memberships
    where school_id = target_school_id
      and user_id = auth.uid()
      and status = 'approved'
  );
$$;

create function public.is_school_moderator(target_school_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.school_memberships
    where school_id = target_school_id
      and user_id = auth.uid()
      and role = 'moderator'
      and status = 'approved'
  );
$$;

create policy "users see their own memberships, moderators see their school's"
  on public.school_memberships for select
  to authenticated
  using (auth.uid() = user_id or public.is_school_moderator(school_id) or public.is_admin());

create policy "users request their own membership"
  on public.school_memberships for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "moderators and admins review memberships of their school"
  on public.school_memberships for update
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin());

-- =========================================================
-- INVITE CODES (one verification path: existing verified parent invites)
-- =========================================================
create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  code text not null unique,
  max_uses int not null default 1,
  uses_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invite_codes enable row level security;

create policy "school members read invite codes for their school"
  on public.invite_codes for select
  to authenticated
  using (public.is_school_member(school_id));

create policy "school members create invite codes for their school"
  on public.invite_codes for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_school_member(school_id));

-- =========================================================
-- VERIFICATION REQUESTS (invite code / document upload / moderator review)
-- =========================================================
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  method text not null check (method in ('invite_code', 'document', 'moderator_review')),
  document_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.verification_requests enable row level security;

create policy "users manage their own verification requests"
  on public.verification_requests for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "moderators review requests for their school"
  on public.verification_requests for select
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin());

create policy "moderators decide requests for their school"
  on public.verification_requests for update
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin());

-- Private bucket for uploaded verification documents (student ID, fee
-- receipt, etc). Path convention: {school_id}/{user_id}/{filename}.
-- Human moderator review, not OCR — see project notes.
insert into storage.buckets (id, name, public)
values ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

create policy "users upload their own verification documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "owners moderators and admins read verification documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-documents'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.is_school_moderator((storage.foldername(name))[1]::uuid)
      or public.is_admin()
    )
  );

-- =========================================================
-- POSTS (questions, discussions, announcements, resources,
-- marketplace items, polls — one table, `type` + `metadata` jsonb
-- for the fields specific to each type, instead of a table per type)
-- =========================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  -- null school_id = general Parent Network (public); set = school-scoped
  school_id uuid references public.schools(id) on delete cascade,
  type text not null default 'discussion'
    check (type in ('question', 'discussion', 'announcement', 'resource', 'marketplace_item', 'poll')),
  title text,
  body text not null,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'pending_review', 'removed')),
  created_at timestamptz not null default now()
);

create index posts_school_id_idx on public.posts (school_id);
create index posts_author_id_idx on public.posts (author_id);

alter table public.posts enable row level security;

create policy "published posts are readable by school members or everyone if general"
  on public.posts for select
  to authenticated, anon
  using (
    status = 'published'
    and (school_id is null or public.is_school_member(school_id))
  );

create policy "authors manage their own posts"
  on public.posts for all
  to authenticated
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (school_id is null or public.is_school_member(school_id))
  );

create policy "moderators moderate posts in their school"
  on public.posts for update
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin());

-- View that hides the real author when is_anonymous = true, except from
-- the author themself and moderators/admins (who can still see who posted
-- for abuse handling — "anonymous" only hides identity from other parents).
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
join public.profiles pr on pr.id = p.author_id;

-- =========================================================
-- COMMENTS
-- =========================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'pending_review', 'removed')),
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);

alter table public.comments enable row level security;

create policy "comments follow their post's visibility"
  on public.comments for select
  to authenticated, anon
  using (
    status = 'published'
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and p.status = 'published'
        and (p.school_id is null or public.is_school_member(p.school_id))
    )
  );

create policy "authors manage their own comments"
  on public.comments for all
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- =========================================================
-- REACTIONS & SAVED POSTS
-- =========================================================
create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_reactions enable row level security;

create policy "reactions readable by authenticated users"
  on public.post_reactions for select
  to authenticated
  using (true);

create policy "users manage their own reactions"
  on public.post_reactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.saved_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "users manage their own saved posts"
  on public.saved_posts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================
-- REPORTS (community moderation queue)
-- =========================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

alter table public.reports enable row level security;

create policy "users create their own reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "reporters and admins see reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id or public.is_admin());

create policy "admins resolve reports"
  on public.reports for update
  to authenticated
  using (public.is_admin());

-- =========================================================
-- EVENTS (shared school calendar)
-- =========================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events readable by school members"
  on public.events for select
  to authenticated
  using (public.is_school_member(school_id));

create policy "moderators manage events"
  on public.events for all
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin())
  with check (public.is_school_moderator(school_id) or public.is_admin());
