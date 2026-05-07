"use client";

import { Calendar, User } from "lucide-react";
import type { ActionItem, Priority } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActionItemCardProps {
  item: ActionItem;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-muted text-muted-foreground hover:bg-muted",
};

export function ActionItemCard({ item }: ActionItemCardProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug">{item.title}</h3>
          <Badge variant="secondary" className={cn("shrink-0", PRIORITY_STYLES[item.priority])}>
            {item.priority}
          </Badge>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {item.assignee && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {item.assignee}
            </span>
          )}
          {item.due_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {item.due_date}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
