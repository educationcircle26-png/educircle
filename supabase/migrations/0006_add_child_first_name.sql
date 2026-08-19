-- First name only, not full name — matches the earlier decision to
-- minimize personal data collected about children.
alter table public.children
  add column first_name text;
