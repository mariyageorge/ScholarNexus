import { createFileRoute } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — ScholarNexus AI" }] }),
  component: () => (
    <PagePlaceholder
      title="Bookmarks & Favorites"
      description="Quick access to saved papers, authors, and search queries."
      icon={<Bookmark className="h-7 w-7" />}
    />
  ),
});
