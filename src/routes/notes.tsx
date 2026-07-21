import { createFileRoute } from "@tanstack/react-router";
import { StickyNote } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Research Notes"
      description="Capture ideas, annotations, and synthesis linked to your papers and projects."
      icon={<StickyNote className="h-7 w-7" />}
      actionLabel="New note"
    />
  ),
});
