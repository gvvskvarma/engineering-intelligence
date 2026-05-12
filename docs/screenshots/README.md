# Screenshots for the main README

Five images, all PNG, taken at roughly **2400 × 1500** (a normal MacBook screenshot at retina works). Save with the exact filenames below so the README references work.

Best practices for portfolio screenshots:
- **Use real content** — your actual debrief, your actual repo, your actual digest. Demo data screams "demo."
- **Crop to the meaningful UI** — full browser chrome with bookmarks is noise. The sidebar + main content area is the story.
- **Light mode is fine.** Dark mode is fine. Pick one and stay consistent across all five.
- **No dev tools open**, no extension icons in the corner, no personal tabs visible.

---

## 1. `dashboard.png` — hero shot

Path: `/dashboard`

Show: sidebar + the four module cards on the home dashboard. This is the first thing the README shows, so it sets the tone.

## 2. `debrief-result.png` — meeting debrief output

Path: `/debrief/<some-real-debrief-id>`

Show: a real debrief detail page with the meeting summary card and 3+ action items. Bonus if at least one action item shows a GitHub Issue link (proves the integration works).

Suggested transcript to use if you want to regenerate fresh: the Sarah/Mike/Priya one we used during testing — it produces a clean 3-item result.

## 3. `ask-chat.png` — codebase Q&A with citations

Path: `/ask/<some-repo-id>`

Show: chat interface mid-conversation, with at least one user question and one assistant answer. **Have one or two citation cards expanded** so the code snippets are visible — that's the wow moment for this module.

Good question to ask for the screenshot: *"How does the dark/light theme toggle work?"* on your `vishnu-portfolio` repo — produces a multi-citation answer with code snippets.

## 4. `digest.png` — daily digest briefing

Path: `/digest`

Show: a generated digest with the rendered markdown (Yesterday / Today's priorities / Heads up sections). If you can also expand the "Raw activity" block to show PRs underneath, even better.

## 5. `changelog-tabs.png` — three-audience changelog

Path: `/changelog/<some-changelog-id>`

Show: the detail page with the three tabs visible. Pick a tab that has real content (probably the Engineers tab — most populated). The Copy / Export / Regenerate / Delete buttons should be visible in the same shot.

---

## After capturing

Drop the five files into this directory and commit them. The main README will pick them up automatically.

```bash
git add docs/screenshots/*.png
git commit -m "docs: add portfolio screenshots"
git push
```
