"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCodeRepo, useDeleteRepo } from "@/hooks/useAsk";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChatInterface } from "@/components/ask/ChatInterface";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function AskChatPage({
  params,
}: {
  params: { repoId: string };
}) {
  const router = useRouter();
  const { data: repo, isLoading, error } = useCodeRepo(params.repoId);
  const remove = useDeleteRepo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }
  if (error || !repo) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-sm text-destructive">Couldn&apos;t load this repo.</p>
        <Link
          href="/ask"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Back to repos
        </Link>
      </div>
    );
  }

  if (repo.status !== "ready") {
    return (
      <>
        <PageHeader
          title={repo.repo_full_name}
          description="Indexing the repository — this usually takes a minute or two."
          actions={
            <Link
              href="/ask"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All repos
            </Link>
          }
        />
        <div className="px-8 py-8 max-w-2xl">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              {repo.status === "failed" ? (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">Indexing failed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try removing and reconnecting the repo. If it keeps
                      failing, the repo may be too large for the free tier.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div>
                    <p className="font-medium">Indexing in progress</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Page will refresh automatically when it&apos;s ready.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const repoId = repo.id;
  async function handleDelete() {
    try {
      await remove.mutateAsync(repoId);
      toast.success("Repository disconnected.");
      router.push("/ask");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect.");
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title={repo.repo_full_name}
        description={`${repo.file_count} files · ${repo.chunk_count} chunks indexed`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/ask"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All repos
            </Link>
            <AlertDialog>
              <AlertDialogTrigger
                aria-label="Disconnect repository"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" })
                )}
              >
                <Trash2 className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect this repo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All indexed chunks for this repo will be deleted. You can
                    reconnect and re-index at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={remove.isPending}>
                    Cancel
                  </AlertDialogCancel>
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
          </div>
        }
      />
      <div className="flex-1 min-h-0">
        <ChatInterface repoId={repo.id} repoFullName={repo.repo_full_name} />
      </div>
    </div>
  );
}
