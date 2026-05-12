# Demo Loom — script & storyboard

**Target length:** 75 seconds. Recruiters watch on 2× speed and bail at 90s.
**Tool:** [Loom](https://loom.com) free tier is fine. Camera off (just screen + voice), 1080p.

## Before you hit record

1. **Pre-stage everything** so you're not waiting on Gemini during the video:
   - One completed Meeting Debrief already at `/debrief/<some-id>` (use the Sarah/Mike/Priya transcript)
   - An indexed repo at `/ask/<vishnu-portfolio-id>` with one question already asked + cited
   - Today's digest already generated at `/digest`
   - A changelog already generated at `/changelog/<some-id>`
2. **Open them as separate browser tabs** in this order so you can flip with Cmd+T:
   - Tab 1: `/dashboard`
   - Tab 2: `/debrief/[id]` (showing summary + action items)
   - Tab 3: `/ask/[repoId]` (chat with one Q&A and an expanded citation)
   - Tab 4: `/digest`
   - Tab 5: `/changelog/[id]` (with the Engineers tab open)
3. **Close DevTools, hide extensions**, light/dark mode consistent across tabs.
4. **Read the script once aloud** before you record — ~75 sec at normal pace.

---

## Script (~75 seconds, ~200 words)

> **[0:00 — show dashboard, Tab 1]**
> "This is the Engineering Intelligence Platform. Four AI modules for engineering teams — meeting debriefs, codebase Q&A, daily digests, and changelog generation. All running on free tiers: Next.js on Vercel, Express on Render, Postgres with pgvector on Supabase, and Google Gemini for the LLM."
>
> **[0:18 — switch to Tab 2, debrief]**
> "Meeting Debrief takes a transcript, runs it through Gemini in JSON mode, and extracts structured action items with assignees, priorities, and due dates. Each one creates a GitHub issue with one click — see this card here, it links to an actual issue in my repo."
>
> **[0:32 — switch to Tab 3, ask page]**
> "Codebase Q&A is the technical centerpiece. It indexes a GitHub repo's source files into pgvector, then answers natural-language questions with file and line citations grounded in the actual code. Expand the citation — you can see the exact snippet the answer came from."
>
> **[0:52 — switch to Tab 4, digest]**
> "Daily Digest pulls 24 hours of your GitHub activity — PRs, reviews, pushes — and synthesizes a morning briefing structured as yesterday, today's priorities, and heads up."
>
> **[1:02 — switch to Tab 5, changelog]**
> "Changelog Generator takes merged PRs in a date range and writes three audience-tuned changelogs — engineer, PM, and customer — all in one Gemini call with a strict response schema."
>
> **[1:12 — closing]**
> "Source on GitHub. Architecture and trade-offs in the README. Built solo over a week — happy to talk about any of the engineering decisions."

---

## Storyboard / mouse movements

| Time | Tab | What to do | What to say |
|---|---|---|---|
| 0:00–0:05 | Dashboard | Just sit on it | Open with the project name |
| 0:05–0:18 | Dashboard | Slowly hover over the four cards as you name them | List the four modules + the tech |
| 0:18–0:32 | Debrief | Scroll once so 2-3 action items are in view, then hover the "Issue #13" link | Explain extraction + the GitHub integration |
| 0:32–0:52 | Ask | The question + answer is already there. Click the citation card to expand it on camera | This is the wow moment — let the citation animation play |
| 0:52–1:02 | Digest | Just show the rendered briefing | Quick description, don't linger |
| 1:02–1:12 | Changelog | Click between the three tabs (Engineers → Product team → Customers) as you mention each audience | Show the audience switching |
| 1:12–1:18 | Anywhere | Optionally swing back to dashboard | Closing line |

## Tips for sounding good

- **Don't apologize for anything.** Don't say "this is just a side project" or "there are some bugs."
- **Talk fast and decisive.** Pause for breath, not for hedging.
- **Skip filler words.** Cut "so," "like," "basically," "kind of."
- **Re-record if you stumble in the first 15 seconds.** Recruiters only watch the first 15 seconds before deciding whether to keep going.
- **One take is fine.** Loom lets you trim. Don't try to make this perfect — make it directional and ship it.

## Where to use the Loom link

1. Add to the top of the README as a "▶ Watch a 75-second demo" link/badge
2. Include in cover letters / outreach emails
3. Pin to your GitHub profile README
4. Share when applying — paste it in the additional info field on job applications

After recording, paste the share URL here and I'll update the main README to lead with it.
