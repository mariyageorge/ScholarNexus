import { createFileRoute } from "@tanstack/react-router";
import { ScanSearch } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/similarity")({
  head: () => ({
    meta: [
      { title: "Similarity Checker — ScholarNexus AI" },
      { name: "description", content: "Detect similarity and overlap across sources." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Similarity Checker"
      description="Upload a document to detect textual overlap and ensure originality of your work."
      icon={<ScanSearch className="h-7 w-7" />}
      actionLabel="Upload document"
    />
  ),
});
