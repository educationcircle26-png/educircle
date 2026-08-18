-- The original insert policy let a user set ANY role/status on their own
-- membership row (status = 'pending' was only ever the *default*, not
-- enforced) — meaning a client could insert itself as an approved
-- moderator directly. Tighten it: self-inserts must always be a pending
-- verified_parent request. Instant approval (a valid invite code) and
-- the very-first-moderator bootstrap for a school are handled by
-- join_school(), a trusted security-definer function, instead.
drop policy "users request their own membership" on public.school_memberships;

create policy "users request their own pending membership"
  on public.school_memberships for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and role = 'verified_parent'
  );

create function public.join_school(target_school_id uuid, invite_code_input text default null)
returns public.school_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.school_memberships;
  invite public.invite_codes;
  has_moderator boolean;
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

  select exists (
    select 1 from public.school_memberships
    where school_id = target_school_id and role = 'moderator' and status = 'approved'
  ) into has_moderator;

  insert into public.school_memberships (user_id, school_id, role, status, verification_method, verified_at)
  values (
    auth.uid(),
    target_school_id,
    case when has_moderator then 'verified_parent' else 'moderator' end,
    case when has_moderator then 'pending' else 'approved' end,
    'moderator_review',
    case when has_moderator then null else now() end
  )
  on conflict (user_id, school_id) do update
    set verification_method = 'moderator_review'
  returning * into result;

  return result;
end;
$$;

revoke all on function public.join_school(uuid, text) from public;
grant execute on function public.join_school(uuid, text) to authenticated;
