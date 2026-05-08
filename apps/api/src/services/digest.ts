import type { Octokit } from "@octokit/rest";
import { supabaseAdmin } from "../utils/supabase";
import { octokitForUser } from "../utils/github-client";
import { generateText } from "./gemini";

export interface RawActivity {
  username: string;
  generated_for_date: string;
  prs_authored: ActivityItem[];
  prs_awaiting_review: ActivityItem[];
  issues_active: ActivityItem[];
  recent_pushes: PushItem[];
}

interface ActivityItem {
  number: number;
  title: string;
  repo: string;
  url: string;
  state: string;
  draft?: boolean;
  updated_at: string;
  created_at: string;
  age_hours: number;
}

interface PushItem {
  repo: string;
  branch: string;
  commit_count: number;
  head_message: string;
  pushed_at: string;
}

interface GenerateInput {
  userId: string;
  digestDate: string; // YYYY-MM-DD in user's local sense
}

export async function generateDigest({
  userId,
  digestDate,
}: GenerateInput): Promise<{ id: string; content: string; rawActivity: RawActivity }> {
  const { data: connection } = await supabaseAdmin
    .from("github_connections")
    .select("github_username")
    .eq("user_id", userId)
    .maybeSingle();
  if (!connection?.github_username) {
    throw new Error(
      "GitHub isn't connected. Sign out and sign in with GitHub to enable digests."
    );
  }
  const username = connection.github_username;

  const octokit = await octokitForUser(userId);
  const rawActivity = await collectActivity(octokit, username, digestDate);
  const content = await synthesizeDigest(rawActivity);

  const { data: inserted, error } = await supabaseAdmin
    .from("digests")
    .insert({
      user_id: userId,
      content,
      raw_activity: rawActivity,
      digest_date: digestDate,
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(error?.message ?? "save failed");

  return { id: inserted.id, content, rawActivity };
}

async function collectActivity(
  octokit: Octokit,
  username: string,
  digestDate: string
): Promise<RawActivity> {
  // Look back 24h from the digest date so the briefing covers "yesterday".
  const since = new Date(digestDate);
  since.setUTCDate(since.getUTCDate() - 1);
  const sinceISO = since.toISOString();
  const sinceDate = sinceISO.slice(0, 10);
  const now = Date.now();

  const ageHours = (iso: string) =>
    Math.max(0, Math.round((now - new Date(iso).getTime()) / 3_600_000));

  const [authored, awaitingReview, issues] = await Promise.all([
    octokit.search.issuesAndPullRequests({
      q: `type:pr author:${username} updated:>=${sinceDate}`,
      per_page: 30,
      sort: "updated",
      order: "desc",
    }),
    octokit.search.issuesAndPullRequests({
      q: `type:pr state:open review-requested:${username}`,
      per_page: 30,
      sort: "updated",
      order: "desc",
    }),
    octokit.search.issuesAndPullRequests({
      q: `type:issue commenter:${username} updated:>=${sinceDate}`,
      per_page: 20,
      sort: "updated",
      order: "desc",
    }),
  ]);

  const toItem = (raw: unknown): ActivityItem => {
    const r = raw as {
      number: number;
      title: string;
      html_url: string;
      state: string;
      draft?: boolean;
      updated_at: string;
      created_at: string;
      repository_url?: string;
    };
    const repo = (r.repository_url ?? "").replace(
      "https://api.github.com/repos/",
      ""
    );
    return {
      number: r.number,
      title: r.title,
      repo,
      url: r.html_url,
      state: r.state,
      draft: r.draft,
      updated_at: r.updated_at,
      created_at: r.created_at,
      age_hours: ageHours(r.updated_at),
    };
  };

  let recentPushes: PushItem[] = [];
  try {
    const events = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 30,
    });
    recentPushes = events.data
      .filter((e) => e.type === "PushEvent")
      .filter((e) => e.created_at && new Date(e.created_at) >= since)
      .map((e) => {
        const payload = (e.payload ?? {}) as {
          ref?: string;
          size?: number;
          commits?: { message?: string }[];
        };
        return {
          repo: e.repo?.name ?? "",
          branch: (payload.ref ?? "").replace(/^refs\/heads\//, ""),
          commit_count: payload.size ?? payload.commits?.length ?? 0,
          head_message:
            payload.commits?.[payload.commits.length - 1]?.message ?? "",
          pushed_at: e.created_at ?? "",
        };
      });
  } catch (err) {
    console.warn("[digest] failed to fetch events:", err);
  }

  return {
    username,
    generated_for_date: digestDate,
    prs_authored: authored.data.items.map(toItem),
    prs_awaiting_review: awaitingReview.data.items.map(toItem),
    issues_active: issues.data.items.map(toItem),
    recent_pushes: recentPushes,
  };
}

async function synthesizeDigest(activity: RawActivity): Promise<string> {
  const isQuiet =
    activity.prs_authored.length === 0 &&
    activity.prs_awaiting_review.length === 0 &&
    activity.issues_active.length === 0 &&
    activity.recent_pushes.length === 0;
  if (isQuiet) {
    return [
      `# Briefing for ${activity.generated_for_date}`,
      "",
      "Quiet day on GitHub — no PRs, reviews, or commits in the last 24 hours.",
      "",
      "Use the time on something deeper: a tricky bug you've been deferring, the design doc you owe, or batch-reviewing any older PRs sitting in your queue.",
    ].join("\n");
  }

  const system = `You are an engineering team assistant. Given a GitHub activity summary for a single engineer, write their morning briefing.

Structure:
1. **Yesterday** — 2-3 sentences summarizing what they actually did (PRs opened/merged, issues commented on, pushes). Concrete, not generic.
2. **Today's priorities** — 3-5 ranked, actionable items. Most important first. Reference specific PR numbers and repos. If a PR has been awaiting review for over 48 hours, call it out as needing attention. If a draft PR has been open a while, suggest finishing it.
3. **Heads up** — optional 1-2 sentences if there's anything worth flagging (PRs awaiting their review, blocked work, stale items).

Style:
- Direct, collegial tone — like a smart colleague briefing them in the morning.
- Short paragraphs, not bullet dumps. (Markdown lists are OK for the priorities section.)
- Use repo names like \`owner/repo\` and PR numbers like \`#123\`.
- Don't invent activity that isn't in the data.

Output Markdown.`;

  const prompt = `Engineer: ${activity.username}
Briefing date: ${activity.generated_for_date}

Activity data (JSON):
${JSON.stringify(activity, null, 2)}`;

  return generateText(prompt, system);
}
