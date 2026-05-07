"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface GithubRepo {
  full_name: string;
  name: string;
  private: boolean;
  owner: string;
  default_branch: string;
  pushed_at: string | null;
}

export function useGithubRepos(enabled: boolean) {
  return useQuery({
    queryKey: ["github", "repos"],
    queryFn: () => apiFetch<{ repos: GithubRepo[] }>("/api/github/repos"),
    select: (d) => d.repos,
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateGithubIssue(debriefId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { action_item_id: string; repo_full_name: string }) =>
      apiFetch<{ issue_url: string; issue_number: number }>(
        "/api/github/create-issue",
        { method: "POST", body: JSON.stringify(input) }
      ),
    onSuccess: () => {
      if (debriefId) {
        qc.invalidateQueries({ queryKey: ["debrief", debriefId] });
      }
    },
  });
}
