import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Admin Console"
      description="Manage users, roles, permissions, audit logs, and platform analytics."
      icon={<Shield className="h-7 w-7" />}
      actionLabel="Open controls"
    />
  ),
});
