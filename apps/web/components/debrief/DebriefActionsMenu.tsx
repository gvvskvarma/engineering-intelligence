"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameDebriefDialog } from "./RenameDebriefDialog";
import { DeleteDebriefDialog } from "./DeleteDebriefDialog";

interface DebriefActionsMenuProps {
  debriefId: string;
  currentTitle: string | null;
}

export function DebriefActionsMenu({
  debriefId,
  currentTitle,
}: DebriefActionsMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="More" />}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => setRenameOpen(true)}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete debrief
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameDebriefDialog
        debriefId={debriefId}
        currentTitle={currentTitle}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteDebriefDialog
        debriefId={debriefId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        navigateOnSuccess
      />
    </>
  );
}
