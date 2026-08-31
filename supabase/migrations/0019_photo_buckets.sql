-- Two buckets, deliberately not the same kind.
--
--   avatars      PUBLIC. A parent's own display picture sits beside their
--                display name wherever they post, and display_name is
--                already public via public_profiles, so the picture is too.
--
--   child-photos PRIVATE. A child's photo is shown only to their own parent
--                on their own profile. The children table is parent-only for
--                the same reason, and a photo is more identifying than a
--                first name — it must never be fetchable by URL alone.
--
-- Both are keyed by the owner's uid as the first path segment, which is what
-- the policies below match on: avatars/{uid}/file, child-photos/{uid}/file.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('child-photos', 'child-photos', false)
on conflict (id) do update set public = false;

-- ---------------------------------------------------------------- avatars

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users replace their own avatar" on storage.objects;
create policy "users replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete their own avatar" on storage.objects;
create policy "users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------- child photos

drop policy if exists "parents read their own child photos" on storage.objects;
create policy "parents read their own child photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'child-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "parents upload their own child photos" on storage.objects;
create policy "parents upload their own child photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "parents replace their own child photos" on storage.objects;
create policy "parents replace their own child photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "parents delete their own child photos" on storage.objects;
create policy "parents delete their own child photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The storage path, not a URL: private objects are served through a signed
-- link generated per request, and a stored URL would expire.
alter table public.children
  add column if not exists photo_path text;
