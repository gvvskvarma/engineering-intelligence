"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import type { CodeRepo, RepoStatus } from "@/lib/types";
import { useCodeRepos } from "@/hooks/useAsk";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { RepoConnector } from "@/components/ask/RepoConnector";
import { RepoActionsMenu } from "@/components/ask/RepoActionsMenu";
import { cn } from "@/lib/utils";

export default function AskListPage() {
  const [connectorOpen, setConnectorOpen] = useState(false);
  const { data, isLoading, error } = useCodeRepos();

  const connected = useMemo(
    () => new Set((data ?? []).map((r) => r.repo_full_name)),
    [data]
  );

  return (
    <>
      <PageHeader
        title="Codebase Q&A"
        description="Ask questions of any GitHub repo and get cited answers."
        actions={
          <Button onClick={() => setConnectorOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Repository
          </Button>
        }
      />
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading repos…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Couldn&apos;t load repos.</p>
        ) : !data || data.length === 0 ? (
          <EmptyState onConnect={() => setConnectorOpen(true)} />
        ) : (
          <div className="grid gap-3 max-w-3xl">
            {data.map((r) => (
              <RepoRow key={r.id} repo={r} />
            ))}
          </div>
        )}
      </div>
      <RepoConnector
        open={connectorOpen}
        onOpenChange={setConnectorOpen}
        alreadyConnected={connected}
      />
    </>
  );
}

function RepoRow({ repo }: { repo: CodeRepo }) {
  const isReady = repo.status === "ready";

  const body = (
    <div className="flex-1 min-w-0 flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium truncate">{repo.repo_full_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {repo.status === "ready" && (
            <>
              {repo.file_count} files · {repo.chunk_count} chunks
            </>
          )}
          {repo.status === "indexing" && "Indexing…"}
          {repo.status === "pending" && "Queued for indexing…"}
          {repo.status === "failed" &&
            (repo.failure_reason ? repo.failure_reason : "Indexing failed")}
        </p>
      </div>
      <StatusBadge status={repo.status} />
    </div>
  );

  return (
    <Card
      className={cn(
        "transition-colors overflow-hidden",
        isReady && "hover:bg-secondary/30",
        !isReady && "opacity-95"
      )}
    >
      <CardContent className="p-0 flex items-stretch">
        {isReady ? (
          <Link href={`/ask/${repo.id}`} className="flex-1 flex min-w-0">
            {body}
          </Link>
        ) : (
          <div className="flex-1 flex min-w-0 cursor-default">{body}</div>
        )}
        <div className="pr-3 flex items-center">
          <RepoActionsMenu repo={repo} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: RepoStatus }) {
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="shrink-0">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Ready
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-red-100 text-red-700">
        <XCircle className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="shrink-0">
      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      Indexing
    </Badge>
  );
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <Card className="border-dashed max-w-2xl">
      <CardContent className="py-12 px-6 flex flex-col items-center text-center">
        <div className="rounded-full border bg-muted/50 p-3 mb-4">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-base">No repositories connected</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Connect a GitHub repo and we&apos;ll index it so you can ask
          natural-language questions with cited answers.
        </p>
        <Button className="mt-5" onClick={onConnect}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Repository
        </Button>
      </CardContent>
    </Card>
  );
}
