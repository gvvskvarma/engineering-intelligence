"use client";

import { useState } from "react";
import {
  Calendar,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { ActionItem, Priority } from "@/lib/types";
import { useDeleteActionItem } from "@/hooks/useDebriefs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [issueOpen, setIssueOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const remove = useDeleteActionItem(item.debrief_id);

  async function handleDelete() {
    if (remove.isPending) return;
    try {
      await remove.mutateAsync(item.id);
      setConfirmOpen(false);
      toast.success("Action item removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item.");
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium leading-snug">{item.title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="secondary"
                className={cn(PRIORITY_STYLES[item.priority])}
              >
                {item.priority}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Item actions"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-xs" })
                  )}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setConfirmOpen(true)}
                    className="cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                onClick={() => setIssueOpen(true)}
              >
                <GithubIcon className="mr-1.5 h-3.5 w-3.5" />
                Create GitHub Issue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <CreateIssueModal item={item} open={issueOpen} onOpenChange={setIssueOpen} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this action item?</AlertDialogTitle>
            <AlertDialogDescription>
              {item.github_issue_url
                ? "The linked GitHub issue will not be deleted; only the local copy goes away."
                : "This only removes it from the debrief. You can always re-extract from the original transcript."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
