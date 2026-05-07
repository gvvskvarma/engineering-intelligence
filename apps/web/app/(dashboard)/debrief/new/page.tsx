"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useProcessDebrief } from "@/hooks/useDebriefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewDebriefPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const process = useProcessDebrief();

  const tooShort = transcript.trim().length < 50;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (process.isPending || tooShort) return;
    try {
      const result = await process.mutateAsync({
        transcript,
        title: title.trim() || undefined,
      });
      router.push(`/debrief/${result.debrief_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process meeting.");
    }
  }

  return (
    <>
      <PageHeader
        title="New Debrief"
        description="Paste a meeting transcript and we'll do the rest."
      />
      <div className="px-8 py-8">
        <Card className="max-w-3xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-sm font-medium">
                  Meeting title <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  id="title"
                  placeholder="e.g. Q3 planning sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={process.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="transcript" className="text-sm font-medium">
                  Transcript
                </label>
                <Textarea
                  id="transcript"
                  placeholder="Paste the meeting transcript here. The more detail, the better the action items."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={process.isPending}
                  className="min-h-[320px] font-mono text-xs leading-relaxed"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {transcript.trim().length} characters
                  {tooShort && transcript.length > 0 && " — at least 50 needed"}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={process.isPending || tooShort}
                >
                  {process.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting action items…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Process Meeting
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
