import { Router, Response } from "express";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../utils/supabase";
import { startIndexing } from "../services/codebase-indexer";
import { askCodebase } from "../services/codebase-query";
import { GithubNotConnectedError } from "../utils/github-client";

export const askRouter = Router();

askRouter.use(requireUser);

askRouter.get("/repos", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { data, error } = await supabaseAdmin
    .from("code_repos")
    .select(
      "id, repo_full_name, repo_url, default_branch, status, file_count, chunk_count, last_indexed_at, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ repos: data ?? [] });
});

askRouter.get("/repos/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("code_repos")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !data) return res.status(404).json({ error: "not found" });
  res.json(data);
});

askRouter.delete("/repos/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("code_repos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

askRouter.post("/index", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { repo_full_name } = req.body as { repo_full_name?: string };
  if (!repo_full_name) {
    return res.status(400).json({ error: "repo_full_name required" });
  }
  try {
    const { repoId } = await startIndexing({ userId, repoFullName: repo_full_name });
    res.status(202).json({ repo_id: repoId, status: "indexing" });
  } catch (err) {
    if (err instanceof GithubNotConnectedError) {
      return res.status(412).json({ error: err.message });
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : "indexing failed to start",
    });
  }
});

askRouter.post("/query", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { repo_id, question } = req.body as {
    repo_id?: string;
    question?: string;
  };
  if (!repo_id || !question) {
    return res.status(400).json({ error: "repo_id and question required" });
  }

  // Confirm the repo belongs to this user and is ready before running RAG.
  const { data: repo, error: repoErr } = await supabaseAdmin
    .from("code_repos")
    .select("id, status")
    .eq("id", repo_id)
    .eq("user_id", userId)
    .single();
  if (repoErr || !repo) {
    return res.status(404).json({ error: "repo not found" });
  }
  if (repo.status !== "ready") {
    return res.status(409).json({
      error: `repo is ${repo.status}; wait for indexing to finish`,
    });
  }

  try {
    const result = await askCodebase({ userId, repoId: repo_id, question });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "query failed",
    });
  }
});
