import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, FileText, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "Research Papers — ScholarNexus AI" },
      { name: "description", content: "Select a research project workspace to manage papers." },
    ],
  }),
  component: () => {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl py-12">
          <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center space-y-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
              <FileText className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
                Project Workspace Required
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Research Papers Belong in a Workspace
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ScholarNexus organizes all literature collection, AI analysis, citations, and comparison matrices inside dedicated research project workspaces.
              </p>
            </div>

            <Button
              onClick={() => (window.location.href = "/projects")}
              className="gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
            >
              <FolderKanban className="h-4 w-4" /> Open Research Projects <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  },
});
