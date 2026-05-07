"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateDebriefTitle } from "@/hooks/useDebriefs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameDebriefDialogProps {
  debriefId: string;
  currentTitle: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameDebriefDialog({
  debriefId,
  currentTitle,
  open,
  onOpenChange,
}: RenameDebriefDialogProps) {
  const [value, setValue] = useState(currentTitle ?? "");
  const update = useUpdateDebriefTitle(debriefId);

  useEffect(() => {
    if (open) setValue(currentTitle ?? "");
  }, [open, currentTitle]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (update.isPending) return;
    try {
      await update.mutateAsync(value.trim() || null);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update title.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename debrief</DialogTitle>
          <DialogDescription>
            Set a meaningful title so it&apos;s easier to find later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Q3 launch sync"
            maxLength={200}
            disabled={update.isPending}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
