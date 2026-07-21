import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/downloads")({
  head: () => ({ meta: [{ title: "Downloads — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Downloads"
      description="Exported citations, reports, and downloaded research papers."
      icon={<Download className="h-7 w-7" />}
    />
  ),
});
