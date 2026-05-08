import { Router, Response } from "express";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../utils/supabase";
import { generateDigest } from "../services/digest";
import { GithubNotConnectedError } from "../utils/github-client";

export const digestRouter = Router();

digestRouter.use(requireUser);

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

digestRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { data, error } = await supabaseAdmin
    .from("digests")
    .select("id, content, digest_date, created_at")
    .eq("user_id", userId)
    .order("digest_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ digests: data ?? [] });
});

digestRouter.get("/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("digests")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error || !data) return res.status(404).json({ error: "not found" });
  res.json(data);
});

digestRouter.post("/generate", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { date } = (req.body ?? {}) as { date?: string };
  const digestDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayUtcDate();

  try {
    const result = await generateDigest({ userId, digestDate });
    res.json({
      id: result.id,
      content: result.content,
      digest_date: digestDate,
      raw_activity: result.rawActivity,
    });
  } catch (err) {
    if (err instanceof GithubNotConnectedError) {
      return res.status(412).json({ error: err.message });
    }
    const message = err instanceof Error ? err.message : "digest failed";
    if (message.includes("isn't connected")) {
      return res.status(412).json({ error: message });
    }
    res.status(500).json({ error: message });
  }
});
