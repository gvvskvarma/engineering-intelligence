"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Info,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useChangelog, useDeleteChangelog } from "@/hooks/useChangelog";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DigestMarkdown } from "@/components/digest/DigestMarkdown";
import { PageHeader } from "@/components/layout/PageHeader";
import { RegenerateDialog } from "@/components/changelog/RegenerateDialog";
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

type Audience = "engineer" | "pm" | "customer";

const TABS: Array<{ key: Audience; label: string }> = [
  { key: "engineer", label: "Engineers" },
  { key: "pm", label: "Product team" },
  { key: "customer", label: "Customers" },
];

export default function ChangelogDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data, isLoading, error } = useChangelog(params.id);
  const remove = useDeleteChangelog();
  const [tab, setTab] = useState<Audience>("engineer");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
        <p className="text-sm text-destructive">Couldn&apos;t load this changelog.</p>
        <Link
          href="/changelog"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Back to changelogs
        </Link>
      </div>
    );
  }

  const changelog = data;
  const versions: Record<Audience, string> = {
    engineer: changelog.engineer_version ?? "",
    pm: changelog.pm_version ?? "",
    customer: changelog.customer_version ?? "",
  };
  const active = versions[tab];
  const prCount = changelog.raw_activity?.pr_count ?? 0;

  function handleCopy() {
    void navigator.clipboard
      .writeText(active)
      .then(() => {
        setCopied(true);
        toast.success("Copied to clipboard.");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Couldn't copy."));
  }

  function handleExport() {
    const safeRepo = changelog.repo_full_name.replace("/", "-");
    const fileName = `${safeRepo}-${tab}-${changelog.date_from}-to-${changelog.date_to}.md`;
    const blob = new Blob([active], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (remove.isPending) return;
    try {
      await remove.mutateAsync(changelog.id);
      toast.success("Changelog deleted.");
      router.push("/changelog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  const range = `${formatDate(changelog.date_from)} → ${formatDate(changelog.date_to)}`;
  const isEmpty = (changelog.raw_activity?.pr_count ?? 0) === 0;

  return (
    <>
      <PageHeader
        title={changelog.repo_full_name}
        description={`${range} · ${prCount} merged PR${prCount === 1 ? "" : "s"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/changelog"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All changelogs
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRegenerateOpen(true)}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        }
      />
      <div className="px-8 py-8 max-w-3xl space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Audience)}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export .md
              </Button>
            </div>
          </div>
          {TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-6">
                  {versions[t.key] ? (
                    <DigestMarkdown content={versions[t.key]} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No content for this audience.
                    </p>
                  )}
                </CardContent>
              </Card>
              {isEmpty && <EmptyWindowHint onRegenerate={() => setRegenerateOpen(true)} />}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <RegenerateDialog
        repoFullName={changelog.repo_full_name}
        initialFrom={changelog.date_from}
        initialTo={changelog.date_to}
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this changelog?</AlertDialogTitle>
            <AlertDialogDescription>
              All three versions will be removed. You can always regenerate from
              the same date range.
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyWindowHint({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
      <CardContent className="py-4 px-5 flex items-start gap-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <p>
            <span className="font-medium">No merged PRs in this window.</span>{" "}
            The changelog tool only counts PRs that were merged — direct commits to
            <code className="font-mono px-1">main</code> aren&apos;t included.
          </p>
          <p className="text-muted-foreground">
            For repos using a PR-based workflow, try a wider window. For solo
            repos with direct pushes, the <strong>Daily Digest</strong> module
            covers commit activity instead.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Try a different window
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
