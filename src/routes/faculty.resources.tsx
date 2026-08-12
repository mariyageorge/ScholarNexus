import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, FileText, Upload, Plus, Download, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/faculty/resources")({
  head: () => ({
    meta: [
      { title: "Academic Resources — ScholarNexus AI Faculty" },
      { name: "description", content: "Lab datasets, literature databases, and faculty templates." },
    ],
  }),
  component: FacultyResourcesPage,
});

function FacultyResourcesPage() {
  interface Resource {
    id: string;
    title: string;
    category: string;
    updatedAt: string;
  }

  const [resources] = useState<Resource[]>([]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-blue-500/30 text-blue-500 bg-blue-500/10 text-xs font-semibold">
              Resource Repository
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Faculty Lab Resources & Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Share datasets, paper templates, and lab guidelines with your supervised scholars
            </p>
          </div>

          <Button className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
            <Upload className="h-4 w-4" /> Upload Resource
          </Button>
        </div>

        {resources.length === 0 ? (
          <Card className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
              <Bookmark className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-foreground text-base">No Resources Available</h3>
            <p className="text-xs text-muted-foreground mt-1">Upload lab datasets, guidelines, or paper templates to share with your scholars.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((res) => (
              <Card key={res.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[0.65rem] border-blue-500/30 text-blue-500 bg-blue-500/10">
                    {res.category}
                  </Badge>
                  <span className="text-[0.65rem] text-muted-foreground">{res.updatedAt}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-sm leading-snug">{res.title}</h3>
                </div>

                <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl text-xs font-semibold h-8">
                  <Download className="h-3.5 w-3.5" /> Download Asset
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
