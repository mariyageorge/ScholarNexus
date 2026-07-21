import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Research Calendar"
      description="Milestones, submissions, and review dates in one timeline view."
      icon={<Calendar className="h-7 w-7" />}
    />
  ),
});
