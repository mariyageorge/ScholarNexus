import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Center — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Help Center"
      description="Guides, articles, and answers to help you get the most from ScholarNexus AI."
      icon={<LifeBuoy className="h-7 w-7" />}
    />
  ),
});
