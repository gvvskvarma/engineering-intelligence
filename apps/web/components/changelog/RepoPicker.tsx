"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Loader2, Lock, Search } from "lucide-react";
import { useGithubRepos } from "@/hooks/useGithub";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepoPickerProps {
  value: string | null;
  onChange: (repoFullName: string) => void;
}

export function RepoPicker({ value, onChange }: RepoPickerProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const repos = useGithubRepos(open);

  const filtered = useMemo(() => {
    const list = repos.data ?? [];
    if (!filter.trim()) return list;
    const q = filter.trim().toLowerCase();
    return list.filter((r) => r.full_name.toLowerCase().includes(q));
  }, [repos.data, filter]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between !h-10 px-3"
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ?? "Pick a repository…"}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[320px] p-0"
      >
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search…"
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {repos.isLoading ? (
              <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading repos…
              </div>
            ) : repos.error ? (
              <p className="px-3 py-3 text-xs text-destructive">
                Couldn&apos;t load repos. Reconnect GitHub if needed.
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                No matching repos.
              </p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.full_name}
                  type="button"
                  onClick={() => {
                    onChange(r.full_name);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between gap-2 text-sm transition-colors",
                    value === r.full_name
                      ? "bg-secondary"
                      : "hover:bg-secondary/60"
                  )}
                >
                  <span className="truncate">{r.full_name}</span>
                  {r.private && (
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
