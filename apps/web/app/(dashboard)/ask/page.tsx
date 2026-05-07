import { ComingSoon } from "@/components/layout/ComingSoon";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AskPage() {
  return (
    <>
      <PageHeader
        title="Codebase Q&A"
        description="Ask questions of any GitHub repo and get cited answers."
      />
      <ComingSoon
        module="Codebase Q&A"
        phase="Phase 3"
        description="Connect a GitHub repo, the indexer chunks and embeds it, and you can ask natural-language questions. Answers stream in with file and line-number citations."
      />
    </>
  );
}
