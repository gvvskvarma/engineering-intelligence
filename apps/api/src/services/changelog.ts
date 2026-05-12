import type { ResponseSchema } from "@google/generative-ai";
import { supabaseAdmin } from "../utils/supabase";
import { octokitForUser } from "../utils/github-client";
import { generateStructuredContent, SchemaType } from "./gemini";

interface MergedPr {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  author: string | null;
  html_url: string;
  merged_at: string | null;
}

interface ChangelogVersions {
  engineer_version: string;
  pm_version: string;
  customer_version: string;
}

interface GenerateInput {
  userId: string;
  repoFullName: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
}

export async function generateChangelog({
  userId,
  repoFullName,
  dateFrom,
  dateTo,
}: GenerateInput): Promise<{
  id: string;
  prCount: number;
  versions: ChangelogVersions;
}> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error("repo_full_name must be 'owner/repo'");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    throw new Error("dates must be YYYY-MM-DD");
  }
  if (dateFrom > dateTo) throw new Error("date_from must be on or before date_to");

  const octokit = await octokitForUser(userId);

  // Fetch up to 200 merged PRs (2 pages of 100). Plenty for any sane window.
  const prs: MergedPr[] = [];
  for (let page = 1; page <= 2; page++) {
    const result = await octokit.search.issuesAndPullRequests({
      q: `type:pr is:merged repo:${owner}/${repo} merged:${dateFrom}..${dateTo}`,
      per_page: 100,
      page,
      sort: "updated",
      order: "desc",
    });
    for (const item of result.data.items) {
      const raw = item as typeof item & { pull_request?: { merged_at?: string } };
      prs.push({
        number: raw.number,
        title: raw.title,
        body: truncate(raw.body ?? null, 1200),
        labels: (raw.labels ?? [])
          .map((l) => (typeof l === "string" ? l : l.name ?? ""))
          .filter(Boolean) as string[],
        author: raw.user?.login ?? null,
        html_url: raw.html_url,
        merged_at: raw.pull_request?.merged_at ?? null,
      });
    }
    if (result.data.items.length < 100) break;
  }

  const versions = await synthesizeVersions({
    repoFullName,
    dateFrom,
    dateTo,
    prs,
  });

  const { data: inserted, error } = await supabaseAdmin
    .from("changelogs")
    .insert({
      user_id: userId,
      repo_full_name: repoFullName,
      date_from: dateFrom,
      date_to: dateTo,
      engineer_version: versions.engineer_version,
      pm_version: versions.pm_version,
      customer_version: versions.customer_version,
      raw_activity: { pr_count: prs.length, prs },
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(error?.message ?? "save failed");

  return { id: inserted.id, prCount: prs.length, versions };
}

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    engineer_version: { type: SchemaType.STRING },
    pm_version: { type: SchemaType.STRING },
    customer_version: { type: SchemaType.STRING },
  },
  required: ["engineer_version", "pm_version", "customer_version"],
};

const SYSTEM_PROMPT = `You are a release notes writer. Given a list of merged PRs from a single GitHub repo over a date range, produce THREE audience-tuned changelogs.

Output JSON with three Markdown strings: engineer_version, pm_version, customer_version.

ENGINEER VERSION (Markdown):
- Technical. Group by category: Features, Bug fixes, Breaking changes, Performance, Refactor, Docs, Internal/CI.
- Each item: 1 line, ends with the PR number in parentheses like (#123) and the author handle.
- Call out breaking changes prominently with migration notes if the PR body has them.
- If there are zero PRs in a category, omit the heading.

PM VERSION (Markdown):
- Feature-focused. Frame each item as a user capability or business outcome.
- No file paths, library names, or framework details unless they're customer-facing.
- Group by product area or theme. No PR numbers.
- Skip pure-internal items (refactors, dev tooling, CI, dependency bumps).

CUSTOMER VERSION (Markdown):
- Plain English benefits only. Lead with "You can now…", "We fixed…", "Faster/Smoother/More reliable…".
- Group as: New, Improved, Fixed.
- Skip anything not visible to end users (internal refactors, infrastructure, docs).
- No PR numbers, no author names, no technical jargon.

Don't fabricate items not in the PR list. If a category is empty, omit it. If the entire window has no merged PRs, return a short "Nothing shipped in this window." note for each version.`;

async function synthesizeVersions(args: {
  repoFullName: string;
  dateFrom: string;
  dateTo: string;
  prs: MergedPr[];
}): Promise<ChangelogVersions> {
  if (args.prs.length === 0) {
    const empty = `# ${args.repoFullName} — ${args.dateFrom} → ${args.dateTo}\n\nNothing shipped in this window.`;
    return {
      engineer_version: empty,
      pm_version: empty,
      customer_version: empty,
    };
  }
  const prompt = `Repository: ${args.repoFullName}
Window: ${args.dateFrom} → ${args.dateTo}
Merged PR count: ${args.prs.length}

PRs (JSON):
${JSON.stringify(args.prs, null, 2)}`;

  return generateStructuredContent<ChangelogVersions>({
    system: SYSTEM_PROMPT,
    prompt,
    schema: RESPONSE_SCHEMA,
  });
}

function truncate(text: string | null, max: number): string | null {
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n…[truncated for prompt size]`;
}
