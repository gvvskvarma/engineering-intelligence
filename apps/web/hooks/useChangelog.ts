"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ChangelogSummary {
  id: string;
  repo_full_name: string;
  date_from: string;
  date_to: string;
  created_at: string;
}

export interface ChangelogDetail extends ChangelogSummary {
  user_id: string;
  engineer_version: string | null;
  pm_version: string | null;
  customer_version: string | null;
  raw_activity: {
    pr_count: number;
    prs: Array<{
      number: number;
      title: string;
      author: string | null;
      html_url: string;
      labels: string[];
    }>;
  } | null;
}

export interface GenerateChangelogResult {
  id: string;
  pr_count: number;
  engineer_version: string;
  pm_version: string;
  customer_version: string;
}

export function useChangelogs() {
  return useQuery({
    queryKey: ["changelogs"],
    queryFn: () => apiFetch<{ changelogs: ChangelogSummary[] }>("/api/changelog"),
    select: (d) => d.changelogs,
  });
}

export function useChangelog(id: string | null) {
  return useQuery({
    queryKey: ["changelog", id],
    queryFn: () => apiFetch<ChangelogDetail>(`/api/changelog/${id}`),
    enabled: !!id,
  });
}

export function useGenerateChangelog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      repo_full_name: string;
      date_from: string;
      date_to: string;
    }) =>
      apiFetch<GenerateChangelogResult>("/api/changelog/generate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["changelogs"] });
    },
  });
}

export function useDeleteChangelog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: true }>(`/api/changelog/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["changelogs"] });
      qc.removeQueries({ queryKey: ["changelog", id] });
    },
  });
}
