"use client";

import { useState } from "react";
import { Loader2, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CodeRepo } from "@/lib/types";
import { useDeleteRepo, useIndexRepo } from "@/hooks/useAsk";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";

export function RepoActionsMenu({ repo }: { repo: CodeRepo }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const reindex = useIndexRepo();
  const remove = useDeleteRepo();
  const isIndexing = repo.status === "indexing" || repo.status === "pending";

  async function handleRetry() {
    if (reindex.isPending || isIndexing) return;
    try {
      await reindex.mutateAsync(repo.repo_full_name);
      toast.success("Re-indexing started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't restart indexing.");
    }
  }

  async function handleDelete() {
    if (remove.isPending) return;
    try {
      await remove.mutateAsync(repo.id);
      setDeleteOpen(false);
      toast.success("Repository disconnected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${repo.repo_full_name}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={handleRetry}
            disabled={reindex.isPending || isIndexing}
            className="cursor-pointer"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {repo.status === "failed" ? "Retry indexing" : "Re-index"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this repo?</AlertDialogTitle>
            <AlertDialogDescription>
              All indexed chunks for{" "}
              <span className="font-mono">{repo.repo_full_name}</span> will be
              deleted. You can reconnect any time.
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
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
