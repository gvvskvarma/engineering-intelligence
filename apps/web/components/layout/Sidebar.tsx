"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  Mic,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Debrief", href: "/debrief", icon: Mic },
  { label: "Ask", href: "/ask", icon: Search },
  { label: "Digest", href: "/digest", icon: Sun },
  { label: "Changelog", href: "/changelog", icon: ClipboardList },
];

interface SidebarProps {
  user: {
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
      <div className="px-5 py-5 border-b">
        <Link href="/dashboard" className="font-semibold tracking-tight text-sm">
          Engineering Intelligence
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
