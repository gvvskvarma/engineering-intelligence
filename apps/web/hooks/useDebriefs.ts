"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ActionItem, Debrief, DebriefStatus } from "@/lib/types";

export interface DebriefListItem {
  id: string;
  title: string | null;
  summary: string | null;
  status: DebriefStatus;
  created_at: string;
  action_item_count: number;
}

export interface DebriefDetail {
  debrief: Debrief;
  action_items: ActionItem[];
}

export function useDebriefs() {
  return useQuery({
    queryKey: ["debriefs"],
    queryFn: () => apiFetch<{ debriefs: DebriefListItem[] }>("/api/debrief"),
    select: (d) => d.debriefs,
  });
}

export function useDebrief(id: string | null) {
  return useQuery({
    queryKey: ["debrief", id],
    queryFn: () => apiFetch<DebriefDetail>(`/api/debrief/${id}`),
    enabled: !!id,
  });
}

export function useProcessDebrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { transcript: string; title?: string }) =>
      apiFetch<{ debrief_id: string }>("/api/debrief/process", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debriefs"] });
    },
  });
}
