-- Vector similarity search RPC for codebase Q&A
-- Returns the top-K most similar code chunks for a given query embedding,
-- scoped to one user + one repo (defense in depth alongside RLS).

create or replace function match_code_chunks(
  query_embedding vector(768),
  filter_repo_id uuid,
  filter_user_id uuid,
  match_count int default 8
)
returns table (
  id uuid,
  file_path text,
  language text,
  content text,
  start_line int,
  end_line int,
  similarity float
)
language sql
stable
as $$
  select
    cc.id,
    cc.file_path,
    cc.language,
    cc.content,
    cc.start_line,
    cc.end_line,
    1 - (cc.embedding <=> query_embedding) as similarity
  from code_chunks cc
  where cc.repo_id = filter_repo_id
    and cc.user_id = filter_user_id
  order by cc.embedding <=> query_embedding
  limit match_count;
$$;
