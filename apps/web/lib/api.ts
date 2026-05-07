import { createClient } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  let session = data.session;

  // Proactively refresh if the token is within 60s of expiring so a long-lived
  // tab doesn't fire a request with a just-expired JWT.
  if (session?.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = session.expires_at - now;
    if (expiresIn < 60) {
      const refreshed = await supabase.auth.refreshSession();
      session = refreshed.data.session ?? session;
    }
  }
  return session?.access_token ?? null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    // Session is gone or rejected by the server. Push the user to /login so
    // they re-auth instead of seeing a confusing "missing bearer token" toast.
    if (typeof window !== "undefined") {
      const here = window.location.pathname + window.location.search;
      const url = `/login?redirect=${encodeURIComponent(here)}`;
      window.location.assign(url);
    }
    throw new Error("Your session expired. Redirecting to sign in…");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
