import { ComingSoon } from "@/components/layout/ComingSoon";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DebriefPage() {
  return (
    <>
      <PageHeader
        title="Meeting Debrief"
        description="Transcripts in, action items and GitHub issues out."
      />
      <ComingSoon
        module="Meeting Debrief"
        phase="Phase 2"
        description="Paste a meeting transcript and Gemini extracts action items with assignees, priorities, and due dates. Create GitHub issues from any item with one click."
      />
    </>
  );
}
