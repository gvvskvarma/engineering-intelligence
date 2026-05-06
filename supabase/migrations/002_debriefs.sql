-- Meeting Debrief tables
create table debriefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  raw_transcript text not null,
  summary text,
  status text default 'processing',
  created_at timestamptz default now()
);

create table action_items (
  id uuid primary key default gen_random_uuid(),
  debrief_id uuid references debriefs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  assignee text,
  priority text default 'medium',
  due_date text,
  github_issue_url text,
  github_issue_number integer,
  created_at timestamptz default now()
);

alter table debriefs enable row level security;
alter table action_items enable row level security;

create policy "users own debriefs" on debriefs for all using (auth.uid() = user_id);
create policy "users own action items" on action_items for all using (auth.uid() = user_id);
