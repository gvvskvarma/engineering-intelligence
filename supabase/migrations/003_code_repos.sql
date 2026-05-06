-- Codebase Q&A tables
create table code_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  repo_full_name text not null,
  repo_url text not null,
  default_branch text default 'main',
  status text default 'pending',
  file_count integer default 0,
  chunk_count integer default 0,
  last_indexed_at timestamptz,
  created_at timestamptz default now()
);

create table code_chunks (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references code_repos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  file_path text not null,
  language text,
  content text not null,
  chunk_index integer not null,
  start_line integer,
  end_line integer,
  embedding vector(768),
  created_at timestamptz default now()
);

create index on code_chunks using hnsw (embedding vector_cosine_ops);

create table code_conversations (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references code_repos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table code_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references code_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  citations jsonb,
  created_at timestamptz default now()
);

alter table code_repos enable row level security;
alter table code_chunks enable row level security;
alter table code_conversations enable row level security;
alter table code_messages enable row level security;

create policy "users own repos" on code_repos for all using (auth.uid() = user_id);
create policy "users own chunks" on code_chunks for all using (auth.uid() = user_id);
create policy "users own conversations" on code_conversations for all using (auth.uid() = user_id);
create policy "users own messages" on code_messages for all using (
  auth.uid() = (select user_id from code_conversations where id = conversation_id)
);
