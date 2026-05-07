import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failUrl = new URL("/login", url.origin);
      failUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(failUrl);
    }

    // If this was a GitHub OAuth sign-in, capture the provider access token so the
    // backend can act on behalf of the user (create issues, list repos, etc.).
    const providerToken = data.session?.provider_token;
    const user = data.user;
    const meta = (user?.user_metadata ?? {}) as {
      user_name?: string;
      preferred_username?: string;
      avatar_url?: string;
    };
    const githubUsername = meta.user_name ?? meta.preferred_username;

    if (providerToken && user && githubUsername) {
      const admin = createAdminClient();
      await admin.from("github_connections").upsert(
        {
          user_id: user.id,
          github_username: githubUsername,
          access_token: providerToken,
          avatar_url: meta.avatar_url ?? null,
        },
        { onConflict: "user_id" }
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
