import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Recent Activity — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Recent Activity"
      description="A timeline of your uploads, edits, comments, and AI interactions."
      icon={<History className="h-7 w-7" />}
    />
  ),
});
