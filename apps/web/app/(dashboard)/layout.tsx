import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    user_name?: string;
    avatar_url?: string;
  };

  const sidebarUser = {
    email: user.email ?? null,
    name: meta.full_name ?? meta.name ?? meta.user_name ?? null,
    avatarUrl: meta.avatar_url ?? null,
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar user={sidebarUser} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
