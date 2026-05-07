import { ComingSoon } from "@/components/layout/ComingSoon";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DigestPage() {
  return (
    <>
      <PageHeader
        title="Daily Digest"
        description="Your morning briefing, synthesized from yesterday's GitHub activity."
      />
      <ComingSoon
        module="Daily Digest"
        phase="Phase 4"
        description="Pulls 24 hours of GitHub activity (PRs, reviews, commits, issues) and asks Gemini to synthesize it into a morning briefing with suggested priorities for the day."
      />
    </>
  );
}
