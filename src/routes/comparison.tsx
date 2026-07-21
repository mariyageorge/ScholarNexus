import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/comparison")({
  head: () => ({
    meta: [
      { title: "Paper Comparison — ScholarNexus AI" },
      { name: "description", content: "Compare research papers side-by-side with AI insights." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Paper Comparison"
      description="Analyze methodologies, findings, and citations across multiple papers in a single view."
      icon={<GitCompareArrows className="h-7 w-7" />}
      actionLabel="Compare papers"
    />
  ),
});
