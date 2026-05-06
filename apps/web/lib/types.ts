export type DebriefStatus = "processing" | "completed" | "failed";
export type Priority = "high" | "medium" | "low";
export type RepoStatus = "pending" | "indexing" | "ready" | "failed";
export type MessageRole = "user" | "assistant";

export interface Debrief {
  id: string;
  user_id: string;
  title: string | null;
  raw_transcript: string;
  summary: string | null;
  status: DebriefStatus;
  created_at: string;
}

export interface ActionItem {
  id: string;
  debrief_id: string;
  user_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: Priority;
  due_date: string | null;
  github_issue_url: string | null;
  github_issue_number: number | null;
  created_at: string;
}

export interface CodeRepo {
  id: string;
  user_id: string;
  repo_full_name: string;
  repo_url: string;
  default_branch: string;
  status: RepoStatus;
  file_count: number;
  chunk_count: number;
  last_indexed_at: string | null;
  created_at: string;
}

export interface CodeChunk {
  id: string;
  repo_id: string;
  user_id: string;
  file_path: string;
  language: string | null;
  content: string;
  chunk_index: number;
  start_line: number | null;
  end_line: number | null;
  created_at: string;
}

export interface Citation {
  file_path: string;
  start_line: number;
  end_line: number;
  snippet: string;
}

export interface CodeMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface CodeConversation {
  id: string;
  repo_id: string;
  user_id: string;
  created_at: string;
}

export interface Digest {
  id: string;
  user_id: string;
  content: string;
  raw_activity: unknown;
  digest_date: string;
  created_at: string;
}

export interface GithubConnection {
  id: string;
  user_id: string;
  github_username: string;
  avatar_url: string | null;
  connected_at: string;
}

export interface Changelog {
  id: string;
  user_id: string;
  repo_full_name: string;
  date_from: string | null;
  date_to: string | null;
  engineer_version: string | null;
  pm_version: string | null;
  customer_version: string | null;
  raw_activity: unknown;
  created_at: string;
}
