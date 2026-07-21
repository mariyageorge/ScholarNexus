import { createFileRoute } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/citations")({
  head: () => ({
    meta: [
      { title: "Citation Generator — ScholarNexus AI" },
      {
        name: "description",
        content: "Generate properly formatted citations in APA, MLA, and more.",
      },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Citation Generator"
      description="Instantly produce accurate citations in APA, MLA, Chicago, IEEE, and Harvard styles."
      icon={<Quote className="h-7 w-7" />}
      actionLabel="Generate citation"
    />
  ),
});
