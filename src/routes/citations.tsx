import { createFileRoute } from "@tanstack/react-router";
import { Quote, FolderKanban, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard-layout";

export const Route = createFileRoute("/citations")({
  head: () => ({
    meta: [
      { title: "Citation Generator — ScholarNexus AI" },
      { name: "description", content: "Generate APA, MLA, Chicago, and IEEE citations inside project workspaces." },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl py-12">
        <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center space-y-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Quote className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md">
            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Project Workspace Scoped
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Citations Are Project-Scoped
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate formatted citations in APA, MLA, Chicago, and IEEE standards directly from literature saved in your research project workspace.
            </p>
          </div>

          <Button
            onClick={() => (window.location.href = "/projects")}
            className="gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
          >
            <FolderKanban className="h-4 w-4" /> Open Project Workspace <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  ),
});
