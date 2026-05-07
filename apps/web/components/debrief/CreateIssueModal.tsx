"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Loader2, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { useCreateGithubIssue, useGithubRepos } from "@/hooks/useGithub";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/lib/types";

interface CreateIssueModalProps {
  item: ActionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateIssueModal({ item, open, onOpenChange }: CreateIssueModalProps) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const repos = useGithubRepos(open);
  const createIssue = useCreateGithubIssue(item.debrief_id);

  const filtered = useMemo(() => {
    const list = repos.data ?? [];
    if (!filter.trim()) return list;
    const q = filter.trim().toLowerCase();
    return list.filter((r) => r.full_name.toLowerCase().includes(q));
  }, [repos.data, filter]);

  async function handleCreate() {
    if (!selected || createIssue.isPending) return;
    try {
      const result = await createIssue.mutateAsync({
        action_item_id: item.id,
        repo_full_name: selected,
      });
      toast.success("Issue created", {
        action: {
          label: "Open",
          onClick: () => window.open(result.issue_url, "_blank"),
        },
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create issue.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create GitHub issue</DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-medium text-foreground">{item.title}</span>
          </DialogDescription>
        </DialogHeader>

        {repos.isLoading ? (
          <div className="py-12 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading your repos…
          </div>
        ) : repos.error ? (
          <ErrorState message={(repos.error as Error).message} />
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search repos…"
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-72 rounded-md border">
              <div className="p-1">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No repos match.
                  </p>
                ) : (
                  filtered.map((r) => (
                    <button
                      key={r.full_name}
                      type="button"
                      onClick={() => setSelected(r.full_name)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md flex items-center justify-between gap-2 text-sm transition-colors",
                        selected === r.full_name
                          ? "bg-secondary"
                          : "hover:bg-secondary/60"
                      )}
                    >
                      <span className="truncate">{r.full_name}</span>
                      {r.private && (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={createIssue.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!selected || createIssue.isPending}
              >
                {createIssue.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Create issue
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ErrorState({ message }: { message: string }) {
  const isUnconnected = message.toLowerCase().includes("not connected");
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
      <CardContent className="py-4 px-4 text-sm">
        <p className="font-medium">
          {isUnconnected ? "GitHub isn't connected yet" : "Couldn't load repos"}
        </p>
        <p className="mt-1 text-muted-foreground leading-relaxed">
          {isUnconnected
            ? "Sign out and sign back in with GitHub to grant repo access. The first time you signed in we didn't have repo permissions yet."
            : message}
        </p>
      </CardContent>
    </Card>
  );
}
