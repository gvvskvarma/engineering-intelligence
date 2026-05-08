"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";
import {
  useDigests,
  useDigest,
  useGenerateDigest,
  type GenerateResult,
} from "@/hooks/useDigest";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { DigestMarkdown } from "@/components/digest/DigestMarkdown";
import { RawActivitySection } from "@/components/digest/RawActivitySection";
import { cn } from "@/lib/utils";

export default function DigestPage() {
  const list = useDigests();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const detail = useDigest(activeId);
  const generate = useGenerateDigest();

  // Determine what we're showing right now: just-generated > selected from history > most recent.
  const display = generated
    ? {
        content: generated.content,
        digestDate: generated.digest_date,
        rawActivity: generated.raw_activity,
        id: generated.id,
      }
    : detail.data
      ? {
          content: detail.data.content,
          digestDate: detail.data.digest_date,
          rawActivity: detail.data.raw_activity,
          id: detail.data.id,
        }
      : list.data && list.data.length > 0
        ? {
            content: list.data[0].content,
            digestDate: list.data[0].digest_date,
            rawActivity: null,
            id: list.data[0].id,
          }
        : null;

  async function handleGenerate(date?: string) {
    if (generate.isPending) return;
    try {
      const result = await generate.mutateAsync(date);
      setGenerated(result);
      setActiveId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate digest.");
    }
  }

  return (
    <>
      <PageHeader
        title="Daily Digest"
        description="Your last 24 hours on GitHub, synthesized."
        actions={
          <Button
            onClick={() => handleGenerate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : display ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate today
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate today&apos;s digest
              </>
            )}
          </Button>
        }
      />
      <div className="px-8 py-8 grid gap-8 max-w-5xl lg:grid-cols-[1fr_240px]">
        <div className="space-y-6 min-w-0">
          {list.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground py-12">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : !display ? (
            <EmptyState onGenerate={() => handleGenerate()} />
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <DigestMarkdown content={display.content} />
                </CardContent>
              </Card>
              {display.rawActivity && (
                <RawActivitySection activity={display.rawActivity} />
              )}
            </>
          )}
        </div>
        {(list.data?.length ?? 0) > 0 && (
          <aside className="lg:border-l lg:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Past digests
            </p>
            <div className="space-y-1">
              {list.data!.map((d) => {
                const isActive =
                  (generated?.id ?? activeId ?? list.data![0].id) === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setActiveId(d.id);
                      setGenerated(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors",
                      isActive
                        ? "bg-secondary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <Sun className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {new Date(d.digest_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 px-6 flex flex-col items-center text-center">
        <div className="rounded-full border bg-muted/50 p-3 mb-4">
          <Sun className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-base">No digest yet</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Pulls your last 24 hours of GitHub activity — PRs you authored, PRs
          awaiting your review, recent pushes, issue activity — and asks Gemini
          to synthesize a morning briefing.
        </p>
        <Button className="mt-5" onClick={onGenerate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate today&apos;s digest
        </Button>
      </CardContent>
    </Card>
  );
}
