"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useGenerateChangelog } from "@/hooks/useChangelog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";

interface RegenerateDialogProps {
  repoFullName: string;
  initialFrom: string;
  initialTo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegenerateDialog({
  repoFullName,
  initialFrom,
  initialTo,
  open,
  onOpenChange,
}: RegenerateDialogProps) {
  const router = useRouter();
  const generate = useGenerateChangelog();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  useEffect(() => {
    if (open) {
      setFrom(initialFrom);
      setTo(initialTo);
    }
  }, [open, initialFrom, initialTo]);

  const canRun = !!from && !!to && from <= to && !generate.isPending;

  async function handleRun() {
    if (!canRun) return;
    try {
      const result = await generate.mutateAsync({
        repo_full_name: repoFullName,
        date_from: from,
        date_to: to,
      });
      onOpenChange(false);
      toast.success(
        `Generated from ${result.pr_count} merged PR${result.pr_count === 1 ? "" : "s"}.`
      );
      router.push(`/changelog/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't regenerate."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate for a different window</DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-mono">{repoFullName}</span> — creates a new
            changelog from PRs merged in the selected window.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <DateRangePicker
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={generate.isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRun} disabled={!canRun}>
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing PRs…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
