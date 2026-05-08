"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { ActivityItem, PushItem, RawActivity } from "@/hooks/useDigest";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RawActivitySection({ activity }: { activity: RawActivity }) {
  const [open, setOpen] = useState(false);
  const counts =
    activity.prs_authored.length +
    activity.prs_awaiting_review.length +
    activity.issues_active.length +
    activity.recent_pushes.length;

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
          <span className="text-sm font-medium">Raw activity</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {counts} item{counts === 1 ? "" : "s"}
          </span>
        </button>
        {open && (
          <div className="border-t px-4 py-3 space-y-4">
            <ItemList title="PRs you authored" items={activity.prs_authored} />
            <ItemList
              title="PRs awaiting your review"
              items={activity.prs_awaiting_review}
            />
            <ItemList title="Issues you participated in" items={activity.issues_active} />
            <PushList pushes={activity.recent_pushes} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemList({ title, items }: { title: string; items: ActivityItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {title} ({items.length})
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={`${item.repo}-${item.number}`} className="text-xs">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:underline"
            >
              <span className="font-mono text-muted-foreground shrink-0">
                {item.repo}#{item.number}
              </span>
              <span className="truncate">{item.title}</span>
              {item.draft && (
                <span className="text-[10px] uppercase text-muted-foreground shrink-0">
                  draft
                </span>
              )}
              <ExternalLink className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PushList({ pushes }: { pushes: PushItem[] }) {
  if (pushes.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        Recent pushes ({pushes.length})
      </p>
      <ul className="space-y-1">
        {pushes.map((p, i) => (
          <li key={`${p.repo}-${i}`} className="text-xs">
            <span className="font-mono text-muted-foreground">
              {p.repo} · {p.branch}
            </span>
            <span className="ml-2">
              {p.commit_count} commit{p.commit_count === 1 ? "" : "s"} —{" "}
              {p.head_message.split("\n")[0]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
