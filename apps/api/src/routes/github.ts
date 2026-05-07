import { Router, Response } from "express";
import { requireUser, type AuthedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../utils/supabase";
import { octokitForUser, GithubNotConnectedError } from "../utils/github-client";

export const githubRouter = Router();

githubRouter.use(requireUser);

githubRouter.get("/repos", async (req: AuthedRequest, res: Response) => {
  try {
    const octokit = await octokitForUser(req.userId!);
    const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
      per_page: 100,
      sort: "pushed",
      affiliation: "owner,collaborator,organization_member",
    });
    res.json({
      repos: repos.map((r) => ({
        full_name: r.full_name,
        name: r.name,
        private: r.private,
        owner: r.owner.login,
        default_branch: r.default_branch,
        pushed_at: r.pushed_at,
      })),
    });
  } catch (err) {
    if (err instanceof GithubNotConnectedError) {
      return res.status(412).json({ error: err.message });
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : "failed to list repos",
    });
  }
});

githubRouter.post("/create-issue", async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { action_item_id, repo_full_name } = req.body as {
    action_item_id?: string;
    repo_full_name?: string;
  };
  if (!action_item_id || !repo_full_name) {
    return res
      .status(400)
      .json({ error: "action_item_id and repo_full_name are required" });
  }

  const { data: actionItem, error: aErr } = await supabaseAdmin
    .from("action_items")
    .select("*")
    .eq("id", action_item_id)
    .eq("user_id", userId)
    .single();
  if (aErr || !actionItem) {
    return res.status(404).json({ error: "action item not found" });
  }
  if (actionItem.github_issue_url) {
    return res.json({
      issue_url: actionItem.github_issue_url,
      issue_number: actionItem.github_issue_number,
      already_existed: true,
    });
  }

  const [owner, repo] = repo_full_name.split("/");
  if (!owner || !repo) {
    return res.status(400).json({ error: "repo_full_name must be 'owner/repo'" });
  }

  const bodyParts: string[] = [];
  if (actionItem.description) bodyParts.push(actionItem.description);
  if (actionItem.assignee) bodyParts.push(`**Assignee mentioned in meeting:** ${actionItem.assignee}`);
  if (actionItem.due_date) bodyParts.push(`**Due:** ${actionItem.due_date}`);
  bodyParts.push("---", "_Generated from a meeting debrief._");

  try {
    const octokit = await octokitForUser(userId);
    const { data: issue } = await octokit.issues.create({
      owner,
      repo,
      title: actionItem.title,
      body: bodyParts.join("\n\n"),
      labels: ["meeting-action-item", `priority/${actionItem.priority}`],
    });

    await supabaseAdmin
      .from("action_items")
      .update({
        github_issue_url: issue.html_url,
        github_issue_number: issue.number,
      })
      .eq("id", action_item_id);

    res.json({ issue_url: issue.html_url, issue_number: issue.number });
  } catch (err) {
    if (err instanceof GithubNotConnectedError) {
      return res.status(412).json({ error: err.message });
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : "failed to create issue",
    });
  }
});
