-- Holds the onboarding quiz answers (areas, target year, curriculum,
-- priorities, situation) for parents who are still searching for a
-- school — not tied to any specific child/school record yet, so a
-- flexible jsonb blob fits better than a new relational table.
alter table public.profiles
  add column search_preferences jsonb not null default '{}'::jsonb;
