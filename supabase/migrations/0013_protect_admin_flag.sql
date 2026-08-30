-- The self-update policy on profiles is `using (auth.uid() = id)` with no
-- WITH CHECK and no column list, so it permits a row's owner to write ANY
-- column on it — is_admin included. Our own updateProfile action only sends
-- safe fields, but nothing stops a signed-in parent from calling PostgREST
-- directly and granting themselves site admin.
--
-- Column privileges can't express "not this one column, for your own row
-- only", so a trigger holds the line instead: any attempt to move is_admin
-- silently keeps the old value unless an existing admin is making the change.
--
-- auth.uid() is null for the service_role key and for the SQL editor, which is
-- how the first admin gets promoted — the guard is only for end-user sessions.

create or replace function public.protect_admin_flag()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin_flag on public.profiles;
create trigger profiles_protect_admin_flag
  before update on public.profiles
  for each row execute function public.protect_admin_flag();
