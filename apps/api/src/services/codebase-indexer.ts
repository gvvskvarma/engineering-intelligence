import type { Octokit } from "@octokit/rest";
import { supabaseAdmin } from "../utils/supabase";
import { octokitForUser } from "../utils/github-client";
import {
  chunkFile,
  shouldIndexFile,
  type CodeChunk,
} from "../utils/code-chunker";
import { generateEmbeddingsBatch } from "./gemini";

// Free-tier guardrails. The Gemini free tier on gemini-embedding-001 caps at
// ~1000 requests/day shared across the whole project, so we batch aggressively.
const MAX_FILES = 500;
const FILE_FETCH_CONCURRENCY = 5;
const EMBED_BATCH_SIZE = 100;
const INSERT_BATCH = 50;
const RATE_LIMIT_BACKOFF_MS = 30_000;

interface IndexInput {
  userId: string;
  repoFullName: string;
}

interface RepoTreeEntry {
  path?: string;
  type?: string;
  size?: number;
  sha?: string;
}

export async function startIndexing({
  userId,
  repoFullName,
}: IndexInput): Promise<{ repoId: string }> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error("repo_full_name must be 'owner/repo'");

  const octokit = await octokitForUser(userId);

  const repoInfo = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoInfo.data.default_branch;
  const repoUrl = repoInfo.data.html_url;

  const { data: existing } = await supabaseAdmin
    .from("code_repos")
    .select("id")
    .eq("user_id", userId)
    .eq("repo_full_name", repoFullName)
    .maybeSingle();

  let repoId: string;
  if (existing) {
    repoId = existing.id;
    await supabaseAdmin.from("code_chunks").delete().eq("repo_id", repoId);
    await supabaseAdmin
      .from("code_repos")
      .update({
        status: "indexing",
        default_branch: defaultBranch,
        repo_url: repoUrl,
        file_count: 0,
        chunk_count: 0,
        last_indexed_at: null,
        failure_reason: null,
      })
      .eq("id", repoId);
  } else {
    const { data: created, error } = await supabaseAdmin
      .from("code_repos")
      .insert({
        user_id: userId,
        repo_full_name: repoFullName,
        repo_url: repoUrl,
        default_branch: defaultBranch,
        status: "indexing",
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "create repo failed");
    repoId = created.id;
  }

  void runIndex({ userId, repoId, owner, repo, octokit, defaultBranch }).catch(
    async (err) => {
      const message = humanReason(err);
      console.error(`[indexer] ${repoFullName} failed:`, err);
      await supabaseAdmin
        .from("code_repos")
        .update({ status: "failed", failure_reason: message })
        .eq("id", repoId);
    }
  );

  return { repoId };
}

interface RunInput {
  userId: string;
  repoId: string;
  owner: string;
  repo: string;
  octokit: Octokit;
  defaultBranch: string;
}

async function runIndex({
  userId,
  repoId,
  owner,
  repo,
  octokit,
  defaultBranch,
}: RunInput) {
  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: "1",
  });

  const blobs = (tree.data.tree as RepoTreeEntry[]).filter(
    (entry) =>
      entry.type === "blob" &&
      typeof entry.path === "string" &&
      typeof entry.sha === "string" &&
      shouldIndexFile(entry.path, entry.size)
  );

  if (blobs.length === 0) {
    await supabaseAdmin
      .from("code_repos")
      .update({
        status: "ready",
        file_count: 0,
        chunk_count: 0,
        last_indexed_at: new Date().toISOString(),
      })
      .eq("id", repoId);
    return;
  }

  const slice = blobs.slice(0, MAX_FILES);

  // Fetch blobs with bounded concurrency.
  const fileContents: { path: string; content: string }[] = [];
  for (let i = 0; i < slice.length; i += FILE_FETCH_CONCURRENCY) {
    const batch = slice.slice(i, i + FILE_FETCH_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (entry) => {
        try {
          const blob = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: entry.sha!,
          });
          const content =
            blob.data.encoding === "base64"
              ? Buffer.from(blob.data.content, "base64").toString("utf-8")
              : blob.data.content;
          return { path: entry.path!, content };
        } catch (err) {
          console.warn(`[indexer] skipping ${entry.path}:`, err);
          return null;
        }
      })
    );
    for (const r of results) if (r) fileContents.push(r);
  }

  // Chunk all files.
  const allChunks: CodeChunk[] = [];
  for (const { path, content } of fileContents) {
    const chunks = chunkFile({ filePath: path, content });
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    await supabaseAdmin
      .from("code_repos")
      .update({
        status: "ready",
        file_count: fileContents.length,
        chunk_count: 0,
        last_indexed_at: new Date().toISOString(),
      })
      .eq("id", repoId);
    return;
  }

  // Embed in batches of 100 with retry-on-429.
  const embeddings: number[][] = [];
  for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map((c) => c.content);
    const batchEmbeddings = await embedBatchWithRetry(texts);
    embeddings.push(...batchEmbeddings);
  }

  // Bulk-insert.
  const embedded = allChunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
  for (let i = 0; i < embedded.length; i += INSERT_BATCH) {
    const slice = embedded.slice(i, i + INSERT_BATCH);
    const rows = slice.map((c) => ({
      repo_id: repoId,
      user_id: userId,
      file_path: c.filePath,
      language: c.language,
      content: c.content,
      chunk_index: c.chunkIndex,
      start_line: c.startLine,
      end_line: c.endLine,
      embedding: c.embedding as unknown as string,
    }));
    const { error } = await supabaseAdmin.from("code_chunks").insert(rows);
    if (error) throw error;
  }

  await supabaseAdmin
    .from("code_repos")
    .update({
      status: "ready",
      file_count: fileContents.length,
      chunk_count: embedded.length,
      last_indexed_at: new Date().toISOString(),
    })
    .eq("id", repoId);
}

async function embedBatchWithRetry(texts: string[]): Promise<number[][]> {
  const attempts = 4;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await generateEmbeddingsBatch(texts);
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      const is429 = message.includes("429");
      const wait = is429
        ? RATE_LIMIT_BACKOFF_MS * (i + 1)
        : 1_000 * Math.pow(2, i);
      console.warn(
        `[indexer] embed batch retry ${i + 1}/${attempts} after ${wait}ms:`,
        message.slice(0, 200)
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr ?? new Error("embedding failed after retries");
}

function humanReason(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown failure.";
  const msg = err.message;
  if (msg.includes("429")) {
    return "Hit Gemini's free-tier rate limit. Wait a minute (or until tomorrow if you've used the daily quota) and try again.";
  }
  if (msg.includes("404")) {
    return "Couldn't access the repo. It may be private without the right scope, archived, or empty.";
  }
  if (msg.includes("403")) {
    return "GitHub denied access to that repo. Reconnect GitHub with full repo scope.";
  }
  return msg.length > 300 ? `${msg.slice(0, 300)}…` : msg;
}
