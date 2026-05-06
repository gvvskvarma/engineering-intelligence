-- Changelog
create table changelogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  repo_full_name text not null,
  date_from date,
  date_to date,
  engineer_version text,
  pm_version text,
  customer_version text,
  raw_activity jsonb,
  created_at timestamptz default now()
);

alter table changelogs enable row level security;
create policy "users own changelogs" on changelogs for all using (auth.uid() = user_id);
