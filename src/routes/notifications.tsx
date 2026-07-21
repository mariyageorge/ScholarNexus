import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ScholarNexus AI" },
      { name: "description", content: "All your research updates in one place." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Notifications"
      description="Stay informed about project updates, feedback, and AI-driven research insights."
      icon={<Bell className="h-7 w-7" />}
    />
  ),
});
