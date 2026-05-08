"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DigestSummary {
  id: string;
  content: string;
  digest_date: string;
  created_at: string;
}

export interface DigestDetail extends DigestSummary {
  raw_activity: RawActivity | null;
  user_id: string;
}

export interface RawActivity {
  username: string;
  generated_for_date: string;
  prs_authored: ActivityItem[];
  prs_awaiting_review: ActivityItem[];
  issues_active: ActivityItem[];
  recent_pushes: PushItem[];
}

export interface ActivityItem {
  number: number;
  title: string;
  repo: string;
  url: string;
  state: string;
  draft?: boolean;
  updated_at: string;
  created_at: string;
  age_hours: number;
}

export interface PushItem {
  repo: string;
  branch: string;
  commit_count: number;
  head_message: string;
  pushed_at: string;
}

export interface GenerateResult {
  id: string;
  content: string;
  digest_date: string;
  raw_activity: RawActivity;
}

export function useDigests() {
  return useQuery({
    queryKey: ["digests"],
    queryFn: () => apiFetch<{ digests: DigestSummary[] }>("/api/digest"),
    select: (d) => d.digests,
  });
}

export function useDigest(id: string | null) {
  return useQuery({
    queryKey: ["digest", id],
    queryFn: () => apiFetch<DigestDetail>(`/api/digest/${id}`),
    enabled: !!id,
  });
}

export function useGenerateDigest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date?: string) =>
      apiFetch<GenerateResult>("/api/digest/generate", {
        method: "POST",
        body: JSON.stringify(date ? { date } : {}),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["digests"] });
      qc.setQueryData(["digest", data.id], data);
    },
  });
}
