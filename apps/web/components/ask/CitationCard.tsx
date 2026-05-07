"use client";

import { useState } from "react";
import { ChevronRight, FileCode } from "lucide-react";
import type { AskCitation } from "@/hooks/useAsk";
import { cn } from "@/lib/utils";

interface CitationCardProps {
  citation: AskCitation;
  index: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
  const [open, setOpen] = useState(false);
  const range =
    citation.start_line && citation.end_line
      ? `${citation.start_line}-${citation.end_line}`
      : null;

  return (
    <div className="border rounded-md text-xs bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/40 transition-colors text-left"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
            open && "rotate-90"
          )}
        />
        <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground shrink-0">[{index + 1}]</span>
        <span className="font-mono truncate">
          {citation.file_path}
          {range && <span className="text-muted-foreground">:{range}</span>}
        </span>
        <span className="ml-auto text-muted-foreground shrink-0">
          {Math.round(citation.similarity * 100)}%
        </span>
      </button>
      {open && (
        <pre className="px-3 py-2 border-t text-[11px] leading-relaxed bg-muted/30 overflow-x-auto font-mono">
          <code>{citation.snippet}</code>
        </pre>
      )}
    </div>
  );
}
