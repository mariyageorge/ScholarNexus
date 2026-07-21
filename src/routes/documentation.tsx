import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/documentation")({
  head: () => ({ meta: [{ title: "Documentation — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Documentation"
      description="API references, integration guides, and developer resources."
      icon={<BookOpen className="h-7 w-7" />}
    />
  ),
});
