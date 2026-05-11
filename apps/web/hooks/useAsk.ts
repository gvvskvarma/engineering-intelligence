"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CodeRepo } from "@/lib/types";

export interface AskCitation {
  file_path: string;
  language: string | null;
  start_line: number | null;
  end_line: number | null;
  snippet: string;
  similarity: number;
}

export interface AskResult {
  answer: string;
  citations: AskCitation[];
}

export function useCodeRepos() {
  return useQuery({
    queryKey: ["code-repos"],
    queryFn: () => apiFetch<{ repos: CodeRepo[] }>("/api/ask/repos"),
    select: (d) => d.repos,
    refetchInterval: (query) => {
      const repos = query.state.data?.repos ?? [];
      const anyActive = repos.some(
        (r) => r.status === "indexing" || r.status === "pending"
      );
      return anyActive ? 3000 : false;
    },
  });
}

export function useCodeRepo(id: string | null) {
  return useQuery({
    queryKey: ["code-repo", id],
    queryFn: () => apiFetch<CodeRepo>(`/api/ask/repos/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "indexing" || status === "pending" ? 2500 : false;
    },
  });
}

export function useIndexRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repo_full_name: string) =>
      apiFetch<{ repo_id: string; status: string }>("/api/ask/index", {
        method: "POST",
        body: JSON.stringify({ repo_full_name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["code-repos"] });
    },
  });
}

export function useDeleteRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoId: string) =>
      apiFetch<{ deleted: true }>(`/api/ask/repos/${repoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["code-repos"] });
    },
  });
}

export function useAskQuestion(repoId: string) {
  return useMutation({
    mutationFn: (question: string) =>
      apiFetch<AskResult>("/api/ask/query", {
        method: "POST",
        body: JSON.stringify({ repo_id: repoId, question }),
      }),
  });
}
