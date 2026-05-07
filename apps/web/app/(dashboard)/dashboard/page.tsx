import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Mic,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

const MODULES: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status: "available" | "coming-soon";
}[] = [
  {
    href: "/debrief",
    icon: Mic,
    title: "Meeting Debrief",
    description:
      "Paste a meeting transcript. Get structured action items with assignees and one-click GitHub issues.",
    status: "coming-soon",
  },
  {
    href: "/ask",
    icon: Search,
    title: "Codebase Q&A",
    description:
      "Connect a GitHub repo. Ask natural-language questions and get answers with file and line citations.",
    status: "coming-soon",
  },
  {
    href: "/digest",
    icon: Sun,
    title: "Daily Digest",
    description:
      "A morning briefing synthesized from yesterday's GitHub activity and today's review queue.",
    status: "coming-soon",
  },
  {
    href: "/changelog",
    icon: ClipboardList,
    title: "Changelog Generator",
    description:
      "Pick a repo and date range. Get three changelogs tuned for engineers, PMs, and customers.",
    status: "coming-soon",
  },
];

export default async function DashboardHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = (user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    user_name?: string;
  };
  const greeting =
    meta.full_name?.split(" ")[0] ??
    meta.name?.split(" ")[0] ??
    meta.user_name ??
    "there";

  return (
    <>
      <PageHeader
        title={`Hey, ${greeting}.`}
        description="Pick a module to get started. New work shows up here."
      />
      <div className="px-8 py-8">
        <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
          {MODULES.map(({ href, icon: Icon, title, description, status }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-all hover:border-foreground/20 hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-md border bg-muted/50 p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    {status === "coming-soon" && (
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3 flex items-center gap-1.5">
                    {title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
