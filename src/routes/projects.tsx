import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Research Projects — ScholarNexus AI" },
      { name: "description", content: "Organize and track your academic research projects." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Research Projects"
      description="Plan, track, and manage every stage of your research work — from proposal to publication."
      icon={<FolderKanban className="h-7 w-7" />}
      actionLabel="New project"
    />
  ),
});
