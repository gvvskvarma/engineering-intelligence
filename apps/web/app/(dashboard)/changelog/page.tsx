"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useChangelogs, useGenerateChangelog } from "@/hooks/useChangelog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { RepoPicker } from "@/components/changelog/RepoPicker";
import { DateRangePicker } from "@/components/changelog/DateRangePicker";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function thirtyDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function ChangelogPage() {
  const router = useRouter();
  const list = useChangelogs();
  const generate = useGenerateChangelog();

  const [repo, setRepo] = useState<string | null>(null);
  const [from, setFrom] = useState<string>(thirtyDaysAgoISO());
  const [to, setTo] = useState<string>(todayISO());

  const canGenerate = !!repo && !!from && !!to && from <= to && !generate.isPending;

  async function handleGenerate() {
    if (!canGenerate) return;
    try {
      const result = await generate.mutateAsync({
        repo_full_name: repo!,
        date_from: from,
        date_to: to,
      });
      toast.success(`Generated from ${result.pr_count} merged PR${result.pr_count === 1 ? "" : "s"}.`);
      router.push(`/changelog/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate changelog.");
    }
  }

  return (
    <>
      <PageHeader
        title="Changelog Generator"
        description="Three audience-tuned changelogs from one set of merged PRs."
      />
      <div className="px-8 py-8 space-y-8 max-w-3xl">
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Repository
              </p>
              <RepoPicker value={repo} onChange={setRepo} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Window
              </p>
              <DateRangePicker
                from={from}
                to={to}
                onChange={(f, t) => {
                  setFrom(f);
                  setTo(t);
                }}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing PRs…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Changelog
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Past changelogs
            </h2>
          </div>
          {list.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground py-6">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : !list.data || list.data.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 px-6 text-center">
                <ClipboardList className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No changelogs yet. Pick a repo and a window above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {list.data.map((c) => {
                const range = `${formatDate(c.date_from)} → ${formatDate(c.date_to)}`;
                return (
                  <Link key={c.id} href={`/changelog/${c.id}`} className="block">
                    <Card className="transition-colors hover:bg-secondary/30">
                      <CardContent className="p-4">
                        <p className="font-medium truncate">{c.repo_full_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {range}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
