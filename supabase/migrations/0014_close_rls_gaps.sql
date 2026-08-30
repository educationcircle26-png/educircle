-- Findings from a full pass over every policy, each reproduced against the
-- live database from an ordinary parent's session before being fixed here.
--
--  1. Authors could rewrite status on their own posts and comments, so a
--     held post could be self-published and a removed one restored.
--  2. join_school() handed instant approved-moderator to the first person to
--     join any school that had no moderator yet — and a school moderator can
--     read that school's uploaded verification documents.
--  3. Users could approve their own verification requests.
--  4. Every moderator UPDATE policy had USING with no WITH CHECK, so a
--     moderator could move a row to a school they have no authority over.
--  5. poll_votes exposed user_id to everyone, tying each voter to their vote.


-- =========================================================
-- 1. Status is a moderator's field, not the author's
-- =========================================================

create or replace function public.can_moderate(target_school_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select public.is_admin()
      or (target_school_id is not null
          and public.is_school_moderator(target_school_id));
$$;

create or replace function public.protect_post_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and not public.can_moderate(old.school_id) then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_protect_status on public.posts;
create trigger posts_protect_status
  before update on public.posts
  for each row execute function public.protect_post_status();

create or replace function public.protect_comment_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  parent_school uuid;
begin
  if new.status is distinct from old.status and auth.uid() is not null then
    select school_id into parent_school from public.posts where id = old.post_id;
    if not public.can_moderate(parent_school) then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_protect_status on public.comments;
create trigger comments_protect_status
  before update on public.comments
  for each row execute function public.protect_comment_status();


-- =========================================================
-- 2. No more self-appointed moderators
-- =========================================================
-- Joining without an invite code now always lands in the review queue. The
-- first moderator for a school is appointed by a site admin instead; letting
-- whoever arrived first take the role also handed them read access to that
-- school's verification documents.

create or replace function public.join_school(target_school_id uuid, invite_code_input text default null)
returns public.school_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.school_memberships;
  invite public.invite_codes;
begin
  if invite_code_input is not null then
    select * into invite from public.invite_codes
      where school_id = target_school_id
        and code = invite_code_input
        and uses_count < max_uses
        and (expires_at is null or expires_at > now());

    if invite is null then
      raise exception 'Invalid or expired invite code';
    end if;

    update public.invite_codes set uses_count = uses_count + 1 where id = invite.id;

    insert into public.school_memberships (user_id, school_id, role, status, verification_method, verified_at)
    values (auth.uid(), target_school_id, 'verified_parent', 'approved', 'invite_code', now())
    on conflict (user_id, school_id) do update
      set role = 'verified_parent', status = 'approved', verification_method = 'invite_code', verified_at = now()
    returning * into result;

    return result;
  end if;

  insert into public.school_memberships (user_id, school_id, role, status, verification_method, verified_at)
  values (auth.uid(), target_school_id, 'verified_parent', 'pending', 'moderator_review', null)
  on conflict (user_id, school_id) do update
    set verification_method = 'moderator_review'
  returning * into result;

  return result;
end;
$$;


-- =========================================================
-- 3. Users no longer rule on their own verification
-- =========================================================
-- The old policy was FOR ALL on your own row, which covered UPDATE and so let
-- an applicant set status = 'approved' and forge reviewed_by.

drop policy if exists "users manage their own verification requests"
  on public.verification_requests;

create policy "users read their own verification requests"
  on public.verification_requests for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users file their own pending verification request"
  on public.verification_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );


-- =========================================================
-- 4. Moderator UPDATE policies get a WITH CHECK
-- =========================================================
-- Without one, the row only has to satisfy USING *before* the update, so a
-- moderator could rewrite school_id and push the row outside their remit.

drop policy if exists "moderators and admins review memberships of their school"
  on public.school_memberships;
create policy "moderators and admins review memberships of their school"
  on public.school_memberships for update
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin())
  with check (public.is_school_moderator(school_id) or public.is_admin());

drop policy if exists "moderators decide requests for their school"
  on public.verification_requests;
create policy "moderators decide requests for their school"
  on public.verification_requests for update
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin())
  with check (public.is_school_moderator(school_id) or public.is_admin());

drop policy if exists "moderators moderate posts in their school" on public.posts;
create policy "moderators moderate posts in their school"
  on public.posts for update
  to authenticated
  using (public.is_school_moderator(school_id) or public.is_admin())
  with check (public.is_school_moderator(school_id) or public.is_admin());

drop policy if exists "admins moderate any post" on public.posts;
create policy "admins moderate any post"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins moderate any comment" on public.comments;
create policy "admins moderate any comment"
  on public.comments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =========================================================
-- 5. Poll votes stop being attributable
-- =========================================================
-- A vote on "which school are you leaning towards" should not be readable
-- back as "this parent chose that one". Counts stay public; who cast them
-- does not.

drop policy if exists "poll votes readable by everyone" on public.poll_votes;

create policy "users read their own poll vote"
  on public.poll_votes for select
  to authenticated
  using (auth.uid() = user_id);

create or replace view public.poll_results as
select post_id, option_index, count(*)::int as votes
from public.poll_votes
group by post_id, option_index;

grant select on public.poll_results to anon, authenticated;
