import { Router, Response } from "express";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../utils/supabase";
import { generateChangelog } from "../services/changelog";
import { GithubNotConnectedError } from "../utils/github-client";

export const changelogRouter = Router();

changelogRouter.use(requireUser);

changelogRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { data, error } = await supabaseAdmin
    .from("changelogs")
    .select("id, repo_full_name, date_from, date_to, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ changelogs: data ?? [] });
});

changelogRouter.get("/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("changelogs")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !data) return res.status(404).json({ error: "not found" });
  res.json(data);
});

changelogRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("changelogs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

changelogRouter.post("/generate", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { repo_full_name, date_from, date_to } = req.body as {
    repo_full_name?: string;
    date_from?: string;
    date_to?: string;
  };
  if (!repo_full_name || !date_from || !date_to) {
    return res.status(400).json({
      error: "repo_full_name, date_from, date_to are required",
    });
  }
  try {
    const result = await generateChangelog({
      userId,
      repoFullName: repo_full_name,
      dateFrom: date_from,
      dateTo: date_to,
    });
    res.json({
      id: result.id,
      pr_count: result.prCount,
      ...result.versions,
    });
  } catch (err) {
    if (err instanceof GithubNotConnectedError) {
      return res.status(412).json({ error: err.message });
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : "changelog failed",
    });
  }
});
