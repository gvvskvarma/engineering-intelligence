"use client";

import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { useDebriefs, type DebriefListItem } from "@/hooks/useDebriefs";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyDebriefState } from "@/components/debrief/EmptyDebriefState";
import { cn } from "@/lib/utils";

export default function DebriefListPage() {
  const { data, isLoading, error } = useDebriefs();

  return (
    <>
      <PageHeader
        title="Meeting Debrief"
        description="Transcripts in, action items and GitHub issues out."
        actions={
          <Link href="/debrief/new" className={cn(buttonVariants())}>
            <Plus className="mr-2 h-4 w-4" />
            New Debrief
          </Link>
        }
      />
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading debriefs…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load debriefs.</p>
        ) : !data || data.length === 0 ? (
          <div className="max-w-xl">
            <EmptyDebriefState />
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {data.map((d) => (
              <DebriefRow key={d.id} debrief={d} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DebriefRow({ debrief }: { debrief: DebriefListItem }) {
  const date = new Date(debrief.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <Link href={`/debrief/${debrief.id}`} className="block">
      <Card className="transition-colors hover:bg-secondary/30">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium truncate">
              {debrief.title ?? "Untitled meeting"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {date} · {debrief.action_item_count} action item
              {debrief.action_item_count === 1 ? "" : "s"}
            </p>
          </div>
          <StatusBadge status={debrief.status} />
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusBadge({ status }: { status: DebriefListItem["status"] }) {
  if (status === "processing") {
    return (
      <Badge variant="secondary" className="shrink-0">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Processing
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700">
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="shrink-0">
      Completed
    </Badge>
  );
}
