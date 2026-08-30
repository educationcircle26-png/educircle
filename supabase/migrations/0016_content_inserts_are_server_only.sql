-- Moderation was advisory, not enforced. checkContent() runs in a server
-- action, but that action holds the *user's own* session — so Postgres cannot
-- tell it apart from the same user calling PostgREST by hand and declaring
-- status = 'published'. Anyone willing to skip the website could post
-- unmoderated content.
--
-- Migration 0014's trigger stopped held and removed content being restored,
-- which was the worse half. This closes the other half: end-user sessions
-- lose INSERT on the content tables entirely, and creation moves behind
-- src/lib/publish.ts, which writes with the service-role key after running
-- the moderation check.
--
-- The authorization RLS used to do for these inserts now lives in that
-- module, since the service role ignores policies: it verifies the author,
-- approved school membership, chat group membership, and that a reply hangs
-- off a comment on the post it claims.

-- "authors manage their own posts" was FOR ALL, which included INSERT.
-- Split it so authors keep read/edit/delete on their own rows and lose only
-- the ability to create.
drop policy if exists "authors manage their own posts" on public.posts;

create policy "authors read their own posts"
  on public.posts for select
  to authenticated
  using (auth.uid() = author_id);

create policy "authors edit their own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (school_id is null or public.is_school_member(school_id))
  );

create policy "authors delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

drop policy if exists "authors manage their own comments" on public.comments;

create policy "authors read their own comments"
  on public.comments for select
  to authenticated
  using (auth.uid() = author_id);

create policy "authors edit their own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "authors delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- Chat messages: same split.
drop policy if exists "group members post messages" on public.chat_messages;

drop policy if exists "authors delete their own messages" on public.chat_messages;
create policy "authors delete their own messages"
  on public.chat_messages for delete
  to authenticated
  using (auth.uid() = author_id);

-- Belt and braces: even if a future policy grants INSERT by accident, the
-- table-level privilege is gone, so only the service role can write.
revoke insert on public.posts from authenticated, anon;
revoke insert on public.comments from authenticated, anon;
revoke insert on public.chat_messages from authenticated, anon;
