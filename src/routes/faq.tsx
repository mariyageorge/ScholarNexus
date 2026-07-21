import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Frequently Asked Questions"
      description="Answers to common questions about accounts, features, and workflows."
      icon={<HelpCircle className="h-7 w-7" />}
    />
  ),
});
