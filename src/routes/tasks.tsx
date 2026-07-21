import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Task Management"
      description="Organize research to-dos, deadlines, and sub-tasks across projects."
      icon={<CheckSquare className="h-7 w-7" />}
      actionLabel="Add task"
    />
  ),
});
