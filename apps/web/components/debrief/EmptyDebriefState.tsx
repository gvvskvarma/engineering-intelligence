import Link from "next/link";
import { Mic, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyDebriefState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 px-6 flex flex-col items-center text-center">
        <div className="rounded-full border bg-muted/50 p-3 mb-4">
          <Mic className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-base">No debriefs yet</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Paste any meeting transcript and we&apos;ll extract action items with
          assignees, priorities, and due dates.
        </p>
        <Link href="/debrief/new" className={cn(buttonVariants(), "mt-5")}>
          <Plus className="mr-2 h-4 w-4" />
          New Debrief
        </Link>
      </CardContent>
    </Card>
  );
}
