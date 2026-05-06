-- Daily Digest + shared GitHub connection
create table digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  raw_activity jsonb,
  digest_date date not null,
  created_at timestamptz default now()
);

create table github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  github_username text not null,
  access_token text not null,
  avatar_url text,
  connected_at timestamptz default now()
);

alter table digests enable row level security;
alter table github_connections enable row level security;

create policy "users own digests" on digests for all using (auth.uid() = user_id);
create policy "users own github" on github_connections for all using (auth.uid() = user_id);
