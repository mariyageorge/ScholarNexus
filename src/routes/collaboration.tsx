import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/collaboration")({
  head: () => ({
    meta: [
      { title: "Faculty Collaboration — ScholarNexus AI" },
      { name: "description", content: "Collaborate with faculty and peers on research." },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Faculty Collaboration"
      description="Share projects, exchange feedback, and co-author work with mentors and peers."
      icon={<Users className="h-7 w-7" />}
      actionLabel="Invite people"
    />
  ),
});
