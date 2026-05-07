"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useGithubRepos } from "@/hooks/useGithub";
import { useIndexRepo } from "@/hooks/useAsk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RepoConnectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyConnected: Set<string>;
}

export function RepoConnector({
  open,
  onOpenChange,
  alreadyConnected,
}: RepoConnectorProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const repos = useGithubRepos(open);
  const indexRepo = useIndexRepo();

  const filtered = useMemo(() => {
    const list = repos.data ?? [];
    if (!filter.trim()) return list;
    const q = filter.trim().toLowerCase();
    return list.filter((r) => r.full_name.toLowerCase().includes(q));
  }, [repos.data, filter]);

  async function handleConnect() {
    if (!selected || indexRepo.isPending) return;
    try {
      const result = await indexRepo.mutateAsync(selected);
      onOpenChange(false);
      toast.success("Indexing started — usually takes a minute or two.");
      router.push(`/ask/${result.repo_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start indexing.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect a repository</DialogTitle>
          <DialogDescription className="text-xs">
            We&apos;ll fetch the file tree, chunk + embed up to 500 source files,
            and store vectors in pgvector so you can ask questions.
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
                  filtered.map((r) => {
                    const isConnected = alreadyConnected.has(r.full_name);
                    const isSelected = selected === r.full_name;
                    return (
                      <button
                        key={r.full_name}
                        type="button"
                        disabled={isConnected}
                        onClick={() => setSelected(r.full_name)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md flex items-center justify-between gap-2 text-sm transition-colors",
                          isConnected && "opacity-50 cursor-not-allowed",
                          !isConnected && isSelected && "bg-secondary",
                          !isConnected && !isSelected && "hover:bg-secondary/60"
                        )}
                      >
                        <span className="truncate">{r.full_name}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          {r.private && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                          {isConnected && (
                            <span className="text-xs text-muted-foreground">
                              connected
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={indexRepo.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={!selected || indexRepo.isPending}
              >
                {indexRepo.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Connect & index
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
            ? "Sign out and sign back in with GitHub to grant repo access."
            : message}
        </p>
      </CardContent>
    </Card>
  );
}
