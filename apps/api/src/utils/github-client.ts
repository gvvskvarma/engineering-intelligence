import { Octokit } from "@octokit/rest";
import { supabaseAdmin } from "./supabase";

export class GithubNotConnectedError extends Error {
  constructor() {
    super("GitHub is not connected. Sign out and sign in again with GitHub.");
    this.name = "GithubNotConnectedError";
  }
}

export async function octokitForUser(userId: string): Promise<Octokit> {
  const { data, error } = await supabaseAdmin
    .from("github_connections")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`github_connections lookup failed: ${error.message}`);
  if (!data?.access_token) throw new GithubNotConnectedError();
  return new Octokit({ auth: data.access_token });
}
