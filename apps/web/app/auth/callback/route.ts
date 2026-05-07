import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failUrl = new URL("/login", url.origin);
      failUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(failUrl);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
