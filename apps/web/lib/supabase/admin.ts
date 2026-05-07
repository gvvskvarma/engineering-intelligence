import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — use only in route handlers / server components,
// never in client components or client-bundled code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
