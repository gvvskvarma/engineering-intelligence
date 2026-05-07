"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAskQuestion, type AskCitation } from "@/hooks/useAsk";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CitationCard } from "./CitationCard";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: AskCitation[];
}

interface ChatInterfaceProps {
  repoId: string;
  repoFullName: string;
}

export function ChatInterface({ repoId, repoFullName }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const ask = useAskQuestion(repoId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, ask.isPending]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || ask.isPending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const result = await ask.mutateAsync(question);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          citations: result.citations,
        },
      ]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Question failed."
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            "Couldn't answer that one. The codebase may not have anything related, or the API hit a transient error. Try again.",
        },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-8 py-6">
        {messages.length === 0 ? (
          <EmptyState repoFullName={repoFullName} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {ask.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching the codebase…
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <div className="border-t bg-background">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto px-8 py-4 flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${repoFullName}…`}
            disabled={ask.isPending}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button type="submit" disabled={!input.trim() || ask.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="max-w-3xl mx-auto px-8 pb-3 text-[11px] text-muted-foreground">
          Cmd+Enter to send. Answers cite the specific files and lines they came from.
        </p>
      </div>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
      {message.citations && message.citations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sources
          </p>
          <div className="space-y-1.5">
            {message.citations.map((c, i) => (
              <CitationCard key={`${c.file_path}-${i}`} citation={c} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ repoFullName }: { repoFullName: string }) {
  const examples = [
    "Where is the auth flow handled?",
    "What database tables does this project use?",
    "How are GitHub issues created from action items?",
  ];
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className={cn("inline-flex items-center justify-center rounded-full border bg-muted/50 p-3 mb-4")}>
        <Sparkles className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-semibold">Ask anything about {repoFullName}</h2>
      <p className="text-sm text-muted-foreground mt-1.5">
        Answers come with file path and line citations from the indexed code.
      </p>
      <Card className="mt-6 text-left">
        <CardContent className="p-4 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Try asking
          </p>
          {examples.map((q) => (
            <p key={q} className="text-sm font-mono text-muted-foreground">
              · {q}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
