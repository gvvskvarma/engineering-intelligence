import type { Octokit } from "@octokit/rest";
import { supabaseAdmin } from "../utils/supabase";
import { octokitForUser } from "../utils/github-client";
import {
  chunkFile,
  shouldIndexFile,
  type CodeChunk,
} from "../utils/code-chunker";
import { generateEmbedding } from "./gemini";

// Free-tier guardrails: keep individual repos within bounds so we don't burn
// the daily Gemini quota and so progress is visible to the user in reasonable time.
const MAX_FILES = 500;
const EMBED_CONCURRENCY = 4;
const INSERT_BATCH = 50;

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

  // Verify access + fetch default branch.
  const repoInfo = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoInfo.data.default_branch;
  const repoUrl = repoInfo.data.html_url;

  // Upsert the code_repos row with status indexing.
  const { data: existing } = await supabaseAdmin
    .from("code_repos")
    .select("id")
    .eq("user_id", userId)
    .eq("repo_full_name", repoFullName)
    .maybeSingle();

  let repoId: string;
  if (existing) {
    repoId = existing.id;
    // Wipe any prior chunks so a re-index doesn't double-up.
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

  // Run the rest async — return the id immediately so the caller can poll.
  void runIndex({ userId, repoId, owner, repo, octokit, defaultBranch }).catch(
    async (err) => {
      console.error(`[indexer] ${repoFullName} failed:`, err);
      await supabaseAdmin
        .from("code_repos")
        .update({ status: "failed" })
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

  const truncated = tree.data.truncated;
  const slice = blobs.slice(0, MAX_FILES);

  const allChunks: CodeChunk[] = [];
  let processedFiles = 0;

  for (const entry of slice) {
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
      const chunks = chunkFile({ filePath: entry.path!, content });
      allChunks.push(...chunks);
      processedFiles++;
    } catch (err) {
      console.warn(`[indexer] skipping ${entry.path}:`, err);
    }
  }

  // Embed in parallel-batched chunks to stay under Gemini RPM but still finish quickly.
  const embedded: Array<CodeChunk & { embedding: number[] }> = [];
  for (let i = 0; i < allChunks.length; i += EMBED_CONCURRENCY) {
    const batch = allChunks.slice(i, i + EMBED_CONCURRENCY);
    const embeddings = await Promise.all(
      batch.map((c) => embedWithRetry(c.content))
    );
    batch.forEach((chunk, idx) =>
      embedded.push({ ...chunk, embedding: embeddings[idx] })
    );
  }

  // Bulk-insert in modest batches so a single huge insert doesn't time out.
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
      file_count: processedFiles,
      chunk_count: embedded.length,
      last_indexed_at: new Date().toISOString(),
    })
    .eq("id", repoId);

  if (truncated) {
    console.warn(
      `[indexer] tree truncated for ${owner}/${repo}; only first ${slice.length} files indexed`
    );
  }
}

async function embedWithRetry(text: string, attempts = 3): Promise<number[]> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await generateEmbedding(text);
    } catch (err) {
      lastErr = err;
      // Exponential backoff for 429 / transient errors.
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw lastErr ?? new Error("embedding failed after retries");
}
