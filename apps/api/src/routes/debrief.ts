import { Router, Response } from "express";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../utils/supabase";
import { processDebrief } from "../services/debrief";

export const debriefRouter = Router();

debriefRouter.use(requireUser);

debriefRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { data, error } = await supabaseAdmin
    .from("debriefs")
    .select("id, title, summary, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const ids = (data ?? []).map((d) => d.id);
  let counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: items } = await supabaseAdmin
      .from("action_items")
      .select("debrief_id")
      .in("debrief_id", ids);
    counts = (items ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.debrief_id] = (acc[row.debrief_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  res.json({
    debriefs: (data ?? []).map((d) => ({ ...d, action_item_count: counts[d.id] ?? 0 })),
  });
});

debriefRouter.get("/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const { data: debrief, error: dErr } = await supabaseAdmin
    .from("debriefs")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (dErr || !debrief) return res.status(404).json({ error: "not found" });

  const { data: actionItems, error: aErr } = await supabaseAdmin
    .from("action_items")
    .select("*")
    .eq("debrief_id", id)
    .eq("user_id", userId)
    .order("created_at");
  if (aErr) return res.status(500).json({ error: aErr.message });

  res.json({ debrief, action_items: actionItems ?? [] });
});

debriefRouter.patch("/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { title } = req.body as { title?: string | null };

  const trimmed = typeof title === "string" ? title.trim() : null;
  if (trimmed !== null && trimmed.length > 200) {
    return res.status(400).json({ error: "title must be 200 characters or fewer" });
  }

  const { data, error } = await supabaseAdmin
    .from("debriefs")
    .update({ title: trimmed && trimmed.length > 0 ? trimmed : null })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title")
    .single();
  if (error || !data) return res.status(404).json({ error: "not found" });
  res.json(data);
});

debriefRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("debriefs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error || !data) return res.status(404).json({ error: "not found" });
  res.json({ deleted: true });
});

debriefRouter.delete(
  "/action-items/:itemId",
  async (req: AuthedRequest, res: Response) => {
    const userId = req.userId!;
    const { itemId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("action_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId)
      .select("id, debrief_id")
      .single();
    if (error || !data) return res.status(404).json({ error: "not found" });
    res.json({ deleted: true, debrief_id: data.debrief_id });
  }
);

debriefRouter.post("/process", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { transcript, title } = req.body as { transcript?: string; title?: string };
  if (!transcript || transcript.trim().length < 50) {
    return res.status(400).json({
      error: "transcript must be at least 50 characters",
    });
  }

  try {
    const { debriefId } = await processDebrief({
      userId,
      title: title?.trim() || null,
      transcript,
    });
    res.json({ debrief_id: debriefId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "processing failed";
    res.status(500).json({ error: message });
  }
});
