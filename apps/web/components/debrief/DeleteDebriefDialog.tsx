"use client";

import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteDebrief } from "@/hooks/useDebriefs";
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

interface DeleteDebriefDialogProps {
  debriefId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * If true, navigate back to the debrief list after successful delete.
   * Used on the detail page; not needed when called from the list itself.
   */
  navigateOnSuccess?: boolean;
}

export function DeleteDebriefDialog({
  debriefId,
  open,
  onOpenChange,
  navigateOnSuccess,
}: DeleteDebriefDialogProps) {
  const router = useRouter();
  const remove = useDeleteDebrief();

  async function handleConfirm() {
    if (remove.isPending) return;
    try {
      await remove.mutateAsync(debriefId);
      onOpenChange(false);
      toast.success("Debrief deleted.");
      if (navigateOnSuccess) router.push("/debrief");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete debrief.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this debrief?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the meeting summary and all extracted action
            items. GitHub issues you&apos;ve already created will remain.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
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
  );
}
