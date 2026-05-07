"use client";

import { useState } from "react";
import { Calendar, ExternalLink, User } from "lucide-react";
import type { ActionItem, Priority } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GithubIcon } from "@/components/ui/brand-icons";
import { CreateIssueModal } from "./CreateIssueModal";
import { cn } from "@/lib/utils";

interface ActionItemCardProps {
  item: ActionItem;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-muted text-muted-foreground hover:bg-muted",
};

export function ActionItemCard({ item }: ActionItemCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium leading-snug">{item.title}</h3>
            <Badge
              variant="secondary"
              className={cn("shrink-0", PRIORITY_STYLES[item.priority])}
            >
              {item.priority}
            </Badge>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {item.assignee && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {item.assignee}
              </span>
            )}
            {item.due_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {item.due_date}
              </span>
            )}
          </div>
          <div className="pt-2 border-t flex items-center justify-end">
            {item.github_issue_url ? (
              <a
                href={item.github_issue_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                Issue #{item.github_issue_number}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
              >
                <GithubIcon className="mr-1.5 h-3.5 w-3.5" />
                Create GitHub Issue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <CreateIssueModal item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
