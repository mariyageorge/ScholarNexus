import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — ScholarNexus AI" },
      { name: "description", content: "Your intelligent academic co-pilot." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="AI Research Assistant"
      description="Ask questions, summarize papers, and brainstorm hypotheses with an AI trained on academic rigor."
      icon={<Bot className="h-7 w-7" />}
      actionLabel="Start conversation"
    />
  ),
});
