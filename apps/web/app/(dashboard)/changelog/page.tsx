import { ComingSoon } from "@/components/layout/ComingSoon";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        title="Changelog Generator"
        description="Three audience-tuned changelogs from one set of merged PRs."
      />
      <ComingSoon
        module="Changelog Generator"
        phase="Phase 5"
        description="Pick a repo and date range, and Gemini writes three changelogs in parallel: one for engineers (technical), one for product (capabilities), and one for customers (plain English benefits)."
      />
    </>
  );
}
