import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ScholarNexus AI" },
      { name: "description", content: "Manage your workspace, theme, and preferences." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Settings"
      description="Customize your workspace, notification preferences, and AI behavior."
      icon={<SettingsIcon className="h-7 w-7" />}
    />
  ),
});
