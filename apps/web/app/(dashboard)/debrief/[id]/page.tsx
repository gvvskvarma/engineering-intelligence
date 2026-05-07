"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useDebrief } from "@/hooks/useDebriefs";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionItemCard } from "@/components/debrief/ActionItemCard";
import { DebriefActionsMenu } from "@/components/debrief/DebriefActionsMenu";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export default function DebriefDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, isLoading, error } = useDebrief(params.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-sm text-destructive">Couldn&apos;t load this debrief.</p>
        <Link
          href="/debrief"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Back to debriefs
        </Link>
      </div>
    );
  }

  const { debrief, action_items } = data;
  const date = new Date(debrief.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title={debrief.title ?? "Untitled meeting"}
        description={`${date} · ${action_items.length} action item${action_items.length === 1 ? "" : "s"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/debrief"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All debriefs
            </Link>
            <DebriefActionsMenu
              debriefId={debrief.id}
              currentTitle={debrief.title}
            />
          </div>
        }
      />
      <div className="px-8 py-8 max-w-3xl space-y-8">
        {debrief.summary && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Summary
            </h2>
            <Card>
              <CardContent className="p-5 text-sm leading-relaxed">
                {debrief.summary}
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Action Items
            </h2>
            <Badge variant="secondary">{action_items.length}</Badge>
          </div>
          {action_items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No action items extracted from this meeting.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {action_items.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
